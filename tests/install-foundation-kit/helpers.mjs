import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const TEST_ROOT = resolve(
  import.meta.dirname,
  '..',
  '..',
  'dev_locals',
  'test-runs',
  'install-foundation-kit-node',
);

export async function createTestWorkspace(name) {
  await mkdir(TEST_ROOT, { recursive: true });
  const root = await mkdtemp(resolve(TEST_ROOT, `${name}-`));
  const repoRoot = resolve(root, 'source repo');
  const targetRoot = resolve(root, 'target project');
  await mkdir(repoRoot, { recursive: true });
  await mkdir(targetRoot, { recursive: true });
  await createFixtureKit(repoRoot);
  return {
    root,
    repoRoot,
    kitRoot: resolve(repoRoot, 'kit'),
    targetRoot,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export async function createFixtureKit(repoRoot) {
  const kitRoot = resolve(repoRoot, 'kit');
  const files = {
    'project-templates/AGENTS.md': 'agent instructions\n',
    'project-templates/project-guideline.md': 'guideline\n',
    'project-templates/project-decisions.md': 'decisions\n',
    'project-templates/lessons-learned.md': 'lessons\n',
    'skills/core/example/SKILL.md': 'skill\n',
    'prompts/example.md': 'prompt\n',
    'rules/example.md': 'rule\n',
    'config/example.json': '{"enabled":true}\n',
    'github-settings/example.json': '{"private":true}\n',
    'scripts/publish-changes.mjs': 'console.log("publish");\n',
  };
  for (const [relative, contents] of Object.entries(files)) {
    const path = resolve(kitRoot, relative);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, contents, 'utf8');
  }
  await chmod(resolve(kitRoot, 'scripts/publish-changes.mjs'), 0o755);
  return kitRoot;
}

export function createOutput() {
  const messages = [];
  const add = (level) => (message) => messages.push([level, message]);
  return {
    messages,
    step: add('STEP'),
    info: add('INFO'),
    warning: add('WARNING'),
    error: add('ERROR'),
    danger: add('DANGER'),
    prompt: add('PROMPT'),
    success: add('SUCCESS'),
    skipped: add('SKIPPED'),
    debug: add('DEBUG'),
  };
}

export function commandRunner(result = { ok: true, exitCode: 0, stdout: '', stderr: '' }) {
  return { run: async () => ({ ...result }) };
}
