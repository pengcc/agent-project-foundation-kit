export const OUTPUT_LEVELS = [
  "STEP",
  "INFO",
  "WARNING",
  "ERROR",
  "DANGER",
  "PROMPT",
  "SUCCESS",
  "SKIPPED",
  "DEBUG",
];

const ansiRgb = (red, green, blue) => `38;2;${red};${green};${blue}`;

const LEVEL_STYLES = {
  STEP: { color: "96", fullLine: true },
  INFO: { color: "94", fullLine: false },
  WARNING: { color: ansiRgb(243, 156, 18), fullLine: true },
  ERROR: { color: "91", fullLine: true },
  DANGER: { color: "91", fullLine: true },
  PROMPT: { color: "95", fullLine: true },
  SUCCESS: { color: "32", fullLine: false },
  SKIPPED: { color: ansiRgb(221, 151, 108), fullLine: true },
  DEBUG: { color: "90", fullLine: false },
};

export function createOutput({
  stdout = process.stdout,
  stderr = process.stderr,
  verbose = false,
  env = process.env,
} = {}) {
  const streamFor = (level) =>
    ["ERROR", "DANGER", "WARNING"].includes(level) ? stderr : stdout;
  const format = (level, message, stream = streamFor(level)) => {
    const label = `[${level}]`;
    if (!stream.isTTY || env.NO_COLOR !== undefined)
      return `${label} ${message}`;
    const style = LEVEL_STYLES[level] || { color: "0", fullLine: false };
    const coloredLabel = `\u001B[1;${style.color}m${label}`;
    if (style.fullLine) {
      return `${coloredLabel}\u001B[22m ${message}\u001B[0m`;
    }
    return `${coloredLabel}\u001B[0m ${message}`;
  };
  const write = (level, message) => {
    if (level === "DEBUG" && !verbose) return;
    const stream = streamFor(level);
    stream.write(`${format(level, message, stream)}\n`);
  };

  return Object.fromEntries([
    ...OUTPUT_LEVELS.map((level) => [
      level.toLowerCase(),
      (message) => write(level, message),
    ]),
    ["write", write],
    ["format", format],
  ]);
}
