import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { updateBackupManifest } from "./backup.mjs";
import { InstallerError, throwIfAborted } from "./errors.mjs";
import { atomicCopyIntoTarget, copyPreserved, hashFile, removeTree } from "./fs-safe.mjs";

export async function createRuntimeRoot(repoRoot, runId) {
  const runtimeRoot = resolve(
    repoRoot,
    "dev_locals",
    "workflow-tmp",
    "install-foundation-kit",
    runId,
  );
  await mkdir(runtimeRoot, { recursive: true });
  return runtimeRoot;
}

export async function stageReplacements({ plan, kitRoot, runtimeRoot, signal }) {
  const stagedRoot = resolve(runtimeRoot, "replacements");
  for (const entry of plan.entries) {
    if (entry.action === "delete") continue;
    throwIfAborted(signal);
    const source = resolve(kitRoot, entry.sourceRelative);
    const staged = resolve(stagedRoot, entry.targetRelative);
    await copyPreserved(source, staged);
    if ((await hashFile(staged)) !== entry.sourceSha256) {
      throw new InstallerError(
        "STAGING_VERIFICATION_FAILED",
        `Staged replacement hash mismatch: ${entry.targetRelative}`,
      );
    }
  }
  return stagedRoot;
}

export async function applyStagedPlan({
  plan,
  stagedRoot,
  targetRoot,
  materializedBackup,
  finalizeBackup = true,
  signal,
  hooks = {},
}) {
  const completedTargets = [];
  if (materializedBackup) {
    await updateBackupManifest(materializedBackup, { status: "applying" });
  }
  try {
    for (const entry of plan.entries) {
      throwIfAborted(signal);
      await hooks.beforeCopy?.({ entry, completedTargets: [...completedTargets] });
      if (entry.action === "delete") {
        await removeTree(resolve(targetRoot, entry.targetRelative));
        completedTargets.push(entry.targetRelative);
        continue;
      }
      const staged = resolve(stagedRoot, entry.targetRelative);
      await atomicCopyIntoTarget({
        source: staged,
        targetRoot,
        targetRelative: entry.targetRelative,
        signal,
        overwrite: entry.ownership === "kit-managed",
      });
      if ((await hashFile(resolve(targetRoot, entry.targetRelative))) !== entry.sourceSha256) {
        throw new InstallerError(
          "INSTALL_VERIFICATION_FAILED",
          `Installed file hash mismatch: ${entry.targetRelative}`,
        );
      }
      completedTargets.push(entry.targetRelative);
      if (materializedBackup) {
        materializedBackup.manifest.completedTargets = [...completedTargets];
        await updateBackupManifest(materializedBackup, {
          completedTargets: [...completedTargets],
        });
      }
    }
  } catch (error) {
    if (materializedBackup) {
      await updateBackupManifest(materializedBackup, {
        status: error?.type === "INTERRUPTED" ? "interrupted" : "failed",
        completedTargets: [...completedTargets],
      });
    }
    error.completedTargets = completedTargets;
    throw error;
  }
  if (materializedBackup && finalizeBackup) {
    await updateBackupManifest(materializedBackup, {
      status: "completed",
      completedTargets: [...completedTargets],
    });
  }
  return completedTargets;
}

export async function cleanupRuntime(runtimeRoot) {
  if (runtimeRoot) await removeTree(runtimeRoot);
}
