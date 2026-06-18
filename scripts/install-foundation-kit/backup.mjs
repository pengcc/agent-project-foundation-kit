import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { InstallerError, throwIfAborted } from "./errors.mjs";
import { copyPreserved, hashFile, pathStats, writeJsonAtomic } from "./fs-safe.mjs";
import { assertInside, assertNoTargetSymlinks } from "./path-boundary.mjs";

function timestamp(date) {
  return date.toISOString().replaceAll(/[-:]/g, "").slice(0, 15).replace("T", "-");
}

export async function chooseBackupRelative(targetRoot, now = () => new Date()) {
  const base = `.codex/backups/install-${timestamp(now())}`;
  let candidate = base;
  for (let suffix = 1; await pathStats(resolve(targetRoot, candidate)); suffix += 1) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export function createBackupManifest({ plan, createdAt }) {
  return {
    version: 1,
    createdAt,
    status: "prepared",
    entries: plan.entries
      .filter((entry) => entry.state === "conflict")
      .map((entry) => ({
        target: entry.targetRelative,
        backup: entry.targetRelative,
        source: entry.sourceRelative,
        originalSha256: entry.targetSha256,
        replacementSha256: entry.sourceSha256,
      })),
    completedTargets: [],
  };
}

export async function prepareBackupSnapshots({
  plan,
  targetRoot,
  runtimeRoot,
  now = () => new Date(),
  signal,
}) {
  const conflicts = plan.entries.filter((entry) => entry.state === "conflict");
  if (!conflicts.length) return null;
  const backupRelative = await chooseBackupRelative(targetRoot, now);
  const snapshotRoot = resolve(runtimeRoot, "backup-snapshot");
  const manifest = createBackupManifest({ plan, createdAt: now().toISOString() });
  for (const entry of conflicts) {
    throwIfAborted(signal);
    const source = resolve(targetRoot, entry.targetRelative);
    const snapshot = resolve(snapshotRoot, entry.targetRelative);
    assertInside(snapshotRoot, snapshot, "Backup snapshot path");
    await copyPreserved(source, snapshot);
    if ((await hashFile(snapshot)) !== entry.targetSha256) {
      throw new InstallerError(
        "BACKUP_VERIFICATION_FAILED",
        `Backup snapshot hash mismatch: ${entry.targetRelative}`,
      );
    }
  }
  await writeJsonAtomic(resolve(snapshotRoot, "manifest.json"), manifest);
  return { backupRelative, snapshotRoot, manifest };
}

export async function materializeBackup({ prepared, targetRoot, signal }) {
  if (!prepared) return null;
  throwIfAborted(signal);
  await assertNoTargetSymlinks(targetRoot, `${prepared.backupRelative}/manifest.json`);
  const backupRoot = resolve(targetRoot, prepared.backupRelative);
  assertInside(targetRoot, backupRoot, "Backup root");
  await mkdir(backupRoot, { recursive: true });
  await assertNoTargetSymlinks(targetRoot, `${prepared.backupRelative}/manifest.json`);
  for (const entry of prepared.manifest.entries) {
    throwIfAborted(signal);
    const source = resolve(prepared.snapshotRoot, entry.backup);
    const destination = resolve(backupRoot, entry.backup);
    assertInside(backupRoot, destination, "Backup file");
    await assertNoTargetSymlinks(targetRoot, `${prepared.backupRelative}/${entry.backup}`);
    await copyPreserved(source, destination);
    if ((await hashFile(destination)) !== entry.originalSha256) {
      throw new InstallerError(
        "BACKUP_VERIFICATION_FAILED",
        `Materialized backup hash mismatch: ${entry.target}`,
      );
    }
  }
  await writeJsonAtomic(resolve(backupRoot, "manifest.json"), prepared.manifest);
  return { ...prepared, backupRoot };
}

export async function updateBackupManifest(materialized, changes) {
  if (!materialized) return;
  Object.assign(materialized.manifest, changes);
  await writeJsonAtomic(resolve(materialized.backupRoot, "manifest.json"), materialized.manifest);
}
