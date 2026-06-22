export function createFinalReport({
  mode,
  plan,
  targetRoot,
  policy,
  conflictPolicy,
  backupRelative = "",
  completedTargets = [],
  installationManifestRelative = "",
}) {
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
    requestedProjectMode: policy.requestedMode,
    effectiveProjectMode: policy.effectiveMode,
    detectedSignals: [...policy.detectedSignals],
    conflictPolicy,
    backupRelative,
  };
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

export function printConflictReviewChoices(report, output) {
  output.info("Next steps:");
  output.info("1. Abort and review the conflicting project files manually.");
  output.info("2. Rerun with --show-diff to inspect conflicts; this does not authorize overwrite.");
  output.info("3. Use a manual merge/adoption workflow for important project context.");
  output.info(
    "4. Existing-project replacement is report-only in WI-1; --overwrite-conflicts cannot bypass classification.",
  );
  if (report.requestedProjectMode === "auto") {
    output.warning(
      "Use --project-mode new only when you intentionally want the new-project overwrite workflow.",
    );
  }
}

export function printBlockedReport(report, output) {
  output.danger(
    "Install blocked: existing-project differences or migration items require an explicit next step.",
  );
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
  if (report.installationManifestRelative) {
    output.info(`Installation manifest updated: ${report.installationManifestRelative}`);
  }
  if (report.selectedOptionalSkills.length) {
    output.info(
      `Selected optional skills: ${report.selectedOptionalSkills.join(", ")} (${report.optionalSelectedFiles} mapped file(s))`,
    );
  }
  if (report.mode === "dry-run") {
    if (report.conflictPolicy === "manual-review-required") {
      printConflictReviewChoices(report, output);
    } else {
      output.info("Next step: rerun with --apply when the plan and project mode are correct.");
    }
    return;
  }
  if (report.reviewItems) {
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
  output.info("Package.json aliases are optional manual setup; the installer does not add them.");
}
