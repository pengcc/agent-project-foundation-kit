const HIGH_RISK_PATTERNS = [
  ['scripts/', 'workflow scripts changed'],
  ['kit/scripts/', 'installable workflow changed'],
  ['scripts/install-foundation-kit.mjs', 'installer changed'],
  ['package.json', 'package configuration changed'],
  ['.github/', 'GitHub automation changed'],
  ['kit/config/', 'workflow policy changed'],
];

export function parseNameStatus(text) {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...parts] = line.split('\t');
      return { status: status[0], path: parts.at(-1) };
    });
}

export function parseNumstat(text) {
  return text
    .split('\n')
    .filter(Boolean)
    .reduce(
      (summary, line) => {
        const [added, deleted] = line.split('\t');
        summary.added += Number.isFinite(Number(added)) ? Number(added) : 0;
        summary.deleted += Number.isFinite(Number(deleted)) ? Number(deleted) : 0;
        return summary;
      },
      { added: 0, deleted: 0 },
    );
}

export function buildScopeSummary({ branch, nameStatus, numstat, diff = '' }) {
  const files = parseNameStatus(nameStatus);
  const lines = parseNumstat(numstat);
  const counts = { added: 0, modified: 0, deleted: 0 };
  for (const file of files) {
    if (file.status === 'A' || file.status === '?') counts.added += 1;
    else if (file.status === 'D') counts.deleted += 1;
    else counts.modified += 1;
  }
  const highRiskHints = HIGH_RISK_PATTERNS.filter(([pattern]) =>
    files.some((file) => file.path?.startsWith(pattern) || file.path === pattern),
  ).map(([, hint]) => hint);
  return { branch, files, counts, lines, highRiskHints, diff };
}

export function renderScopeSummary(
  summary,
  output,
  { showDiff = false, heading = 'Scope summary' } = {},
) {
  output.step(heading);
  output.info(`Branch: ${summary.branch}`);
  output.info(`Changed files: ${summary.files.length}`);
  if (summary.files.length) {
    output.info(
      `Files:\n${summary.files.map((file) => `  ${file.status} ${file.path}`).join('\n')}`,
    );
  }
  output.info(
    `Added: ${summary.counts.added}, Modified: ${summary.counts.modified}, Deleted: ${summary.counts.deleted}`,
  );
  output.info(`Line summary: +${summary.lines.added} / -${summary.lines.deleted}`);
  if (summary.highRiskHints.length) {
    output.warning(`High-risk hints: ${summary.highRiskHints.join('; ')}`);
  } else {
    output.info('High-risk hints: none');
  }
  if (showDiff) output.info(`Full diff:\n${summary.diff || '(none)'}`);
  else output.skipped('Full diff hidden. Re-run with --show-diff to display it.');
}

export function recommendClassification(summary) {
  if (summary.counts.deleted > 0 || summary.highRiskHints.length > 0) return 'significant';
  return 'normal';
}
