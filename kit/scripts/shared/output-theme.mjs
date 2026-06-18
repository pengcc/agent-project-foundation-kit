import { readFile } from "node:fs/promises";

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

export const DEFAULT_OUTPUT_THEME = Object.freeze({
  version: 1,
  levels: {
    STEP: { color: "94", fullLine: true },
    INFO: { color: "96", fullLine: false },
    WARNING: { color: [243, 156, 18], fullLine: true },
    ERROR: { color: "91", fullLine: true },
    DANGER: { color: "91", fullLine: true },
    PROMPT: { color: "95", fullLine: true },
    SUCCESS: { color: "32", fullLine: false },
    SKIPPED: { color: [221, 151, 108], fullLine: true },
    DEBUG: { color: "90", fullLine: false },
  },
});

function copyDefaults() {
  return structuredClone(DEFAULT_OUTPUT_THEME);
}

function validateColor(color, level) {
  if (typeof color === "string" && /^\d+(;\d+)*$/.test(color)) return;
  if (
    Array.isArray(color) &&
    color.length === 3 &&
    color.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)
  ) {
    return;
  }
  throw new Error(
    `${level}.color must be an ANSI color string or an RGB array of three integers from 0 to 255.`,
  );
}

export function validateOutputTheme(theme) {
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) {
    throw new Error("Theme must be a JSON object.");
  }
  const unknownRoot = Object.keys(theme).filter((key) => !["version", "levels"].includes(key));
  if (unknownRoot.length) {
    throw new Error(`Unknown theme key(s): ${unknownRoot.join(", ")}`);
  }
  if (theme.version !== 1) {
    throw new Error(`Unsupported theme version: ${theme.version}`);
  }
  if (!theme.levels || typeof theme.levels !== "object" || Array.isArray(theme.levels)) {
    throw new Error("Theme levels are required.");
  }

  const unknownLevels = Object.keys(theme.levels).filter((level) => !OUTPUT_LEVELS.includes(level));
  if (unknownLevels.length) {
    throw new Error(`Unknown theme level(s): ${unknownLevels.join(", ")}`);
  }

  for (const level of OUTPUT_LEVELS) {
    const style = theme.levels[level];
    if (!style || typeof style !== "object" || Array.isArray(style)) {
      throw new Error(`Missing theme level: ${level}`);
    }
    const unknownKeys = Object.keys(style).filter((key) => !["color", "fullLine"].includes(key));
    if (unknownKeys.length) {
      throw new Error(`Unknown ${level} theme key(s): ${unknownKeys.join(", ")}`);
    }
    validateColor(style.color, level);
    if (typeof style.fullLine !== "boolean") {
      throw new Error(`${level}.fullLine must be a boolean.`);
    }
  }

  return theme;
}

export async function loadOutputTheme({ path, readFileImpl = readFile } = {}) {
  if (!path) {
    return { theme: copyDefaults(), source: "built-in", warning: "" };
  }

  try {
    const text = await readFileImpl(path, "utf8");
    return {
      theme: validateOutputTheme(JSON.parse(text)),
      source: String(path),
      warning: "",
    };
  } catch (error) {
    const reason =
      error?.code === "ENOENT"
        ? `Theme config not found at ${path}`
        : `Theme config at ${path} is invalid: ${error.message}`;
    return {
      theme: copyDefaults(),
      source: error?.code === "ENOENT" ? "built-in-missing" : "built-in-invalid",
      warning: `${reason}; using built-in defaults.`,
    };
  }
}

export function ansiColor(color) {
  return Array.isArray(color) ? `38;2;${color.join(";")}` : color;
}
