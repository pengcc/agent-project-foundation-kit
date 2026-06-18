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
import { buildInstallPlan, revalidateInstallPlan } from "./planner.mjs";
import {
  conflictOverwriteBlocked,
  conflictPolicyOutcome,
  resolveProjectMode,
} from "./project-mode.mjs";
import { inspectTargetProject } from "./target-project.mjs";
import { resolveInstallRoots } from "./validation.mjs";

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
  const plan = await buildInstallPlan(roots);
  const policy = resolveProjectMode({
    requestedMode: options.projectMode,
    detectedSignals: targetProject.detectedSignals,
    conflicts: plan.conflicts,
  });
  const conflictPolicy = conflictPolicyOutcome({
    policy,
    overwriteConflicts: options.overwriteConflicts,
  });
  output.info(`Source kit: ${roots.kitRoot}`);
  output.info(`Target root: ${roots.targetRoot}`);
  output.info(
    `Plan: ${plan.newFiles} new, ${plan.conflicts} conflict, ${plan.total} total mapped file(s).`,
  );
  await reportConflicts({
    plan,
    kitRoot: roots.kitRoot,
    targetRoot: roots.targetRoot,
    output,
    showDiff: options.showDiff,
    commandRunner,
  });

  if (!options.apply) {
    output.info("Dry-run only. Re-run with --apply to write files.");
    const report = createFinalReport({
      mode: "dry-run",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
    });
    printFinalReport(report, output);
    return { report, plan };
  }

  if (conflictOverwriteBlocked({ policy, overwriteConflicts: options.overwriteConflicts })) {
    const report = createFinalReport({
      mode: "blocked",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
    });
    printBlockedReport(report, output);
    throw new InstallerError(
      "CONFLICT_REVIEW_REQUIRED",
      "Existing-project conflicts require manual review or --overwrite-conflicts.",
    );
  }

  if (plan.conflicts) {
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
    runtimeRoot = await createRuntimeRoot(roots.repoRoot, runId);
    const stagedRoot = await stageReplacements({
      plan,
      kitRoot: roots.kitRoot,
      runtimeRoot,
      signal,
    });
    await hooks.afterStaging?.({ plan, roots, runtimeRoot, stagedRoot });
    const preparedBackup = await prepareBackupSnapshots({
      plan,
      targetRoot: roots.targetRoot,
      runtimeRoot,
      now,
      signal,
    });
    await hooks.afterBackupPrepared?.({ plan, roots, preparedBackup });

    await revalidateInstallPlan({ expected: plan, ...roots });
    await hooks.beforeBackupMaterialization?.({ plan, roots, preparedBackup });
    materialized = await materializeBackup({
      prepared: preparedBackup,
      targetRoot: roots.targetRoot,
      signal,
    });
    await hooks.afterBackupMaterialized?.({ plan, roots, materialized });

    await revalidateInstallPlan({ expected: plan, ...roots });
    await hooks.beforeApply?.({ plan, roots, materialized });
    await applyStagedPlan({
      plan,
      stagedRoot,
      targetRoot: roots.targetRoot,
      materializedBackup: materialized,
      signal,
      hooks,
    });

    const report = createFinalReport({
      mode: "apply",
      plan,
      targetRoot: roots.targetRoot,
      policy,
      conflictPolicy,
      backupRelative: materialized?.backupRelative,
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
