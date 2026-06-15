import { PassThrough } from 'node:stream';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertSupportedRuntime,
} from '../../scripts/install-foundation-kit.mjs';
import {
  parseCliOptions,
  usage,
} from '../../scripts/install-foundation-kit/cli-options.mjs';
import { buildMappings } from '../../scripts/install-foundation-kit/mapping.mjs';
import { buildInstallPlan } from '../../scripts/install-foundation-kit/planner.mjs';
import {
  CONFIRM_TOKEN,
  createInstallerPrompts,
} from '../../scripts/install-foundation-kit/prompts.mjs';
import { resolveInstallRoots } from '../../scripts/install-foundation-kit/validation.mjs';
import { createTestWorkspace } from './helpers.mjs';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
const workspaces = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => workspace.cleanup()));
});

async function workspace(name) {
  const value = await createTestWorkspace(name);
  workspaces.push(value);
  return value;
}

describe('installer CLI', () => {
  it('requires Node 24+', () => {
    expect(() => assertSupportedRuntime('22.0.0')).toThrow('Node.js 24 or newer');
    expect(() => assertSupportedRuntime('24.0.0')).not.toThrow();
  });

  it('parses quoted target paths and candidate flags without modification', () => {
    expect(
      parseCliOptions([
        '--target',
        '/tmp/Project "One" with spaces',
        '--apply',
        '--show-diff',
        '--verbose',
      ]),
    ).toEqual({
      target: '/tmp/Project "One" with spaces',
      apply: true,
      showDiff: true,
      verbose: true,
      help: false,
    });
  });

  it('supports side-effect-free help and rejects missing or unknown arguments', () => {
    expect(parseCliOptions(['--help']).help).toBe(true);
    expect(usage()).toContain('Default mode is dry-run');
    expect(() => parseCliOptions([])).toThrow('--target is required');
    expect(() => parseCliOptions(['--target', '/tmp/x', '--unknown'])).toThrow(
      'Unknown option',
    );
  });
});

describe('source repository package scripts', () => {
  it('adds explicit Node/Bash installer aliases without a default installer alias', () => {
    expect(packageJson.scripts['install:node']).toBe(
      'node scripts/install-foundation-kit.mjs',
    );
    expect(packageJson.scripts['install:bash']).toBe(
      'bash scripts/install-foundation-kit.sh',
    );
    expect(packageJson.scripts.install).toBeUndefined();
  });

  it('runs both installer suites through test:install and pnpm check', () => {
    expect(packageJson.scripts['test:install:node']).toBe(
      'vitest run tests/install-foundation-kit',
    );
    expect(packageJson.scripts['test:install:bash']).toBe(
      'bash scripts/test-install-foundation-kit.sh',
    );
    expect(packageJson.scripts['test:install']).toBe(
      'pnpm test:install:node && pnpm test:install:bash',
    );
    expect(packageJson.scripts.check).toContain('pnpm test:install');
  });
});

describe('mapping and boundaries', () => {
  it('maps templates and complete installable trees deterministically', async () => {
    const fixture = await workspace('mapping');
    const mappings = await buildMappings(fixture.kitRoot);
    expect(mappings).toEqual(
      [...mappings].sort((left, right) =>
        left.targetRelative.localeCompare(right.targetRelative),
      ),
    );
    expect(mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRelative: 'project-templates/AGENTS.md',
          targetRelative: 'AGENTS.md',
        }),
        expect.objectContaining({
          sourceRelative: 'config/example.json',
          targetRelative: '.codex/config/example.json',
        }),
        expect.objectContaining({
          sourceRelative: 'scripts/publish-changes.mjs',
          targetRelative: '.codex/scripts/publish-changes.mjs',
        }),
      ]),
    );
    expect(mappings.some((entry) => entry.sourceRelative.startsWith('scripts/install-'))).toBe(
      false,
    );
    expect(mappings.some((entry) => entry.targetRelative === 'package.json')).toBe(false);
  });

  it('treats identical existing files as conflicts', async () => {
    const fixture = await workspace('identical');
    await writeFile(
      resolve(fixture.targetRoot, 'AGENTS.md'),
      await readFile(resolve(fixture.kitRoot, 'project-templates/AGENTS.md')),
    );
    const plan = await buildInstallPlan(fixture);
    const agents = plan.entries.find((entry) => entry.targetRelative === 'AGENTS.md');
    expect(agents).toMatchObject({
      state: 'conflict',
      contentState: 'identical',
    });
  });

  it('rejects target symlinks and source symlinks', async () => {
    const targetFixture = await workspace('target-symlink');
    const outside = resolve(targetFixture.root, 'outside');
    await mkdir(outside);
    await mkdir(resolve(targetFixture.targetRoot, '.codex'));
    await symlink(outside, resolve(targetFixture.targetRoot, '.codex/skills'));
    await expect(buildInstallPlan(targetFixture)).rejects.toThrow('symlink');

    const sourceFixture = await workspace('source-symlink');
    await symlink(
      resolve(sourceFixture.kitRoot, 'prompts/example.md'),
      resolve(sourceFixture.kitRoot, 'prompts/linked.md'),
    );
    await expect(buildMappings(sourceFixture.kitRoot)).rejects.toThrow(
      'Source symlinks are not supported',
    );
  });

  it('rejects repository-root and kit-contained targets', async () => {
    const fixture = await workspace('unsafe-target');
    await expect(
      resolveInstallRoots({ repoRoot: fixture.repoRoot, target: fixture.repoRoot }),
    ).rejects.toThrow('foundation-kit repository itself');
    await expect(
      resolveInstallRoots({ repoRoot: fixture.repoRoot, target: fixture.kitRoot }),
    ).rejects.toThrow('source kit');
  });
});

describe('confirmation input', () => {
  async function runPrompt({ token, interactive }) {
    const input = new PassThrough();
    const output = new PassThrough();
    if (interactive) {
      input.isTTY = true;
      output.isTTY = true;
    }
    const prompts = createInstallerPrompts({ input, output });
    const pending = prompts.confirmBackup();
    input.end(`${token}\n`);
    try {
      return await pending;
    } finally {
      prompts.close();
    }
  }

  it('accepts exact piped confirmation', async () => {
    await expect(runPrompt({ token: CONFIRM_TOKEN, interactive: false })).resolves.toBe(true);
  });

  it('accepts exact interactive confirmation', async () => {
    await expect(runPrompt({ token: CONFIRM_TOKEN, interactive: true })).resolves.toBe(true);
  });

  it('rejects wrong or missing confirmation', async () => {
    await expect(runPrompt({ token: 'NO', interactive: false })).rejects.toThrow(
      'Confirmation token did not match',
    );
    await expect(runPrompt({ token: '', interactive: false })).rejects.toThrow(
      'Confirmation token did not match',
    );
  });
});
