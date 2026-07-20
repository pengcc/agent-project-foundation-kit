import { PUBLISH_SCRIPT_FALLBACK } from "./publish-aliases.mjs";

export function createFinalReport({
  mode,
  plan,
  targetRoot,
  backupRelative = "",
  completedTargets = [],
  publishAliasesApplied = false,
}) {
  return {
    mode,
    targetRoot,
    total: plan.total,
    newFiles: plan.newFiles,
    replacedFiles: plan.replacedFiles,
    removedFiles: plan.removedFiles,
    preservedFiles: plan.preservedFiles,
    selectedOptionalSkills: [...plan.selectedOptionalSkills],
    requestedKitProfile: plan.requestedKitProfile,
    selectedPayloadGroups: [...plan.selectedPayloadGroups],
    completedTargets: [...completedTargets],
    backupRelative,
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
  for (const entry of plan.conflicts) output.warning(`Preserved conflicting alias: ${entry.name}`);
  if (!plan.added.length) output.skipped("No safe missing aliases to add.");
}

function printPublishAliases(report, output) {
  const aliases = report.publishAliases;
  output.info("Publish package aliases:");
  if (aliases.status === "skipped")
    output.info(`- Not installed: ${publishAliasSkipMessage(aliases.skippedReason)}.`);
  else {
    output.info(
      `- ${report.mode === "apply" ? "Added" : "Planned additions"}: ${aliases.added.join(", ") || "none"}`,
    );
    output.info(`- Already current: ${aliases.alreadyCurrent.join(", ") || "none"}`);
    output.info(`- Preserved conflicts: ${aliases.skippedConflicts.join(", ") || "none"}`);
  }
  output.info(`- Raw fallback command: ${aliases.rawFallbackCommand}`);
}

export function printFinalReport(report, output) {
  output.success(
    `${report.mode === "apply" ? "Install/update completed" : "Dry-run completed"}: ` +
      `${report.newFiles} new, ${report.replacedFiles} replaced, ${report.removedFiles} removed, ` +
      `${report.preservedFiles} project-owned preserved.`,
  );
  output.info(`Target root: ${report.targetRoot}`);
  if (report.requestedKitProfile) {
    output.info(`Requested kit profile: ${report.requestedKitProfile}`);
    output.info(`Selected payload groups: ${report.selectedPayloadGroups.join(", ")}`);
  }
  if (report.selectedOptionalSkills.length)
    output.info(`Selected optional skills: ${report.selectedOptionalSkills.join(", ")}`);
  if (report.backupRelative) output.info(`Backups: ${report.backupRelative}`);
  printPublishAliases(report, output);
  if (report.mode === "dry-run") {
    output.info("Next step: rerun with --apply when the selected payload is correct.");
    return;
  }
  output.info("Next steps:");
  output.info("1. Run .codex/prompts/force-initialize-project-context.md with your agent.");
  output.info("2. Keep repository facts and decisions in .codex/project-memory/.");
  output.info("3. Put repository-only guidance and capabilities in .codex/project-specific/.");
}
