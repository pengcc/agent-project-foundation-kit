import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { InstallerError } from '../../scripts/install-foundation-kit/errors.mjs';
import { runInstallerFlow } from '../../scripts/install-foundation-kit/flow.mjs';
import {
  commandRunner,
  createOutput,
  createTestWorkspace,
} from './helpers.mjs';

const workspaces = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => workspace.cleanup()));
});

async function workspace(name) {
  const value = await createTestWorkspace(name);
  workspaces.push(value);
  return value;
}

function options(target, overrides = {}) {
  return {
    target,
    apply: false,
    showDiff: false,
    verbose: false,
    help: false,
    ...overrides,
  };
}

function prompts({ accept = true } = {}) {
  return {
    confirmBackup: async () => {
      if (!accept) {
        throw new InstallerError('USER_CANCELLED', 'Confirmation token did not match.');
      }
      return true;
    },
  };
}

async function run(fixture, overrides = {}) {
  return runInstallerFlow({
    repoRoot: fixture.repoRoot,
    options: options(fixture.targetRoot, overrides.options),
    output: overrides.output ?? createOutput(),
    prompts: overrides.prompts ?? prompts(),
    commandRunner: overrides.commandRunner ?? commandRunner(),
    runId: overrides.runId ?? 'test-run',
    now: overrides.now ?? (() => new Date('2026-06-15T12:34:56.000Z')),
    hooks: overrides.hooks,
  });
}

