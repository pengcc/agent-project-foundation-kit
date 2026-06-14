export function renderFinalReport(output, report) {
  output.step('Final report');
  output.info(`Update classification: ${report.classification}`);
  output.info(`Recommended commit message: ${report.commitMessage}`);
  output.info(`Recommended PR title: ${report.prTitle}`);
  output.info(`Branch: ${report.branch}`);
  output.info(`Files changed: ${report.filesChanged.join(', ') || 'none'}`);
  output.info(`Validation: ${report.validation}`);
  output.info(`Documentation updated: ${report.docsUpdated ? 'yes' : 'no'}`);
  output.info(`Project memory updated: ${report.projectMemoryUpdated ? 'yes' : 'no'}`);
  output.info(`PR: ${report.prUrl ?? 'not created'}`);
  output.info(`Merge mode: ${report.mode}`);
  output.info(`Default branch refresh: ${report.refreshStatus}`);
  output.info(`External actions performed: ${report.actions.join(', ') || 'none'}`);
}
