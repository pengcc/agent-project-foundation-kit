import { buildBootstrapAdvisory, buildPayloadGroupReport } from "./payload-groups.mjs";
import { PUBLISH_SCRIPT_FALLBACK } from "./publish-aliases.mjs";

export function createFinalReport({
  mode,
  plan,
  targetRoot,
  policy,
  conflictPolicy,
  backupRelative = "",
  completedTargets = [],
  installationManifestRelative = "",
  replaceKitManaged = false,
  managedReplacementPackageEligible = false,
  publishAliasesApplied = false,
}) {
  const completed = new Set(completedTargets);
  const authorizedManagedReplacements = plan.entries.filter(
    (entry) =>
      replaceKitManaged &&
      managedReplacementPackageEligible &&
      entry.resultCategory === "KIT_MANAGED_REPLACE" &&
      entry.managedReplaceAllowed,
  );
  const unresolvedReviewItems = plan.entries.filter(
    (entry) =>
      entry.resultCategory &&
      entry.resultCategory !== "SAFE_ADD" &&
      !completed.has(entry.targetRelative),
  ).length;
  const payloadGroupReport = buildPayloadGroupReport(plan.entries, { completedTargets });
  const bootstrapAdvisory = buildBootstrapAdvisory({
    entries: plan.entries,
    mode,
    effectiveProjectMode: policy.effectiveMode,
  });
  return {
    mode,
    targetRoot,
    total: plan.total,
    newFiles: plan.newFiles,
    writableNewFiles: plan.writableNewFiles,
    identicalFiles: plan.identicalFiles,
    differentFiles: plan.differentFiles,
    conflicts: plan.conflicts,
    preservedFiles: plan.preservedFiles,
    mergeFiles: plan.mergeFiles,
    scriptMergeFiles: plan.scriptMergeFiles,
    migrationReviews: plan.migrationReviews,
    optionalSelectedFiles: plan.optionalSelectedFiles,
    reviewItems: plan.reviewItems,
    unresolvedReviewItems,
    safeAddFiles: plan.safeAddFiles,
    kitManagedReplaceFiles: plan.kitManagedReplaceFiles,
    projectOwnedFiles: plan.projectOwnedFiles,
    mixedAgentMergeFiles: plan.mixedAgentMergeFiles,
    blockedManualFiles: plan.blockedManualFiles,
    unchangedFiles: plan.unchangedFiles,
    installationManifestStatus: installationManifestRelative
      ? "valid"
      : plan.installationManifest.status,
    installationManifestIssues: [...plan.installationManifest.issues],
    installationManifestRelative,
    selectedOptionalSkills: [...plan.selectedOptionalSkills],
    completedTargets: [...completedTargets],
    completedFiles: completedTargets.length,
    authorizedManagedReplaceFiles: authorizedManagedReplacements.length,
    completedManagedReplaceFiles: authorizedManagedReplacements.filter((entry) =>
      completed.has(entry.targetRelative),
    ).length,
    managedReplacementPackageEligible,
    requestedProjectMode: policy.requestedMode,
    effectiveProjectMode: policy.effectiveMode,
    detectedSignals: [...policy.detectedSignals],
    conflictPolicy,
    backupRelative,
    payloadGroups: payloadGroupReport.groups,
    projectOwnedPreserved: payloadGroupReport.projectOwnedPreserved,
    bootstrapAdvisory,
    publishAliases: {
      status: plan.publishAliases.status,
      skippedReason: plan.publishAliases.skippedReason,
      added: plan.publishAliases.added.map((entry) => entry.name),
      alreadyCurrent: plan.publishAliases.alreadyCurrent.map((entry) => entry.name),
      skippedConflicts: plan.publishAliases.conflicts.map((entry) => entry.name),
      applied: publishAliasesApplied,
      rawFallbackCommand: PUBLISH_SCRIPT_FALLBACK,
    },
  };
}

function publishAliasSkipMessage(reason) {
  const messages = {
    "package-json-missing": "package.json is missing",
    "package-json-invalid": "package.json is invalid JSON",
    "package-json-non-object": "package.json has a non-object root",
    "package-json-scripts-non-object": "package.json scripts is not an object",
    "package-json-not-regular": "package.json is not a regular file",
  };
  return messages[reason] ?? reason;
}