describe('installer flow', () => {
  it('performs a zero-write dry-run', async () => {
    const fixture = await workspace('dry-run');
    const result = await run(fixture);
    expect(result.report.mode).toBe('dry-run');
    expect(await readdir(fixture.targetRoot)).toEqual([]);
    await expect(
      lstat(resolve(fixture.repoRoot, 'dev_locals/workflow-tmp/install-foundation-kit/test-run')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('applies a fresh install, preserves executable mode, and omits source-only files', async () => {
    const fixture = await workspace('fresh-apply');
    await writeFile(resolve(fixture.targetRoot, 'package.json'), '{"private":true}\n');
    const originalPackage = await readFile(resolve(fixture.targetRoot, 'package.json'), 'utf8');
    const result = await run(fixture, { options: { apply: true } });

    expect(result.report.mode).toBe('apply');
    expect(await readFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'utf8')).toBe(
      'agent instructions\n',
    );
    expect(
      (await lstat(resolve(fixture.targetRoot, '.codex/scripts/publish-changes.mjs'))).mode &
        0o111,
    ).not.toBe(0);
    expect(await readFile(resolve(fixture.targetRoot, 'package.json'), 'utf8')).toBe(
      originalPackage,
    );
    await expect(
      lstat(resolve(fixture.targetRoot, 'scripts/install-foundation-kit.mjs')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      lstat(resolve(fixture.targetRoot, '.codex/scripts/publish-changes.sh')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      lstat(resolve(fixture.targetRoot, '.codex/scripts/lib/workflow-common.sh')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(lstat(resolve(fixture.targetRoot, 'archive'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('cancels conflicts before runtime staging or target writes', async () => {
    const fixture = await workspace('cancel-conflict');
    await writeFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'existing\n');
    await expect(
      run(fixture, {
        options: { apply: true },
        prompts: prompts({ accept: false }),
        runId: 'not-created',
      }),
    ).rejects.toThrow('Confirmation token did not match');
    expect(await readFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'utf8')).toBe('existing\n');
    await expect(
      lstat(
        resolve(
          fixture.repoRoot,
          'dev_locals/workflow-tmp/install-foundation-kit/not-created',
        ),
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('prepares and verifies backups before replacing conflicts', async () => {
    const fixture = await workspace('backup');
    await writeFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'existing\n');
    const result = await run(fixture, { options: { apply: true } });
    expect(result.report.backupRelative).toBe(
      '.codex/backups/install-20260615-123456',
    );
    const backupRoot = resolve(fixture.targetRoot, result.report.backupRelative);
    expect(await readFile(resolve(backupRoot, 'AGENTS.md'), 'utf8')).toBe('existing\n');
    const manifest = JSON.parse(
      await readFile(resolve(backupRoot, 'manifest.json'), 'utf8'),
    );
    expect(manifest).toMatchObject({
      version: 1,
      status: 'completed',
      completedTargets: expect.arrayContaining(['AGENTS.md']),
    });
    expect(JSON.stringify(manifest)).not.toContain(fixture.root);
    expect(await readFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'utf8')).toBe(
      'agent instructions\n',
    );
  });

  it('leaves mapped target paths untouched when staging or backup preparation fails', async () => {
    const staging = await workspace('staging-failure');
    await expect(
      run(staging, {
        options: { apply: true },
        hooks: {
          afterStaging: async () => {
            throw new Error('injected staging failure');
          },
        },
      }),
    ).rejects.toThrow('injected staging failure');
    expect(await readdir(staging.targetRoot)).toEqual([]);

    const backup = await workspace('backup-failure');
    await writeFile(resolve(backup.targetRoot, 'AGENTS.md'), 'existing\n');
    await expect(
      run(backup, {
        options: { apply: true },
        hooks: {
          afterBackupPrepared: async () => {
            throw new Error('injected backup failure');
          },
        },
      }),
    ).rejects.toThrow('injected backup failure');
    expect(await readFile(resolve(backup.targetRoot, 'AGENTS.md'), 'utf8')).toBe(
      'existing\n',
    );
    await expect(lstat(resolve(backup.targetRoot, '.codex/backups'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('aborts before downstream writes when target or source drifts after staging', async () => {
    const targetDrift = await workspace('target-drift');
    await expect(
      run(targetDrift, {
        options: { apply: true },
        hooks: {
          afterStaging: async ({ roots }) => {
            await writeFile(resolve(roots.targetRoot, 'AGENTS.md'), 'late target change\n');
          },
        },
      }),
    ).rejects.toThrow('Source or target state changed');
    expect(await readFile(resolve(targetDrift.targetRoot, 'AGENTS.md'), 'utf8')).toBe(
      'late target change\n',
    );
    await expect(
      lstat(resolve(targetDrift.targetRoot, '.codex/project/project-guideline.md')),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    const sourceDrift = await workspace('source-drift');
    await expect(
      run(sourceDrift, {
        options: { apply: true },
        hooks: {
          afterStaging: async ({ roots }) => {
            await writeFile(
              resolve(roots.kitRoot, 'project-templates/AGENTS.md'),
              'late source change\n',
            );
          },
        },
      }),
    ).rejects.toThrow('Source or target state changed');
    expect(await readdir(sourceDrift.targetRoot)).toEqual([]);
  });

  it('revalidates after backup materialization before mapped writes', async () => {
    const fixture = await workspace('post-backup-drift');
    await writeFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'existing\n');
    await expect(
      run(fixture, {
        options: { apply: true },
        hooks: {
          afterBackupMaterialized: async ({ roots }) => {
            await writeFile(resolve(roots.targetRoot, 'AGENTS.md'), 'changed after backup\n');
          },
        },
      }),
    ).rejects.toThrow('Source or target state changed');
    expect(await readFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'utf8')).toBe(
      'changed after backup\n',
    );
    expect(
      (await readdir(resolve(fixture.targetRoot, '.codex/backups'))).length,
    ).toBe(1);
  });

  it('records partial progress and preserves the complete backup on copy failure', async () => {
    const fixture = await workspace('partial');
    const output = createOutput();
    await mkdir(resolve(fixture.targetRoot, '.codex/project'), { recursive: true });
    await writeFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'existing agents\n');
    await writeFile(
      resolve(fixture.targetRoot, '.codex/project/project-guideline.md'),
      'existing guideline\n',
    );
    await expect(
      run(fixture, {
        options: { apply: true },
        output,
        hooks: {
          beforeCopy: async ({ completedTargets }) => {
            if (completedTargets.length === 1) throw new Error('injected copy failure');
          },
        },
      }),
    ).rejects.toThrow('injected copy failure');

    const [backupName] = await readdir(resolve(fixture.targetRoot, '.codex/backups'));
    const backupRoot = resolve(fixture.targetRoot, '.codex/backups', backupName);
    expect(await readFile(resolve(backupRoot, 'AGENTS.md'), 'utf8')).toBe(
      'existing agents\n',
    );
    expect(
      await readFile(resolve(backupRoot, '.codex/project/project-guideline.md'), 'utf8'),
    ).toBe('existing guideline\n');
    const manifest = JSON.parse(
      await readFile(resolve(backupRoot, 'manifest.json'), 'utf8'),
    );
    expect(manifest.status).toBe('failed');
    expect(manifest.completedTargets).toHaveLength(1);
    expect(output.messages).toContainEqual([
      'DANGER',
      'Partial apply: 1 mapped file(s) completed before failure.',
    ]);
    expect(output.messages).toContainEqual([
      'INFO',
      'Prepared backup retained at: .codex/backups/install-20260615-123456',
    ]);
  });

  it('treats missing diff as a non-blocking preview warning', async () => {
    const fixture = await workspace('missing-diff');
    await writeFile(resolve(fixture.targetRoot, 'AGENTS.md'), 'existing\n');
    const output = createOutput();
    const result = await run(fixture, {
      options: { showDiff: true },
      output,
      commandRunner: commandRunner({
        ok: false,
        exitCode: null,
        stdout: '',
        stderr: 'spawn diff ENOENT',
      }),
    });
    expect(result.report.mode).toBe('dry-run');
    expect(output.messages).toContainEqual([
      'WARNING',
      'diff -u preview unavailable for AGENTS.md; continuing without preview.',
    ]);
  });
});
