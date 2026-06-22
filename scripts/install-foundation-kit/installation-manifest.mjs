import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { InstallerError } from "./errors.mjs";
import { hashFile, pathStats, writeJsonAtomic } from "./fs-safe.mjs";
import { assertInside, assertNoTargetSymlinks, assertRelativePathSafe } from "./path-boundary.mjs";

export const INSTALLATION_MANIFEST_RELATIVE = ".codex/foundation-kit/installation-manifest.json";

const SHA256 = /^[a-f0-9]{64}$/;

function canonicalFiles(files) {
  return Object.fromEntries(
    Object.entries(files)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([target, record]) => [
        target,
        {
          source: record.source,
          ownership: record.ownership,
          mode: record.mode,
          baselineSha256: record.baselineSha256,
        },
      ]),
  );
}

export function manifestPayloadSha256(files) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalFiles(files)))
    .digest("hex");
}

function invalid(fileSha256, issues) {
  return Object.freeze({
    status: "invalid",
    fileSha256,
    manifest: null,
    issues: Object.freeze(issues),
  });
}

function validateRecord(target, record, issues) {
  try {
    assertRelativePathSafe(target, "Manifest target path");
  } catch (error) {
    issues.push(error.message);
    return;
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    issues.push(`Manifest record must be an object: ${target}`);
    return;
  }
  try {
    assertRelativePathSafe(record.source, `Manifest source path for ${target}`);
  } catch (error) {
    issues.push(error.message);
  }
  if (record.ownership !== "kit-managed") {
    issues.push(`Manifest ownership must be kit-managed: ${target}`);
  }
  if (record.mode !== "full-file") {
    issues.push(`Manifest mode must be full-file: ${target}`);
  }
  if (!SHA256.test(record.baselineSha256 ?? "")) {
    issues.push(`Manifest baselineSha256 is invalid: ${target}`);
  }
}

export function validateInstallationManifest(value, fileSha256 = "") {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalid(fileSha256, ["Installation manifest must be a JSON object."]);
  }
  if (value.schemaVersion !== 1) {
    issues.push(`Unsupported installation manifest schemaVersion: ${value.schemaVersion}`);
  }
  if (!value.files || typeof value.files !== "object" || Array.isArray(value.files)) {
    issues.push("Installation manifest files must be an object.");
  }
  const files =
    value.files && typeof value.files === "object" && !Array.isArray(value.files)
      ? value.files
      : {};
  for (const [target, record] of Object.entries(files)) validateRecord(target, record, issues);
  if (!SHA256.test(value.payloadSha256 ?? "")) {
    issues.push("Installation manifest payloadSha256 is invalid.");
  } else if (value.payloadSha256 !== manifestPayloadSha256(files)) {
    issues.push("Installation manifest payloadSha256 does not match its file records.");
  }
  if (issues.length) return invalid(fileSha256, issues);
  const manifest = Object.freeze({
    schemaVersion: 1,
    payloadSha256: value.payloadSha256,
    files: Object.freeze(canonicalFiles(files)),
  });
  return Object.freeze({
    status: "valid",
    fileSha256,
    manifest,
    issues: Object.freeze([]),
  });
}

export async function loadInstallationManifest(targetRoot) {
  const path = resolve(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  assertInside(targetRoot, path, "Installation manifest");
  try {
    await assertNoTargetSymlinks(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  } catch (error) {
    return invalid("", [error.message]);
  }
  const stats = await pathStats(path);
  if (!stats) {
    return Object.freeze({
      status: "missing",
      fileSha256: "",
      manifest: null,
      issues: Object.freeze([]),
    });
  }
  if (!stats.isFile() || stats.isSymbolicLink()) {
    return invalid("", ["Installation manifest must be a regular file."]);
  }
  const contents = await readFile(path);
  const fileSha256 = createHash("sha256").update(contents).digest("hex");
  try {
    return validateInstallationManifest(JSON.parse(contents.toString("utf8")), fileSha256);
  } catch (error) {
    return invalid(fileSha256, [`Installation manifest is not valid JSON: ${error.message}`]);
  }
}

function recordFor(entry) {
  return {
    source: entry.sourceRelative,
    ownership: "kit-managed",
    mode: "full-file",
    baselineSha256: entry.sourceSha256,
  };
}

export function createNextInstallationManifest({ plan, completedTargets = [] }) {
  const files = { ...(plan.installationManifest.manifest?.files ?? {}) };
  const completed = new Set(completedTargets);
  for (const entry of plan.entries) {
    if (entry.mappingState === "source-no-longer-mapped") continue;
    if (entry.ownership !== "kit-managed") continue;
    if (completed.has(entry.targetRelative)) {
      files[entry.targetRelative] = recordFor(entry);
      continue;
    }
    if (entry.contentState === "existing-identical" && entry.baselineAdoptable) {
      files[entry.targetRelative] = recordFor(entry);
    }
  }
  const canonical = canonicalFiles(files);
  return Object.freeze({
    schemaVersion: 1,
    payloadSha256: manifestPayloadSha256(canonical),
    files: Object.freeze(canonical),
  });
}

export async function verifyManifestCandidates({ plan, targetRoot, completedTargets = [] }) {
  const completed = new Set(completedTargets);
  for (const entry of plan.entries) {
    const shouldVerify =
      entry.ownership === "kit-managed" &&
      (completed.has(entry.targetRelative) ||
        (entry.contentState === "existing-identical" && entry.baselineAdoptable));
    if (!shouldVerify) continue;
    await assertNoTargetSymlinks(targetRoot, entry.targetRelative);
    const targetPath = resolve(targetRoot, entry.targetRelative);
    const stats = await lstat(targetPath).catch(() => null);
    if (!stats?.isFile() || (await hashFile(targetPath)) !== entry.sourceSha256) {
      throw new InstallerError(
        "PLAN_DRIFT",
        `Target changed before installation manifest update: ${entry.targetRelative}`,
      );
    }
  }
}

export async function writeInstallationManifest({ targetRoot, expected, manifest }) {
  const current = await loadInstallationManifest(targetRoot);
  if (current.status !== expected.status || current.fileSha256 !== expected.fileSha256) {
    throw new InstallerError(
      "PLAN_DRIFT",
      "Installation manifest changed after planning. Run the installer again.",
    );
  }
  await assertNoTargetSymlinks(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  const path = resolve(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  assertInside(targetRoot, path, "Installation manifest");
  await writeJsonAtomic(path, manifest);
  const written = await loadInstallationManifest(targetRoot);
  if (written.status !== "valid" || written.manifest.payloadSha256 !== manifest.payloadSha256) {
    throw new InstallerError(
      "INSTALL_VERIFICATION_FAILED",
      "Installed foundation-kit manifest failed verification.",
    );
  }
  return INSTALLATION_MANIFEST_RELATIVE;
}

export async function restoreInstallationManifest({ targetRoot, previous }) {
  if (previous.status !== "valid" || !previous.manifest) {
    throw new InstallerError(
      "INSTALL_ROLLBACK_FAILED",
      "Cannot restore the previous installation manifest because it was not valid.",
    );
  }
  await assertNoTargetSymlinks(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  const path = resolve(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  assertInside(targetRoot, path, "Installation manifest");
  await writeJsonAtomic(path, previous.manifest);
  const restored = await loadInstallationManifest(targetRoot);
  if (
    restored.status !== "valid" ||
    restored.manifest.payloadSha256 !== previous.manifest.payloadSha256
  ) {
    throw new InstallerError(
      "INSTALL_ROLLBACK_FAILED",
      "Previous installation manifest failed rollback verification.",
    );
  }
}