export function printPublishAliasPlan(plan, output) {
  output.step("Publish package aliases");
  if (plan.status === "skipped") {
    output.skipped(
      `Publish aliases not installed: ${publishAliasSkipMessage(plan.skippedReason)}.`,
    );
    output.info(`Raw fallback command: ${PUBLISH_SCRIPT_FALLBACK}`);
    return;
  }
  for (const entry of plan.added) output.info(`Planned addition: ${entry.name}`);
  for (const entry of plan.alreadyCurrent) output.skipped(`Already current: ${entry.name}`);
  for (const entry of plan.conflicts) {
    output.warning(`Skipped conflicting alias: ${entry.name}`);
    output.info(`Existing value: ${String(entry.existingValue)}`);
    output.info(`Kit default: ${entry.defaultValue}`);
  }
  if (!plan.added.length) output.skipped("No safe missing aliases to add.");
}

function printPolicySummary(report, output) {
  output.info(`Requested project mode: ${report.requestedProjectMode}`);
  output.info(`Effective project mode: ${report.effectiveProjectMode}`);
  output.info(
    `Detected project signals: ${report.detectedSignals.length ? report.detectedSignals.join(", ") : "none"}`,
  );
  output.info(`Conflict count: ${report.conflicts}`);
  output.info(`Review item count: ${report.reviewItems}`);
  output.info(`Conflict policy: ${report.conflictPolicy}`);
}

function printPublishAliasSummary(report, output) {
  const aliases = report.publishAliases;
  output.info("Publish package aliases:");
  if (aliases.status === "skipped") {
    output.info(`- Not installed: ${publishAliasSkipMessage(aliases.skippedReason)}.`);
  } else {
    const addedLabel = report.mode === "apply" ? "Added" : "Planned additions";
    output.info(`- ${addedLabel}: ${aliases.added.length ? aliases.added.join(", ") : "none"}`);
    output.info(
      `- Already current: ${aliases.alreadyCurrent.length ? aliases.alreadyCurrent.join(", ") : "none"}`,
    );
    output.info(
      `- Skipped conflicts: ${aliases.skippedConflicts.length ? aliases.skippedConflicts.join(", ") : "none"}`,
    );
  }
  output.info(`- Raw fallback command: ${aliases.rawFallbackCommand}`);
}

function categoryBreakdown(group) {
  return Object.entries(group.categoryCounts)
    .filter(([, count]) => count)
    .map(([category, count]) => `${count} ${category}`)
    .join(", ");
}

function shouldPrintPayloadGroups(report) {
  if (!report.unresolvedReviewItems) return false;
  return (
    report.mode === "apply" ||
    (report.mode === "dry-run" && report.effectiveProjectMode === "existing")
  );
}

function printBootstrapAdvisory(advisory, output) {
  if (!advisory.detected) return;
  output.warning(
    `Bootstrap-critical workflow differences detected: ${advisory.criticalTargets.length}.`,
  );
  for (const target of advisory.criticalTargets) output.info(`- ${target}`);
  if (advisory.dependencyGuardTargets.length) {
    output.warning(
      `Bootstrap dependency guards missing or different: ${advisory.dependencyGuardTargets.length}.`,
    );
    for (const target of advisory.dependencyGuardTargets) output.info(`- ${target}`);
  }
  output.info(
    "Review/adopt this bootstrap slice before relying on target-repository installed workflow authority.",
  );
  output.info("Use current source-kit planning/execution authority for that review.");
  output.info("This is advisory only. No replacement is authorized.");
}

function printPayloadGroupSummary(report, output) {
  if (!shouldPrintPayloadGroups(report)) return;

  output.info("Payload review groups:");
  for (const group of report.payloadGroups) {
    if (!group.unresolvedCount) continue;
    const summary =
      `${group.label}: ${group.unresolvedCount} unresolved review item(s) ` +
      `(${categoryBreakdown(group)}; ${group.mappedCount} mapped).`;
    if (group.id === "unclassified") {
      output.warning(`${summary} Reporting taxonomy update needed; safety handling is unchanged.`);
    } else {
      output.info(summary);
    }
    if (group.id === "publish-package") {
      output.warning(
        "Review these publish workflow differences together. This grouping is report-only; it does not change replacement authorization, ownership, package alias behavior, or publishing behavior.",
      );
    }
    for (const entry of group.entries) {
      output.info(`- [${entry.resultCategory}] ${entry.targetRelative}`);
    }
  }

  if (report.projectOwnedPreserved.length) {
    output.info(`Project-owned preserved differences: ${report.projectOwnedPreserved.length}.`);
    for (const entry of report.projectOwnedPreserved) {
      output.info(`- [${entry.resultCategory}] ${entry.targetRelative}`);
    }
  }

  printBootstrapAdvisory(report.bootstrapAdvisory, output);
  output.info("Existing conflict policy still applies.");
  if (report.mode === "dry-run") output.info("No target files were changed.");
}

