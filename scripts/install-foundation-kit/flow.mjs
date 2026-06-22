import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { materializeBackup, prepareBackupSnapshots, updateBackupManifest } from "./backup.mjs";
import { reportConflicts } from "./conflict.mjs";
import {
  applyStagedPlan,
  cleanupRuntime,
  createRuntimeRoot,
  stageReplacements,
} from "./copier.mjs";
import { InstallerError } from "./errors.mjs";
import {
  createFinalReport,
  printBlockedReport,
  printFinalReport,
  printPublishAliasPlan,
} from "./final-report.mjs";
import { atomicCopyIntoTarget, hashFile } from "./fs-safe.mjs";
import {
  createNextInstallationManifest,
  restoreInstallationManifest,
  verifyManifestCandidates,
  writeInstallationManifest,
} from "./installation-manifest.mjs";
import { REACT_CANARY_MANAGED_REPLACEMENT } from "./ownership-policy.mjs";
import { buildInstallPlan, revalidateInstallPlan } from "./planner.mjs";
import {
  conflictOverwriteBlocked,
  conflictPolicyOutcome,
  resolveProjectMode,
} from "./project-mode.mjs";
import { applyPublishAliases } from "./publish-aliases.mjs";
import { inspectTargetProject } from "./target-project.mjs";
import { resolveInstallRoots } from "./validation.mjs";

const REACT_CANARY_TARGETS = Object.freeze(
  REACT_CANARY_MANAGED_REPLACEMENT.map((entry) => entry.targetRelative),
);

function reactCanaryPackageState(plan, requested) {
  const entries = REACT_CANARY_TARGETS.map((target) =>
    plan.entries.find((entry) => entry.targetRelative === target),
  );
  if (!requested) return { eligible: false, reason: "not-requested", entries: [] };
  if (entries.some((entry) => !entry)) {
    return {
      eligible: false,
      reason: "not selected or missing from the current mapping",
      entries: [],
    };
  }
  if (
    entries.some(
      (entry) => entry.resultCategory !== "KIT_MANAGED_REPLACE" || !entry.managedReplaceAllowed,
    )
  ) {
    return {
      eligible: false,
      reason: "both package files must be eligible KIT_MANAGED_REPLACE entries",
      entries: [],
    };
  }
  return { eligible: true, reason: "eligible", entries };
}

async function persistInstallationManifest({ plan, roots, completedTargets, hooks }) {
  await hooks.beforeInstallationManifestWrite?.({ plan, roots, completedTargets });
  await verifyManifestCandidates({ plan, targetRoot: roots.targetRoot, completedTargets });
  const nextInstallationManifest = createNextInstallationManifest({ plan, completedTargets });
  return writeInstallationManifest({
    targetRoot: roots.targetRoot,
    expected: plan.installationManifest,
    manifest: nextInstallationManifest,
  });
}

async function rollbackReactCanary({ packageEntries, completedTargets, materialized, targetRoot }) {
  if (!materialized) {
    throw new InstallerError(
      "INSTALL_ROLLBACK_FAILED",
      "React canary rollback requires a materialized backup.",
    );
  }
  const backupEntries = new Map(
    materialized.manifest.entries.map((entry) => [entry.target, entry]),
  );
  for (const entry of [...packageEntries].reverse()) {
    const backupEntry = backupEntries.get(entry.targetRelative);
    if (!backupEntry) {
      throw new InstallerError(
        "INSTALL_ROLLBACK_FAILED",
        `React canary backup entry is missing: ${entry.targetRelative}`,
      );
    }
    await atomicCopyIntoTarget({
      source: resolve(materialized.backupRoot, backupEntry.backup),
      targetRoot,
      targetRelative: entry.targetRelative,
      overwrite: true,
    });
    if (
      (await hashFile(resolve(targetRoot, entry.targetRelative))) !== backupEntry.originalSha256
    ) {
      throw new InstallerError(
        "INSTALL_ROLLBACK_FAILED",
        `React canary rollback hash mismatch: ${entry.targetRelative}`,
      );
    }
  }
  const remainingCompletedTargets = completedTargets.filter(
    (target) => !REACT_CANARY_TARGETS.includes(target),
  );
  await updateBackupManifest(materialized, {
    status: materialized.manifest.completedSupplementalTargets?.length
      ? "partially-completed"
      : "rolled-back",
    completedTargets: remainingCompletedTargets,
  });
  return remainingCompletedTargets;
}

