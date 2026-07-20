import { lstat, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { InstallerError } from "./errors.mjs";
import { assertInside, canonicalExistingDirectory, isInside } from "./path-boundary.mjs";

const REQUIRED_KIT_PATHS = [
  ["AGENTS.md", "file"],
  ["codex/project-memory/guideline.md", "file"],
  ["codex/project-memory/decisions.md", "file"],
  ["codex/project-memory/lessons-learned.md", "file"],
  ["codex/project-specific/agent-guidance.md", "file"],
  ["codex/skills", "directory"],
  ["codex/prompts", "directory"],
  ["codex/rules", "directory"],
  ["codex/optional-skills", "directory"],
  ["repo-tools/config", "directory"],
  ["repo-tools/github-settings", "directory"],
  ["repo-tools/scripts", "directory"],
];

export function sourceRepositoryRoot(importMetaUrl) {
  return resolve(dirname(fileURLToPath(importMetaUrl)), "..");
}

export async function resolveInstallRoots({ repoRoot, target }) {
  const canonicalRepo = await canonicalExistingDirectory(repoRoot, "Source repository");
  const kitRoot = await canonicalExistingDirectory(resolve(canonicalRepo, "kit"), "Source kit");
  assertInside(canonicalRepo, kitRoot, "Source kit");
  const targetStats = await lstat(target).catch(() => null);
  if (!targetStats?.isDirectory() || targetStats.isSymbolicLink()) {
    throw new InstallerError(
      "INVALID_TARGET",
      `Target directory must already exist and must not be a symlink: ${target}`,
    );
  }
  const targetRoot = await realpath(target);
  if (targetRoot === canonicalRepo) {
    throw new InstallerError(
      "INVALID_TARGET",
      "Refusing to install into the foundation-kit repository itself.",
    );
  }
  if (isInside(kitRoot, targetRoot)) {
    throw new InstallerError("INVALID_TARGET", "Refusing to install into or below source kit/.");
  }
  await validateRequiredKitPaths(kitRoot);
  return { repoRoot: canonicalRepo, kitRoot, targetRoot };
}

export async function validateRequiredKitPaths(kitRoot) {
  for (const [relativePath, expectedType] of REQUIRED_KIT_PATHS) {
    const path = resolve(kitRoot, relativePath);
    const stats = await lstat(path).catch(() => null);
    if (!stats || stats.isSymbolicLink()) {
      throw new InstallerError(
        "INVALID_SOURCE",
        `Required kit source is missing or is a symlink: ${relativePath}`,
      );
    }
    const validType = expectedType === "file" ? stats.isFile() : stats.isDirectory();
    if (!validType) {
      throw new InstallerError(
        "INVALID_SOURCE",
        `Required kit source must be a ${expectedType}: ${relativePath}`,
      );
    }
  }
}
