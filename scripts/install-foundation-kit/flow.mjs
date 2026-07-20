import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { materializeBackup, prepareBackupSnapshots, updateBackupManifest } from "./backup.mjs";
import {
  applyStagedPlan,
  cleanupRuntime,
  createRuntimeRoot,
  stageReplacements,
} from "./copier.mjs";
import { createFinalReport, printFinalReport, printPublishAliasPlan } from "./final-report.mjs";
import { removeTree } from "./fs-safe.mjs";
import { buildInstallPlan, revalidateInstallPlan } from "./planner.mjs";
import { applyPublishAliases } from "./publish-aliases.mjs";
import { resolveInstallRoots } from "./validation.mjs";

function printPlan(plan, output) {
  output.info(
    `Plan: ${plan.newFiles} new, ${plan.replacedFiles} Kit-owned replacements, ` +
      `${plan.removedFiles} obsolete Kit-owned removals, ${plan.preservedFiles} project-owned preserved.`,
  );
  for (const entry of plan.entries) {
    if (entry.action === "preserve") output.info(`[PRESERVE] ${entry.targetRelative}`);
    else if (entry.action === "delete") output.warning(`[REMOVE] ${entry.targetRelative}`);
    else if (entry.contentState === "new") output.info(`[INSTALL] ${entry.targetRelative}`);
    else output.info(`[REPLACE] ${entry.targetRelative}`);
  }
}

export async function runInstallerFlow({
  repoRoot,
  options,
  output,
  signal,
  now = () => new Date(),
  runId = randomUUID(),
  hooks = {},
}) {
  const roots = await resolveInstallRoots({ repoRoot, target: options.target });
  const plan = await buildInstallPlan({
    ...roots,
    includeOptional: options.includeOptional,
    kitProfile: options.kitProfile,
  });
  output.info(`Source kit: ${roots.kitRoot}`);
  output.info(`Target root: ${roots.targetRoot}`);
  printPlan(plan, output);
  printPublishAliasPlan(plan.publishAliases, output);

  if (!options.apply) {
    output.info("Dry-run only. Re-run with --apply to install or update the selected payload.");
    const report = createFinalReport({ mode: "dry-run", plan, targetRoot: roots.targetRoot });
    printFinalReport(report, output);
    return { report, plan };
  }

  let runtimeRoot = "";
  let materialized = null;
  let completedTargets = [];
  let completedSupplementalTargets = [];
  let applyPhase = "preparation";
  try {
    const applyPlan = {
      ...plan,
      entries: plan.entries.filter((entry) => entry.action !== "preserve"),
    };
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
      kitProfile: options.kitProfile,
    });
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
      kitProfile: options.kitProfile,
    });
    await hooks.beforeApply?.({ plan, roots, materialized });
    for (const targetDirectory of plan.replaceRoots) {
      await removeTree(resolve(roots.targetRoot, targetDirectory));
    }
    applyPhase = "payload";
    completedTargets = await applyStagedPlan({
      plan: applyPlan,
      stagedRoot,
      targetRoot: roots.targetRoot,
      materializedBackup: materialized,
      finalizeBackup: false,
      signal,
      hooks,
    });
    applyPhase = "publish-aliases";
    await hooks.beforePublishAliases?.({ plan, roots, materialized, completedTargets });
    const publishAliasesApplied = await applyPublishAliases({
      plan: plan.publishAliases,
      targetRoot: roots.targetRoot,
      signal,
    });
    if (publishAliasesApplied) completedSupplementalTargets = ["package.json"];
    if (materialized) {
      await updateBackupManifest(materialized, {
        status: "completed",
        completedTargets,
        completedSupplementalTargets,
      });
    }
    const report = createFinalReport({
      mode: "apply",
      plan,
      targetRoot: roots.targetRoot,
      completedTargets,
      backupRelative: materialized?.backupRelative,
      publishAliasesApplied,
    });
    printFinalReport(report, output);
    return { report, plan };
  } catch (error) {
    if (error?.completedTargets?.length) completedTargets = error.completedTargets;
    if (materialized) {
      await updateBackupManifest(materialized, {
        status: error?.type === "INTERRUPTED" ? "interrupted" : "failed",
        completedTargets,
        completedSupplementalTargets,
      });
    }
    error.completedTargets = completedTargets;
    error.completedSupplementalTargets = completedSupplementalTargets;
    error.applyPhase = applyPhase;
    if (completedTargets.length) {
      output.danger(
        `Partial apply: ${completedTargets.length} payload item(s) completed before failure during ${applyPhase}.`,
      );
    }
    if (materialized?.backupRelative)
      output.info(`Prepared backup retained at: ${materialized.backupRelative}`);
    throw error;
  } finally {
    await cleanupRuntime(runtimeRoot);
  }
}
