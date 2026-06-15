import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { prepareBackupSnapshots, materializeBackup } from './backup.mjs';
import {
  applyStagedPlan,
  cleanupRuntime,
  createRuntimeRoot,
  stageReplacements,
} from './copier.mjs';
import { reportConflicts } from './conflict.mjs';
import { createFinalReport, printFinalReport } from './final-report.mjs';
import { buildInstallPlan, revalidateInstallPlan } from './planner.mjs';
import { resolveInstallRoots } from './validation.mjs';

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
  const plan = await buildInstallPlan(roots);
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
    output.info('Dry-run only. Re-run with --apply to write files.');
    const report = createFinalReport({
      mode: 'dry-run',
      plan,
      targetRoot: roots.targetRoot,
    });
    printFinalReport(report, output);
    return { report, plan };
  }

  if (plan.conflicts) {
    output.danger(
      'Conflicts will be backed up only after explicit authorization and complete preparation.',
    );
    await prompts.confirmBackup();
  }

  let runtimeRoot = '';
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
      mode: 'apply',
      plan,
      targetRoot: roots.targetRoot,
      backupRelative: materialized?.backupRelative,
    });
    printFinalReport(report, output);
    return { report, plan };
  } catch (error) {
    const completed = error?.completedTargets ?? [];
    if (completed.length) {
      output.danger(
        `Partial apply: ${completed.length} mapped file(s) completed before failure.`,
      );
    }
    if (materialized?.backupRelative) {
      output.info(`Prepared backup retained at: ${materialized.backupRelative}`);
    }
    throw error;
  } finally {
    await cleanupRuntime(runtimeRoot);
  }
}