export async function runInstallerFlow({
  repoRoot,
  options,
  output,
  prompts,
  commandRunner,
  signal,
  now = () => new Date(),
  runId = randomUUID(),
  hooks = {},
}) {
  const roots = await resolveInstallRoots({ repoRoot, target: options.target });
  const targetProject = await inspectTargetProject(roots.targetRoot);
  const plan = await buildInstallPlan({ ...roots, includeOptional: options.includeOptional });
  const policy = resolveProjectMode({
    requestedMode: options.projectMode,
    detectedSignals: targetProject.detectedSignals,
    conflicts: plan.conflicts,
    reviewItems: plan.reviewItems,
  });
  const conflictPolicy = conflictPolicyOutcome({
    policy,
    overwriteConflicts: options.overwriteConflicts,
    skipConflicts: options.skipConflicts,
    replaceKitManaged: options.replaceKitManaged,
  });
  const reactCanaryPackage = reactCanaryPackageState(plan, options.replaceKitManaged);
  const authorizedManagedReplacements = reactCanaryPackage.entries;
  const authorizedManagedReplacementTargets = new Set(
    authorizedManagedReplacements.map((entry) => entry.targetRelative),
  );
  output.info(`Source kit: ${roots.kitRoot}`);
  output.info(`Target root: ${roots.targetRoot}`);
  await reportConflicts({
    plan,
    kitRoot: roots.kitRoot,
    targetRoot: roots.targetRoot,
    output,
    showDiff: options.showDiff,
    commandRunner,
    overwriteConflicts: options.overwriteConflicts,
    replaceKitManaged: options.replaceKitManaged,
    managedReplacementPackageEligible: reactCanaryPackage.eligible,
  });
  printPublishAliasPlan(plan.publishAliases, output);

  if (!options.apply) {
    output.info("Dry-run only. Re-run with --apply to write files.");
    const report = createFinalReport({
      mode: "dry-run",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
      replaceKitManaged: options.replaceKitManaged,
      managedReplacementPackageEligible: reactCanaryPackage.eligible,
    });
    printFinalReport(report, output);
    return { report, plan };
  }

  if (plan.installationManifest.status === "invalid") {
    const report = createFinalReport({
      mode: "blocked",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
      replaceKitManaged: options.replaceKitManaged,
      managedReplacementPackageEligible: reactCanaryPackage.eligible,
    });
    printBlockedReport(report, output);
    throw new InstallerError(
      "INVALID_INSTALLATION_MANIFEST",
      "Apply blocked because the installation manifest is invalid or conflicts with source policy.",
    );
  }

  if (policy.effectiveMode === "existing" && options.overwriteConflicts && plan.reviewItems) {
    const report = createFinalReport({
      mode: "blocked",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy: "existing-project-replacement-blocked",
      replaceKitManaged: options.replaceKitManaged,
      managedReplacementPackageEligible: reactCanaryPackage.eligible,
    });
    printBlockedReport(report, output);
    throw new InstallerError(
      "EXISTING_PROJECT_REPLACEMENT_BLOCKED",
      "Broad existing-project replacement is blocked; use the dedicated React canary authorization only for exact eligible targets.",
    );
  }

  if (
    !options.replaceKitManaged &&
    conflictOverwriteBlocked({
      policy,
      overwriteConflicts: options.overwriteConflicts,
      skipConflicts: options.skipConflicts,
    })
  ) {
    const report = createFinalReport({
      mode: "blocked",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
      replaceKitManaged: options.replaceKitManaged,
      managedReplacementPackageEligible: reactCanaryPackage.eligible,
    });
    printBlockedReport(report, output);
    throw new InstallerError(
      "CONFLICT_REVIEW_REQUIRED",
      "Existing-project differences or migration items require safe apply or manual review.",
    );
  }

  if (options.replaceKitManaged) {
    if (authorizedManagedReplacements.length) {
      output.danger("Allowlisted existing-project files will be backed up and replaced:");
      for (const entry of authorizedManagedReplacements) {
        output.danger(`- ${entry.targetRelative}`);
      }
      await prompts.confirmBackup();
    } else {
      output.warning(
        `React canary package not eligible: ${reactCanaryPackage.reason}; neither package file will be replaced.`,
      );
    }
  } else if (plan.conflicts && !options.skipConflicts) {
    const context =
      policy.effectiveMode === "new"
        ? "Conflicts are treated as starter files or previous-install remnants."
        : "Conflicts may contain important existing-project context.";
    output.danger(context);
    output.danger(
      "Conflicts will be backed up and overwritten only after typed confirmation and complete preparation.",
    );
    await prompts.confirmBackup();
  }

  let runtimeRoot = "";
  let materialized = null;
  try {
    const entriesToApply = options.skipConflicts
      ? plan.entries.filter((entry) => entry.action === "write")
      : policy.effectiveMode === "existing"
        ? plan.entries.filter(
            (entry) =>
              entry.action === "write" ||
              authorizedManagedReplacementTargets.has(entry.targetRelative),
          )
        : plan.entries.filter(
            (entry) =>
              entry.mappingState === "current" &&
              entry.contentState !== "existing-identical" &&
              !["manifested-target-missing", "legacy-path-collision"].includes(entry.reasonCode),
          );
    const applyPlan = { ...plan, entries: entriesToApply };
    runtimeRoot = await createRuntimeRoot(roots.repoRoot, runId);
    const stagedRoot = await stageReplacements({
      plan: applyPlan,
      kitRoot: roots.kitRoot,
      runtimeRoot,
      signal,
    });
    await hooks.afterStaging?.({ plan, roots, runtimeRoot, stagedRoot });
    const preparedBackup = await prepareBackupSnapshots({
      plan: applyPlan,
      targetRoot: roots.targetRoot,
      runtimeRoot,
      supplementalEntries: plan.publishAliases.added.length
        ? [
            {
              targetRelative: plan.publishAliases.targetRelative,
              source: "installer:publish-package-aliases",
              originalSha256: plan.publishAliases.originalSha256,
              replacementSha256: plan.publishAliases.replacementSha256,
            },
          ]
        : [],
      now,
      signal,
    });
    await hooks.afterBackupPrepared?.({ plan, roots, preparedBackup });

    await revalidateInstallPlan({
      expected: plan,
      ...roots,
      includeOptional: options.includeOptional,
    });
    await hooks.beforeBackupMaterialization?.({ plan, roots, preparedBackup });
    materialized = await materializeBackup({
      prepared: preparedBackup,
      targetRoot: roots.targetRoot,
      signal,
    });
    await hooks.afterBackupMaterialized?.({ plan, roots, materialized });

    await revalidateInstallPlan({
      expected: plan,
      ...roots,
      includeOptional: options.includeOptional,
    });
    await hooks.beforeApply?.({ plan, roots, materialized });
    let completedTargets = [];
    try {
      completedTargets = await applyStagedPlan({
        plan: applyPlan,
        stagedRoot,
        targetRoot: roots.targetRoot,
        materializedBackup: materialized,
        signal,
        hooks,
        allowOverwrite: policy.effectiveMode === "new" && !options.skipConflicts,
        overwriteTargets: [...authorizedManagedReplacementTargets],
      });
    } catch (error) {
      completedTargets = error?.completedTargets ?? [];
      if (reactCanaryPackage.eligible) {
        try {
          completedTargets = await rollbackReactCanary({
            packageEntries: authorizedManagedReplacements,
            completedTargets,
            materialized,
            targetRoot: roots.targetRoot,
          });
          output.danger("React canary replacement failed; both package files were restored.");
        } catch (rollbackError) {
          rollbackError.completedTargets = completedTargets;
          throw rollbackError;
        }
      }
      error.completedTargets = completedTargets;
      throw error;
    }
    let installationManifestRelative = "";
    let publishAliasesApplied = false;
    if (plan.publishAliases.added.length) {
      if (materialized) {
        await updateBackupManifest(materialized, {
          status: "applying",
          completedTargets,
          completedSupplementalTargets: [],
        });
      }
      try {
        await hooks.beforePublishAliasesApply?.({ plan, roots, materialized, completedTargets });
        publishAliasesApplied = await applyPublishAliases({
          plan: plan.publishAliases,
          targetRoot: roots.targetRoot,
          signal,
        });
      } catch (error) {
        if (materialized) {
          await updateBackupManifest(materialized, {
            status: error?.type === "INTERRUPTED" ? "interrupted" : "failed",
            completedTargets,
            completedSupplementalTargets: [],
          });
        }
        error.completedTargets = completedTargets;
        throw error;
      }
      if (materialized) {
        await updateBackupManifest(materialized, {
          status: "completed",
          completedTargets,
          completedSupplementalTargets: publishAliasesApplied ? ["package.json"] : [],
        });
      }
    }
    try {
      installationManifestRelative = await persistInstallationManifest({
        plan,
        roots,
        completedTargets,
        hooks,
      });
    } catch (error) {
      if (reactCanaryPackage.eligible) {
        try {
          completedTargets = await rollbackReactCanary({
            packageEntries: authorizedManagedReplacements,
            completedTargets,
            materialized,
            targetRoot: roots.targetRoot,
          });
          await restoreInstallationManifest({
            targetRoot: roots.targetRoot,
            previous: plan.installationManifest,
          });
          output.danger(
            "React canary manifest update failed; both package files and the prior manifest were restored.",
          );
        } catch (rollbackError) {
          rollbackError.completedTargets = completedTargets;
          throw rollbackError;
        }
      } else if (materialized) {
        await updateBackupManifest(materialized, {
          status: "failed",
          completedTargets,
          completedSupplementalTargets: publishAliasesApplied ? ["package.json"] : [],
        });
      }
      error.completedTargets = completedTargets;
      throw error;
    }

    const report = createFinalReport({
      mode: "apply",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
      replaceKitManaged: options.replaceKitManaged,
      managedReplacementPackageEligible: reactCanaryPackage.eligible,
      backupRelative: materialized?.backupRelative,
      completedTargets,
      installationManifestRelative,
      publishAliasesApplied,
    });
    printFinalReport(report, output);
    return { report, plan };
  } catch (error) {
    const completed = error?.completedTargets ?? [];
    if (completed.length) {
      output.danger(`Partial apply: ${completed.length} mapped file(s) completed before failure.`);
    }
    if (materialized?.backupRelative) {
      output.info(`Prepared backup retained at: ${materialized.backupRelative}`);
    }
    throw error;
  } finally {
    await cleanupRuntime(runtimeRoot);
  }
}
