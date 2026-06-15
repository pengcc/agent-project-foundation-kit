export function createFinalReport({ mode, plan, targetRoot, backupRelative = '' }) {
  return {
    mode,
    targetRoot,
    total: plan.total,
    newFiles: plan.newFiles,
    conflicts: plan.conflicts,
    backupRelative,
  };
}

export function printFinalReport(report, output) {
  output.success(
    `${report.mode === 'apply' ? 'Install completed' : 'Dry-run completed'}: ` +
      `${report.newFiles} new, ${report.conflicts} conflict, ${report.total} total.`,
  );
  output.info(`Target root: ${report.targetRoot}`);
  if (report.backupRelative) {
    output.info(`Backups: ${report.backupRelative}`);
  }
}
