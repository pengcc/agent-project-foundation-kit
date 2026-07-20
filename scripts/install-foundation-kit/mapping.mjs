import { join } from "node:path";
import { relativePosix, walkRegularFiles } from "./fs-safe.mjs";
import { buildOptionalSkillMappings } from "./optional-skills.mjs";

export const DIRECT_MAPPINGS = Object.freeze([
  ["project-templates/AGENTS.md", "AGENTS.md", "kit-owned"],
  [
    "project-templates/project-memory/guideline.md",
    ".codex/project-memory/guideline.md",
    "project-owned-seed",
  ],
  [
    "project-templates/project-memory/decisions.md",
    ".codex/project-memory/decisions.md",
    "project-owned-seed",
  ],
  [
    "project-templates/project-memory/lessons-learned.md",
    ".codex/project-memory/lessons-learned.md",
    "project-owned-seed",
  ],
  [
    "project-templates/project-specific/agent-guidance.md",
    ".codex/project-specific/agent-guidance.md",
    "project-owned-seed",
  ],
]);

export const TREE_MAPPINGS = Object.freeze([
  ["skills", ".codex/skills", "skills"],
  ["prompts", ".codex/prompts", "prompts"],
  ["rules", ".codex/rules", "rules"],
  ["config", ".codex/config", "config"],
  ["github-settings", ".codex/github-settings", "github-settings"],
  ["scripts", ".codex/scripts", "scripts"],
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
