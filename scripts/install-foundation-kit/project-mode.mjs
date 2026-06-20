export function resolveProjectMode({
  requestedMode,
  detectedSignals,
  conflicts,
  reviewItems = conflicts,
}) {
  const effectiveMode =
    requestedMode === "auto"
      ? detectedSignals.length || reviewItems
        ? "existing"
        : "new"
      : requestedMode;

  return Object.freeze({
    requestedMode,
    effectiveMode,
    detectedSignals,
    conflicts,
    reviewItems,
  });
}

export function conflictPolicyOutcome({ policy, overwriteConflicts, skipConflicts = false }) {
  if (!policy.reviewItems) return "no-conflicts";
  if (skipConflicts) return "safe-new-files-only";
  if (policy.effectiveMode === "new") return "new-project-backup-and-overwrite";
  if (overwriteConflicts) return "explicit-backup-and-overwrite";
  return "manual-review-required";
}

export function conflictOverwriteBlocked({ policy, overwriteConflicts, skipConflicts = false }) {
  return Boolean(
    policy.reviewItems &&
      policy.effectiveMode === "existing" &&
      !overwriteConflicts &&
      !skipConflicts,
  );
}
