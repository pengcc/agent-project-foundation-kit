export function createFinalReport({
  mode,
  plan,
  targetRoot,
  policy,
  conflictPolicy,
  backupRelative = "",
}) {
  return {
    mode,
    targetRoot,
    total: plan.total,
    newFiles: plan.newFiles,
    conflicts: plan.conflicts,
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
  output.danger("Install blocked: existing-project conflicts require an explicit next step.");
  output.info(`Target root: ${report.targetRoot}`);
  printPolicySummary(report, output);
  printConflictReviewChoices(report, output);
}

export function printFinalReport(report, output) {
  output.success(
    `${report.mode === "apply" ? "Install completed" : "Dry-run completed"}: ` +
      `${report.newFiles} new, ${report.conflicts} conflict, ${report.total} total.`,
  );
  output.info(`Target root: ${report.targetRoot}`);
  printPolicySummary(report, output);
  if (report.backupRelative) {
    output.info(`Backups: ${report.backupRelative}`);
  }
  if (report.mode === "dry-run") {
    if (report.conflictPolicy === "manual-review-required") {
      printConflictReviewChoices(report, output);
    } else {
      output.info("Next step: rerun with --apply when the plan and project mode are correct.");
    }
    return;
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
