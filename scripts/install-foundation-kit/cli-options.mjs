import { InstallerError } from './errors.mjs';

export function parseCliOptions(argv) {
  const options = {
    target: '',
    apply: false,
    showDiff: false,
    verbose: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--target') {
      index += 1;
      if (!argv[index]) {
        throw new InstallerError('INVALID_ARGUMENT', '--target requires a path.');
      }
      options.target = argv[index];
    } else if (value === '--apply') {
      options.apply = true;
    } else if (value === '--show-diff') {
      options.showDiff = true;
    } else if (value === '--verbose') {
      options.verbose = true;
    } else if (value === '--help' || value === '-h') {
      options.help = true;
    } else {
      throw new InstallerError('INVALID_ARGUMENT', `Unknown option: ${value}`);
    }
  }

  if (!options.help && !options.target) {
    throw new InstallerError('INVALID_ARGUMENT', '--target is required.');
  }
  return options;
}

export function usage() {
  return [
    'Usage:',
    '  node scripts/install-foundation-kit.mjs --target PATH [--apply] [options]',
    '',
    'Default mode is dry-run. No target files are written unless --apply is provided.',
    '',
    'Options:',
    '  --target PATH  Required existing downstream project root',
    '  --apply        Apply the prepared install plan',
    '  --show-diff    Preview conflicts with diff -u when available',
    '  --verbose      Print DEBUG output',
    '  -h, --help     Show this help',
  ].join('\n');
}
