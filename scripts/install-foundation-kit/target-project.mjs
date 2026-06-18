import { resolve } from "node:path";
import { pathStats } from "./fs-safe.mjs";

export const TARGET_PROJECT_SIGNALS = Object.freeze([
  "package.json",
  "README.md",
  "docs",
  "src",
  "test",
  "tests",
  ".codex",
  "AGENTS.md",
]);

export async function inspectTargetProject(targetRoot) {
  const detectedSignals = [];
  for (const signal of TARGET_PROJECT_SIGNALS) {
    if (await pathStats(resolve(targetRoot, signal))) detectedSignals.push(signal);
  }
  return Object.freeze({
    detectedSignals: Object.freeze(detectedSignals),
    existingProject: detectedSignals.length > 0,
  });
}
