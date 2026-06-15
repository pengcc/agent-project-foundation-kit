import { PublishError } from '../shared/errors.mjs';

export function parseCliOptions(argv) {
  const options = {
    mode: 'publish',
    commitMessage: '',
    prTitle: '',
    prTitleExplicit: false,
    prNumber: null,
    yes: false,
    showDiff: false,
    verbose: false,
    policyPath: '',
    help: false,
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--show-diff') options.showDiff = true;
    else if (value === '--verbose') options.verbose = true;
    else if (value === '--yes') options.yes = true;
    else if (value === '--help' || value === '-h') options.help = true;
    else if (value === '--mode') {
      index += 1;
      if (!argv[index]) throw new PublishError('INVALID_ARGUMENT', '--mode requires a value.');
      options.mode = argv[index];
    }
    else if (value === '--policy') {
      index += 1;
      if (!argv[index]) throw new PublishError('INVALID_ARGUMENT', '--policy requires a path.');
      options.policyPath = argv[index];
    } else if (value.startsWith('-')) {
      throw new PublishError('INVALID_ARGUMENT', `Unknown option: ${value}`);
    } else {
      positionals.push(value);
    }
  }

  if (!['publish', 'pr-only', 'merge-pr'].includes(options.mode)) {
    throw new PublishError('INVALID_ARGUMENT', `Unknown publish mode: ${options.mode}`);
  }
  if (options.yes && options.mode !== 'merge-pr') {
    throw new PublishError('INVALID_ARGUMENT', '--yes is supported only with merge-pr mode.');
  }
  if (options.policyPath && options.mode !== 'publish') {
    throw new PublishError('INVALID_ARGUMENT', '--policy is supported only with publish mode.');
  }
  if (options.mode === 'merge-pr') {
    if (options.showDiff || options.policyPath) {
      throw new PublishError(
        'INVALID_ARGUMENT',
        'merge-pr supports only --yes, --verbose, and --help.',
      );
    }
    if (options.help) return options;
    if (positionals.length !== 1 || !/^[1-9]\d*$/.test(positionals[0])) {
      throw new PublishError(
        'INVALID_ARGUMENT',
        'merge-pr requires exactly one positive integer PR number.',
      );
    }
    options.prNumber = Number(positionals[0]);
    return options;
  }

  if (positionals.length > 2) {
    throw new PublishError(
      'INVALID_ARGUMENT',
      'Expected at most two positional arguments: commit message and PR title.',
    );
  }

  options.prTitleExplicit = positionals.length === 2;
  [options.commitMessage = '', options.prTitle = ''] = positionals;
  if (options.commitMessage && !options.prTitle) options.prTitle = options.commitMessage;
  return options;
}

export function usage() {
  return [
    'Usage:',
    '  node .codex/scripts/publish-changes.mjs [options] ["Commit message"] ["PR title"]',
    '  node .codex/scripts/publish-changes.mjs --mode pr-only [options] ["Commit message"] ["PR title"]',
    '  node .codex/scripts/publish-changes.mjs --mode merge-pr <pr-number> [--yes] [--verbose]',
    '',
    'Options:',
    '  --show-diff    Print the full relevant diff',
    '  --mode MODE    Use publish, pr-only, or merge-pr mode',
    '  --yes          Skip only the merge-pr human confirmation',
    '  --verbose      Print DEBUG output',
    '  --policy PATH  Use a specific YAML policy file',
    '  -h, --help     Show this help',
  ].join('\n');
}
