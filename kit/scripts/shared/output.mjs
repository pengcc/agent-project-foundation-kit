import { ansiColor, DEFAULT_OUTPUT_THEME, OUTPUT_LEVELS } from "./output-theme.mjs";

export { OUTPUT_LEVELS } from "./output-theme.mjs";

const COMMAND_COLOR = [171, 156, 89];

export function createOutput({
  stdout = process.stdout,
  stderr = process.stderr,
  verbose = false,
  env = process.env,
  theme = DEFAULT_OUTPUT_THEME,
} = {}) {
  const streamFor = (level) => (["ERROR", "DANGER", "WARNING"].includes(level) ? stderr : stdout);
  const format = (level, message, stream = streamFor(level)) => {
    const label = `[${level}]`;
    if (!stream.isTTY || env.NO_COLOR !== undefined) return `${label} ${message}`;
    const style = theme.levels[level];
    const color = ansiColor(style.color);
    const coloredLabel = `\u001B[1;${color}m${label}`;
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
  const command = (label, commandText) => {
    const stream = streamFor("INFO");
    const styledCommand =
      stream.isTTY && env.NO_COLOR === undefined
        ? `\u001B[${ansiColor(COMMAND_COLOR)}m${commandText}\u001B[0m`
        : commandText;
    stream.write(`${format("INFO", `${label} ${styledCommand}`, stream)}\n`);
  };

  return Object.fromEntries([
    ...OUTPUT_LEVELS.map((level) => [level.toLowerCase(), (message) => write(level, message)]),
    ["command", command],
    ["write", write],
    ["format", format],
  ]);
}
