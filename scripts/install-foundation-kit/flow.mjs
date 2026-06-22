import { randomUUID } from "node:crypto";
import { materializeBackup, prepareBackupSnapshots } from "./backup.mjs";
import { reportConflicts } from "./conflict.mjs";
import {
  applyStagedPlan,
  cleanupRuntime,
  createRuntimeRoot,
  stageReplacements,
} from "./copier.mjs";
import { InstallerError } from "./errors.mjs";
import { createFinalReport, printBlockedReport, printFinalReport } from "./final-report.mjs";
import {
  createNextInstallationManifest,
  verifyManifestCandidates,
  writeInstallationManifest,
} from "./installation-manifest.mjs";
import { buildInstallPlan, revalidateInstallPlan } from "./planner.mjs";
import {
  conflictOverwriteBlocked,
  conflictPolicyOutcome,
  resolveProjectMode,
} from "./project-mode.mjs";
import { inspectTargetProject } from "./target-project.mjs";
import { resolveInstallRoots } from "./validation.mjs";

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
  });

  const authorizedManagedReplacements = plan.entries.filter(
    (entry) =>
      options.replaceKitManaged &&
      entry.resultCategory === "KIT_MANAGED_REPLACE" &&
      entry.managedReplaceAllowed,
  );

  if (!options.apply) {
    output.info("Dry-run only. Re-run with --apply to write files.");
    const report = createFinalReport({
      mode: "dry-run",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
      replaceKitManaged: options.replaceKitManaged,
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
      output.warning("No allowlisted managed replacements are eligible in the current plan.");
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
              (options.replaceKitManaged &&
                entry.resultCategory === "KIT_MANAGED_REPLACE" &&
                entry.managedReplaceAllowed),
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
        overwriteTargets: authorizedManagedReplacements.map((entry) => entry.targetRelative),
      });
    } catch (error) {
      completedTargets = error?.completedTargets ?? [];
      if (options.replaceKitManaged && completedTargets.length) {
        try {
          await persistInstallationManifest({ plan, roots, completedTargets, hooks });
          output.info(
            `Installation manifest advanced for ${completedTargets.length} completed target(s) after partial apply.`,
          );
        } catch (manifestError) {
          manifestError.completedTargets = completedTargets;
          throw manifestError;
        }
      }
      throw error;
    }
    let installationManifestRelative = "";
    try {
      installationManifestRelative = await persistInstallationManifest({
        plan,
        roots,
        completedTargets,
        hooks,
      });
    } catch (error) {
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
      backupRelative: materialized?.backupRelative,
      completedTargets,
      installationManifestRelative,
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
