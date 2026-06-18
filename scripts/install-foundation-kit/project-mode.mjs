export function resolveProjectMode({ requestedMode, detectedSignals, conflicts }) {
  const effectiveMode =
    requestedMode === "auto"
      ? detectedSignals.length || conflicts
        ? "existing"
        : "new"
      : requestedMode;

  return Object.freeze({
    requestedMode,
    effectiveMode,
    detectedSignals,
    conflicts,
  });
}

export function conflictPolicyOutcome({ policy, overwriteConflicts }) {
  if (!policy.conflicts) return "no-conflicts";
  if (policy.effectiveMode === "new") return "new-project-backup-and-overwrite";
  if (overwriteConflicts) return "explicit-backup-and-overwrite";
  return "manual-review-required";
}

export function conflictOverwriteBlocked({ policy, overwriteConflicts }) {
  return Boolean(policy.conflicts && policy.effectiveMode === "existing" && !overwriteConflicts);
}
