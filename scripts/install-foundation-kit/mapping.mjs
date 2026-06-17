import { join } from 'node:path';
import { walkRegularFiles, relativePosix } from './fs-safe.mjs';

export const DIRECT_MAPPINGS = Object.freeze([
  ['project-templates/AGENTS.md', 'AGENTS.md', 'project-template'],
  [
    'project-templates/project-guideline.md',
    '.codex/project/project-guideline.md',
    'project-template',
  ],
  [
    'project-templates/project-decisions.md',
    '.codex/project/project-decisions.md',
    'project-template',
  ],
  [
    'project-templates/lessons-learned.md',
    '.codex/project/lessons-learned.md',
    'project-template',
  ],
]);

export const TREE_MAPPINGS = Object.freeze([
  ['skills', '.codex/skills', 'skills'],
  ['prompts', '.codex/prompts', 'prompts'],
  ['rules', '.codex/rules', 'rules'],
  ['config', '.codex/config', 'config'],
  ['github-settings', '.codex/github-settings', 'github-settings'],
  ['scripts', '.codex/scripts', 'scripts'],
]);

export function isLocalOsJunkFile(relativePath) {
  const name = relativePath.split('/').at(-1);
  return (
    name === '.DS_Store' ||
    name === 'Thumbs.db' ||
    name === 'desktop.ini' ||
    name.startsWith('._')
  );
}

export async function buildMappings(kitRoot) {
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

  return mappings.sort((left, right) =>
    left.targetRelative.localeCompare(right.targetRelative),
  );
}
