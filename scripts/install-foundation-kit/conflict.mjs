import { resolve } from "node:path";

function shortHash(value) {
  return value ? value.slice(0, 12) : "none";
}

function evidence(entry) {
  return (
    `reason=${entry.reasonCode}; baseline=${shortHash(entry.baselineSha256)}; ` +
    `target=${shortHash(entry.targetSha256)}; source=${shortHash(entry.sourceSha256)}`
  );
}

export async function reportConflicts({
  plan,
  kitRoot,
  targetRoot,
  output,
  showDiff,
  commandRunner,
  overwriteConflicts = false,
  replaceKitManaged = false,
  managedReplacementPackageEligible = false,
}) {
  output.info(
    `Plan: ${plan.safeAddFiles} SAFE_ADD, ${plan.kitManagedReplaceFiles} KIT_MANAGED_REPLACE, ` +
      `${plan.projectOwnedFiles} PROJECT_OWNED, ${plan.mixedAgentMergeFiles} MIXED_AGENT_MERGE, ` +
      `${plan.blockedManualFiles} BLOCKED_MANUAL, ${plan.unchangedFiles} unchanged, ` +
      `${plan.total} total item(s).`,
  );
  output.info(`Installation manifest: ${plan.installationManifest.status}`);
  for (const issue of plan.installationManifest.issues) {
    output.danger(`[MANIFEST] ${issue}`);
  }

  for (const entry of plan.entries) {
    if (entry.action === "skip-identical") {
      output.debug(`[SKIP] ${entry.targetRelative} (${entry.reasonCode})`);
      continue;
    }
    const detail = evidence(entry);
    if (entry.resultCategory === "SAFE_ADD") {
      const optional = entry.kind === "optional" ? "[OPTIONAL] " : "";
      output.info(`${optional}[SAFE_ADD] ${entry.targetRelative}; ${detail}`);
    } else if (entry.resultCategory === "KIT_MANAGED_REPLACE") {
      const status =
        replaceKitManaged && entry.managedReplaceAllowed && managedReplacementPackageEligible
          ? "authorized allowlisted canary"
          : replaceKitManaged && entry.managedReplaceAllowed
            ? "package not eligible; both React files are required"
            : entry.managedReplaceAllowed
              ? "allowlisted canary; requires --replace-kit-managed"
              : "report-only; not allowlisted";
      output.warning(`[KIT_MANAGED_REPLACE] ${entry.targetRelative}; ${status}; ${detail}`);
    } else if (entry.resultCategory === "PROJECT_OWNED") {
      output.info(`[PROJECT_OWNED] ${entry.targetRelative}; preserved; ${detail}`);
    } else if (entry.resultCategory === "MIXED_AGENT_MERGE") {
      output.warning(`[MIXED_AGENT_MERGE] ${entry.targetRelative}; ${detail}`);
    } else if (entry.action === "script-merge") {
      output.warning(
        `[BLOCKED_MANUAL] [SCRIPT-MERGE] ${entry.targetRelative}; ` +
          `project-specific workflow changes may exist; ${detail}`,
      );
    } else if (entry.action === "migration-review") {
      output.warning(
        `[BLOCKED_MANUAL] [MIGRATE] ${entry.targetRelative}; ` +
          `legacy path ${entry.collisionPath}; ${detail}`,
      );
    } else if (entry.resultCategory === "BLOCKED_MANUAL") {
      const message = `[BLOCKED_MANUAL] ${entry.targetRelative}; ${detail}`;
      if (overwriteConflicts) output.danger(message);
      else output.warning(message);
    }

    if (
      !showDiff ||
      entry.mappingState !== "current" ||
      entry.contentState !== "existing-different"
    ) {
      continue;
    }
    const result = await commandRunner.run("diff", [
      "-u",
      resolve(targetRoot, entry.targetRelative),
      resolve(kitRoot, entry.sourceRelative),
    ]);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.exitCode === 0 || result.exitCode === 1) continue;
    output.warning(
      `diff -u preview unavailable for ${entry.targetRelative}; continuing without preview.`,
    );
  }
}
