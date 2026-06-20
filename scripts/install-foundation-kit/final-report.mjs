export function createFinalReport({
  mode,
  plan,
  targetRoot,
  policy,
  conflictPolicy,
  backupRelative = "",
  completedTargets = [],
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
  output.info(
    "3. Rerun with --overwrite-conflicts to request backup and overwrite with typed confirmation.",
  );
  output.info("4. Use a manual merge/adoption workflow for important project context.");
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
      `${report.writableNewFiles} safe new, ${report.identicalFiles} identical, ` +
      `${report.differentFiles} different, ${report.scriptMergeFiles} script merge, ` +
      `${report.migrationReviews} migration review, ${report.total} total.`,
  );
  output.info(`Target root: ${report.targetRoot}`);
  printPolicySummary(report, output);
  if (report.backupRelative) {
    output.info(`Backups: ${report.backupRelative}`);
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
  if (report.conflictPolicy === "safe-new-files-only" && report.reviewItems) {
    output.warning(
      "Partial adoption: safe new files were installed; existing differences and migration items were preserved for review.",
    );
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
