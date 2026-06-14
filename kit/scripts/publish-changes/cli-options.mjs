import { PublishError } from '../shared/errors.mjs';

export function parseCliOptions(argv) {
  const options = {
    commitMessage: '',
    prTitle: '',
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
    else if (value === '--help' || value === '-h') options.help = true;
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

  if (positionals.length > 2) {
    throw new PublishError(
      'INVALID_ARGUMENT',
      'Expected at most two positional arguments: commit message and PR title.',
    );
  }

  [options.commitMessage = '', options.prTitle = ''] = positionals;
  if (options.commitMessage && !options.prTitle) options.prTitle = options.commitMessage;
  return options;
}

export function usage() {
  return [
    'Usage:',
    '  node .codex/scripts/publish-changes.mjs [options] ["Commit message"] ["PR title"]',
    '',
    'Options:',
    '  --show-diff    Print the full relevant diff',
    '  --verbose      Print DEBUG output',
    '  --policy PATH  Use a specific YAML policy file',
    '  -h, --help     Show this help',
  ].join('\n');
}
