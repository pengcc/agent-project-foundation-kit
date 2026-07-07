import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { InstallerError, throwIfAborted } from "./errors.mjs";
import { atomicWriteTextIntoTarget, hashFile, pathStats } from "./fs-safe.mjs";
import { assertNoTargetSymlinks } from "./path-boundary.mjs";

export const PUBLISH_PACKAGE_ALIASES = Object.freeze({
  "publish:changes": "node .codex/scripts/publish-changes.mjs",
  "pr:review": "node .codex/scripts/publish-changes.mjs --mode pr-review",
  "pr:merge": "node .codex/scripts/publish-changes.mjs --mode pr-merge",
  "pr:auto-merge": "node .codex/scripts/publish-changes.mjs --mode pr-merge --auto-merge",
});

export const PUBLISH_SCRIPT_FALLBACK = "node .codex/scripts/publish-changes.mjs";
const PACKAGE_JSON = "package.json";

function hashText(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function freezeEntries(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

function skippedPlan({ reason, originalSha256 = "", mode = 0 }) {
  return Object.freeze({
    status: "skipped",
    skippedReason: reason,
    targetRelative: PACKAGE_JSON,
    originalSha256,
    replacementSha256: "",
    originalMode: mode,
    replacementContents: "",
    added: Object.freeze([]),
    alreadyCurrent: Object.freeze([]),
    conflicts: Object.freeze([]),
  });
}

function formattingFor(contents) {
  const indentation = contents.match(/\r?\n([\t ]+)"/)?.[1] ?? null;
  return {
    indentation,
    lineEnding: contents.includes("\r\n") ? "\r\n" : "\n",
    trailingNewline: contents.endsWith("\n"),
  };
}

function serializePackage(value, originalContents) {
  const formatting = formattingFor(originalContents);
  let contents = JSON.stringify(value, null, formatting.indentation);
  if (formatting.lineEnding === "\r\n") contents = contents.replaceAll("\n", "\r\n");
  if (formatting.trailingNewline) contents += formatting.lineEnding;
  return contents;
}

export function publishAliasPlanFingerprint(plan) {
  return JSON.stringify({
    status: plan.status,
    skippedReason: plan.skippedReason,
    targetRelative: plan.targetRelative,
    originalSha256: plan.originalSha256,
    replacementSha256: plan.replacementSha256,
    added: plan.added,
    alreadyCurrent: plan.alreadyCurrent,
    conflicts: plan.conflicts,
  });
}

export async function planPublishAliases(targetRoot) {
  await assertNoTargetSymlinks(targetRoot, PACKAGE_JSON);
  const packagePath = resolve(targetRoot, PACKAGE_JSON);
  const stats = await pathStats(packagePath);
  if (!stats) return skippedPlan({ reason: "package-json-missing" });
  if (!stats.isFile()) {
    return skippedPlan({ reason: "package-json-not-regular", mode: stats.mode });
  }

  const originalContents = await readFile(packagePath, "utf8");
  const originalSha256 = hashText(originalContents);
  let packageValue;
  try {
    packageValue = JSON.parse(originalContents);
  } catch {
    return skippedPlan({ reason: "package-json-invalid", originalSha256, mode: stats.mode });
  }
  if (!packageValue || typeof packageValue !== "object" || Array.isArray(packageValue)) {
    return skippedPlan({ reason: "package-json-non-object", originalSha256, mode: stats.mode });
  }
  if (
    packageValue.scripts !== undefined &&
    (!packageValue.scripts ||
      typeof packageValue.scripts !== "object" ||
      Array.isArray(packageValue.scripts))
  ) {
    return skippedPlan({
      reason: "package-json-scripts-non-object",
      originalSha256,
      mode: stats.mode,
    });
  }

  const scripts = packageValue.scripts ?? {};
  const added = [];
  const alreadyCurrent = [];
  const conflicts = [];
  for (const [name, defaultValue] of Object.entries(PUBLISH_PACKAGE_ALIASES)) {
    if (!Object.hasOwn(scripts, name)) {
      added.push({ name, defaultValue });
    } else if (scripts[name] === defaultValue) {
      alreadyCurrent.push({ name, defaultValue });
    } else {
      conflicts.push({ name, existingValue: scripts[name], defaultValue });
    }
  }

  let replacementContents = "";
  let replacementSha256 = "";
  if (added.length) {
    const nextScripts = { ...scripts };
    for (const entry of added) nextScripts[entry.name] = entry.defaultValue;
    replacementContents = serializePackage(
      { ...packageValue, scripts: nextScripts },
      originalContents,
    );
    replacementSha256 = hashText(replacementContents);
  }

  return Object.freeze({
    status: added.length ? "ready" : "no-changes",
    skippedReason: "",
    targetRelative: PACKAGE_JSON,
    originalSha256,
    replacementSha256,
    originalMode: stats.mode & 0o7777,
    replacementContents,
    added: freezeEntries(added),
    alreadyCurrent: freezeEntries(alreadyCurrent),
    conflicts: freezeEntries(conflicts),
  });
}

export async function revalidatePublishAliasPlan({ expected, targetRoot }) {
  const current = await planPublishAliases(targetRoot);
  if (publishAliasPlanFingerprint(current) !== publishAliasPlanFingerprint(expected)) {
    throw new InstallerError(
      "PLAN_DRIFT",
      "Target package.json changed after publish aliases were planned. Run the installer again.",
    );
  }
  return current;
}

export async function applyPublishAliases({ plan, targetRoot, signal }) {
  if (!plan.added.length) return false;
  throwIfAborted(signal);
  await revalidatePublishAliasPlan({ expected: plan, targetRoot });
  await atomicWriteTextIntoTarget({
    contents: plan.replacementContents,
    mode: plan.originalMode,
    targetRoot,
    targetRelative: plan.targetRelative,
    signal,
  });
  if ((await hashFile(resolve(targetRoot, plan.targetRelative))) !== plan.replacementSha256) {
    throw new InstallerError(
      "INSTALL_VERIFICATION_FAILED",
      "Installed package.json publish aliases did not match the planned content.",
    );
  }
  const installed = JSON.parse(await readFile(resolve(targetRoot, plan.targetRelative), "utf8"));
  for (const entry of plan.added) {
    if (installed.scripts?.[entry.name] !== entry.defaultValue) {
      throw new InstallerError(
        "INSTALL_VERIFICATION_FAILED",
        `Installed publish alias did not match the planned value: ${entry.name}`,
      );
    }
  }
  return true;
}
