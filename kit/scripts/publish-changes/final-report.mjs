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

export function renderPrOnlyReport(output, report) {
  output.step('PR-only report');
  output.info(`PR number: ${report.prNumber}`);
  output.info(`PR URL: ${report.prUrl}`);
  output.info(`PR changes: ${report.prChangesUrl}`);
  output.info(`Branch: ${report.branch}`);
  output.info(`Action: ${report.action}`);
}

export function renderMergePrReport(output, report) {
  output.step('Merge-PR report');
  output.info(`Merged PR number: ${report.prNumber}`);
  output.info(`PR URL: ${report.prUrl}`);
  output.info(`Merge status: ${report.mergeStatus}`);
  output.info(`Refresh status: ${report.refreshStatus}`);
  output.info(`Current branch: ${report.currentBranch}`);
}
