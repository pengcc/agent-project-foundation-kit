import { lstat, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { InstallerError } from "./errors.mjs";
import { assertInside, canonicalExistingDirectory, isInside } from "./path-boundary.mjs";

const REQUIRED_KIT_PATHS = [
  "project-templates/AGENTS.md",
  "project-templates/project-guideline.md",
  "project-templates/project-decisions.md",
  "project-templates/lessons-learned.md",
  "skills",
  "prompts",
  "rules",
  "config",
  "github-settings",
  "scripts",
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
  for (const relativePath of REQUIRED_KIT_PATHS) {
    const path = resolve(kitRoot, relativePath);
    const stats = await lstat(path).catch(() => null);
    if (!stats || stats.isSymbolicLink()) {
      throw new InstallerError(
        "INVALID_SOURCE",
        `Required kit source is missing or is a symlink: ${relativePath}`,
      );
    }
  }
}
