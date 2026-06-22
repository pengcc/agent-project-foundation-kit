import { ansiColor, DEFAULT_OUTPUT_THEME, OUTPUT_LEVELS } from "./output-theme.mjs";

export { OUTPUT_LEVELS } from "./output-theme.mjs";

const COMMAND_COLOR = [28, 112, 230];

export function createOutput({
  stdout = process.stdout,
  stderr = process.stderr,
  verbose = false,
  env = process.env,
  theme = DEFAULT_OUTPUT_THEME,
} = {}) {
  let hasActiveStep = false;
  const streamFor = (level) => (["ERROR", "DANGER", "WARNING"].includes(level) ? stderr : stdout);
  const format = (level, message, stream = streamFor(level)) => {
    const label = `[${level}]`;
    let rendered;
    if (!stream.isTTY || env.NO_COLOR !== undefined) rendered = `${label} ${message}`;
    else {
      const style = theme.levels[level];
      const color = ansiColor(style.color);
      const coloredLabel = `\u001B[1;${color}m${label}`;
      rendered = style.fullLine
        ? `${coloredLabel}\u001B[22m ${message}\u001B[0m`
        : `${coloredLabel}\u001B[0m ${message}`;
    }
    if (level === "STEP" || !hasActiveStep) return rendered;
    return rendered
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
  };
  const write = (level, message) => {
    if (level === "DEBUG" && !verbose) return;
    const stream = streamFor(level);
    stream.write(`${format(level, message, stream)}\n`);
    if (level === "STEP") hasActiveStep = true;
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