export function printConflictReviewChoices(report, output) {
  output.info("Next steps:");
  output.info("1. Abort and review the conflicting project files manually.");
  output.info("2. Rerun with --show-diff to inspect conflicts; this does not authorize overwrite.");
  output.info("3. Use a manual merge/adoption workflow for important project context.");
  output.info(
    "4. Existing-project replacement is limited to the exact allowlisted React canary under --replace-kit-managed; all other replacements remain report-only.",
  );
  if (report.requestedProjectMode === "auto") {
    output.warning(
      "Use --project-mode new only when you intentionally want the new-project overwrite workflow.",
    );
  }
}

function blockedReportMessage(report) {
  if (report.installationManifestStatus === "invalid") {
    return "Install blocked: the installation manifest is invalid or conflicts with source policy; no target files were written.";
  }
  if (report.conflictPolicy === "existing-project-replacement-blocked") {
    return "Install blocked: broad existing-project replacement is not allowed; only exact eligible React canary files can use --replace-kit-managed.";
  }
  if (report.mixedAgentMergeFiles || report.blockedManualFiles) {
    return "Install blocked: existing-project differences include mixed or manual-risk entries that require manual review; no existing target files were replaced.";
  }
  return "Install blocked: existing-project differences or migration items require safe apply or manual review.";
}

export function printBlockedReport(report, output) {
  output.danger(blockedReportMessage(report));
  output.info(`Target root: ${report.targetRoot}`);
  printPolicySummary(report, output);
  printConflictReviewChoices(report, output);
}

export function printFinalReport(report, output) {
  output.success(
    `${report.mode === "apply" ? "Install completed" : "Dry-run completed"}: ` +
      `${report.safeAddFiles} SAFE_ADD, ` +
      `${report.kitManagedReplaceFiles} KIT_MANAGED_REPLACE, ` +
      `${report.projectOwnedFiles} PROJECT_OWNED, ` +
      `${report.mixedAgentMergeFiles} MIXED_AGENT_MERGE, ` +
      `${report.blockedManualFiles} BLOCKED_MANUAL, ` +
      `${report.unchangedFiles} unchanged, ${report.total} total.`,
  );
  output.info(`Target root: ${report.targetRoot}`);
  printPolicySummary(report, output);
  if (report.backupRelative) {
    output.info(`Backups: ${report.backupRelative}`);
  }
  output.info(`Installation manifest status: ${report.installationManifestStatus}`);
  output.info(
    `Managed replacements: ${report.kitManagedReplaceFiles} classified, ` +
      `${report.authorizedManagedReplaceFiles} authorized, ` +
      `${report.completedManagedReplaceFiles} completed.`,
  );
  output.info(`Unresolved review item count: ${report.unresolvedReviewItems}`);
  if (report.installationManifestRelative) {
    output.info(`Installation manifest updated: ${report.installationManifestRelative}`);
  }
  if (report.selectedOptionalSkills.length) {
    output.info(
      `Selected optional skills: ${report.selectedOptionalSkills.join(", ")} (${report.optionalSelectedFiles} mapped file(s))`,
    );
  }
  printPayloadGroupSummary(report, output);
  printPublishAliasSummary(report, output);
  if (report.mode === "dry-run") {
    if (report.conflictPolicy === "manual-review-required") {
      printConflictReviewChoices(report, output);
    } else {
      output.info("Next step: rerun with --apply when the plan and project mode are correct.");
    }
    return;
  }
  if (report.unresolvedReviewItems) {
    const message = report.completedFiles
      ? "Partial adoption: authorized files were installed; unresolved differences and migration items were preserved for review."
      : "Upgrade remains partial: unresolved differences and migration items were preserved for review.";
    output.warning(message);
  }
  output.info("Next steps:");
  output.info("1. Run .codex/prompts/force-initialize-project-context.md with your agent.");
  output.info(
    "2. Treat an existing roadmap or product plan as initialization input, not as a conflict.",
  );
  output.info(
    "3. Do not start feature implementation until initialization and approved project-memory updates are complete.",
  );
  output.info(
    "Installed scripts run from the target project root, for example: node .codex/scripts/publish-changes.mjs --mode pr-only",
  );
}
