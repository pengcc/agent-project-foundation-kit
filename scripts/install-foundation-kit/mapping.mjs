import { join } from "node:path";
import { relativePosix, walkRegularFiles } from "./fs-safe.mjs";
import { buildOptionalSkillMappings } from "./optional-skills.mjs";

export const DIRECT_MAPPINGS = Object.freeze([
  ["AGENTS.md", "AGENTS.md", "kit-owned"],
  ["codex/project-memory/guideline.md", ".codex/project-memory/guideline.md", "project-owned-seed"],
  ["codex/project-memory/decisions.md", ".codex/project-memory/decisions.md", "project-owned-seed"],
  [
    "codex/project-memory/lessons-learned.md",
    ".codex/project-memory/lessons-learned.md",
    "project-owned-seed",
  ],
  [
    "codex/project-specific/agent-guidance.md",
    ".codex/project-specific/agent-guidance.md",
    "project-owned-seed",
  ],
]);

export const TREE_MAPPINGS = Object.freeze([
  ["codex/skills", ".codex/skills", "skills"],
  ["codex/prompts", ".codex/prompts", "prompts"],
  ["codex/rules", ".codex/rules", "rules"],
  ["repo-tools/config", ".repo-tools/config", "config"],
  ["repo-tools/github-settings", ".repo-tools/github-settings", "github-settings"],
  ["repo-tools/scripts", ".repo-tools/scripts", "scripts"],
]);

export function isLocalOsJunkFile(relativePath) {
  const name = relativePath.split("/").at(-1);
  return (
    name === ".DS_Store" || name === "Thumbs.db" || name === "desktop.ini" || name.startsWith("._")
  );
}

export async function buildMappings(kitRoot, { includeOptional = [] } = {}) {
  const mappings = DIRECT_MAPPINGS.map(([sourceRelative, targetRelative, category]) => ({
    sourceRelative,
    targetRelative,
    category,
  }));

  for (const [sourceDirectory, targetDirectory, category] of TREE_MAPPINGS) {
    const root = join(kitRoot, sourceDirectory);
    for (const sourcePath of await walkRegularFiles(root, { boundary: kitRoot })) {
      const relative = relativePosix(root, sourcePath);
      if (isLocalOsJunkFile(relative)) continue;
      mappings.push({
        sourceRelative: `${sourceDirectory}/${relative}`,
        targetRelative: `${targetDirectory}/${relative}`,
        category,
      });
    }
  }

  mappings.push(...(await buildOptionalSkillMappings(kitRoot, includeOptional)));

  return mappings.sort((left, right) => left.targetRelative.localeCompare(right.targetRelative));
}
