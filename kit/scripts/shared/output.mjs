export const OUTPUT_LEVELS = [
  'STEP',
  'INFO',
  'WARNING',
  'ERROR',
  'DANGER',
  'PROMPT',
  'SUCCESS',
  'SKIPPED',
  'DEBUG',
];

export function createOutput({ stdout = process.stdout, stderr = process.stderr, verbose = false } = {}) {
  const write = (level, message) => {
    if (level === 'DEBUG' && !verbose) return;
    const stream = ['ERROR', 'DANGER', 'WARNING'].includes(level) ? stderr : stdout;
    stream.write(`[${level}] ${message}\n`);
  };

  return Object.fromEntries([
    ...OUTPUT_LEVELS.map((level) => [level.toLowerCase(), (message) => write(level, message)]),
    ['write', write],
  ]);
}
