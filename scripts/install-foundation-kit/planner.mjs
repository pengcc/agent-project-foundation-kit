import { lstat, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { InstallerError } from "./errors.mjs";
import { hashFile, pathStats } from "./fs-safe.mjs";
import { buildMappings } from "./mapping.mjs";
import { assertInside, assertNoTargetSymlinks, assertRelativePathSafe } from "./path-boundary.mjs";

function planFingerprint(entries) {
  return JSON.stringify(
    entries.map((entry) => ({
      sourceRelative: entry.sourceRelative,
      targetRelative: entry.targetRelative,
      sourceSha256: entry.sourceSha256,
      targetSha256: entry.targetSha256,
      contentState: entry.contentState,
      ownership: entry.ownership,
      migrationState: entry.migrationState,
      collisionPath: entry.collisionPath,
      action: entry.action,
      optionalName: entry.optionalName ?? "",
    })),
  );
}

function ownershipFor(mapping) {
  if (mapping.category === "optional") return "optional";
  if (mapping.targetRelative === "AGENTS.md") return "entrypoint";
  if (mapping.targetRelative.startsWith(".codex/project/")) return "project-memory";
  if (mapping.targetRelative.startsWith(".codex/scripts/")) return "workflow-script";
  return "reusable";
}

async function firstExistingPath(targetRoot, candidates) {
  for (const candidate of candidates) {
    if (await pathStats(resolve(targetRoot, candidate))) return candidate;
  }
  return "";
}

async function migrationCollisionFor(mapping, targetRoot, contentState) {
  if (contentState !== "new") return "";
  if (mapping.category === "optional") {
    const name = mapping.optionalName;
    return firstExistingPath(targetRoot, [
      `.codex/skills/core/${name}`,
      `.codex/skills/meta/${name}`,
    ]);
  }

  const match = mapping.targetRelative.match(/^\.codex\/skills\/meta\/([^/]+)\//);
  if (!match) return "";
  const name = match[1];
  const candidates = [`.codex/skills/core/${name}`];
  if (name === "writing-great-skills") candidates.push(".codex/skills/core/write-a-skill");
  return firstExistingPath(targetRoot, candidates);
}

function actionFor({ contentState, ownership, migrationState }) {
  if (contentState === "new") {
    return migrationState === "legacy-path-collision" ? "migration-review" : "write";
  }
  if (contentState === "existing-identical") return "skip-identical";
  if (ownership === "project-memory") return "preserve";
  if (ownership === "entrypoint") return "manual-merge";
  if (ownership === "workflow-script") return "script-merge";
  return "review";
}

export async function buildInstallPlan({ kitRoot, targetRoot, includeOptional = [] }) {
  const entries = [];
  for (const mapping of await buildMappings(kitRoot, { includeOptional })) {
    assertRelativePathSafe(mapping.sourceRelative, "Source path");
    assertRelativePathSafe(mapping.targetRelative, "Target path");
    const sourcePath = resolve(kitRoot, mapping.sourceRelative);
    const sourceStats = await lstat(sourcePath);
    if (sourceStats.isSymbolicLink() || !sourceStats.isFile()) {
      throw new InstallerError(
        "INVALID_SOURCE",
        `Mapped source must be a regular file: ${mapping.sourceRelative}`,
      );
    }
    assertInside(kitRoot, await realpath(sourcePath), "Source file");
    await assertNoTargetSymlinks(targetRoot, mapping.targetRelative);
    const targetPath = resolve(targetRoot, mapping.targetRelative);
    const targetStats = await pathStats(targetPath);
    if (targetStats && !targetStats.isFile()) {
      throw new InstallerError(
        "INVALID_TARGET",
        `Mapped target exists but is not a regular file: ${mapping.targetRelative}`,
      );
    }
    const sourceSha256 = await hashFile(sourcePath);
    const targetSha256 = targetStats ? await hashFile(targetPath) : "";
    const contentState = targetStats
      ? targetSha256 === sourceSha256
        ? "existing-identical"
        : "existing-different"
      : "new";
    const ownership = ownershipFor(mapping);
    const collisionPath = await migrationCollisionFor(mapping, targetRoot, contentState);
    const migrationState = collisionPath ? "legacy-path-collision" : "none";
    entries.push({
      ...mapping,
      contentState,
      ownership,
      migrationState,
      collisionPath,
      action: actionFor({ contentState, ownership, migrationState }),
      sourceSha256,
      targetSha256,
    });
  }
  const frozenEntries = entries.map((entry) => Object.freeze(entry));
  return Object.freeze({
    entries: Object.freeze(frozenEntries),
    fingerprint: planFingerprint(frozenEntries),
    total: frozenEntries.length,
    newFiles: frozenEntries.filter((entry) => entry.contentState === "new").length,
    writableNewFiles: frozenEntries.filter((entry) => entry.action === "write").length,
    identicalFiles: frozenEntries.filter((entry) => entry.contentState === "existing-identical")
      .length,
    differentFiles: frozenEntries.filter((entry) => entry.contentState === "existing-different")
      .length,
    conflicts: frozenEntries.filter((entry) => entry.contentState === "existing-different").length,
    preservedFiles: frozenEntries.filter((entry) => entry.action === "preserve").length,
    mergeFiles: frozenEntries.filter((entry) => entry.action === "manual-merge").length,
    scriptMergeFiles: frozenEntries.filter((entry) => entry.action === "script-merge").length,
    migrationReviews: frozenEntries.filter((entry) => entry.action === "migration-review").length,
    optionalSelectedFiles: frozenEntries.filter((entry) => entry.ownership === "optional").length,
    reviewItems: frozenEntries.filter((entry) =>
      ["review", "manual-merge", "script-merge", "migration-review"].includes(entry.action),
    ).length,
    selectedOptionalSkills: Object.freeze([...new Set(includeOptional)].sort()),
  });
}

export async function revalidateInstallPlan({
  expected,
  kitRoot,
  targetRoot,
  includeOptional = [],
}) {
  const current = await buildInstallPlan({ kitRoot, targetRoot, includeOptional });
  if (current.fingerprint !== expected.fingerprint) {
    throw new InstallerError(
      "PLAN_DRIFT",
      "Source or target state changed after planning. Run the installer again.",
    );
  }
  return current;
}
