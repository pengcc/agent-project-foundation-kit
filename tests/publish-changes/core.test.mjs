import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCliOptions } from '../../kit/scripts/publish-changes/cli-options.mjs';
import {
  DEFAULT_POLICY,
  loadPolicy,
  validatePolicy,
} from '../../kit/scripts/publish-changes/policy.mjs';
import {
  buildScopeSummary,
  recommendClassification,
  renderScopeSummary,
} from '../../kit/scripts/publish-changes/scope-summary.mjs';
import {
  assertMergeReady,
  evaluateRequiredChecks,
} from '../../kit/scripts/publish-changes/validation.mjs';
import {
  createOrUpdatePullRequest,
  pollForVerifiedMerge,
  refreshDefaultBranch,
  safeBranchName,
  verifyAndMerge,
} from '../../kit/scripts/publish-changes/actions.mjs';
import { createCommandRunner } from '../../kit/scripts/shared/command-runner.mjs';
import { createGhClient } from '../../kit/scripts/shared/gh-client.mjs';
import { createOutput } from '../../kit/scripts/shared/output.mjs';
import {
  DEFAULT_OUTPUT_THEME,
  loadOutputTheme,
  OUTPUT_LEVELS,
  validateOutputTheme,
} from '../../kit/scripts/shared/output-theme.mjs';
import { assertSupportedRuntime } from '../../kit/scripts/publish-changes.mjs';
import {
  captureWorktreeSnapshot,
  parsePorcelainZ,
} from '../../kit/scripts/publish-changes/state.mjs';
import {
  chooseCompletionMode,
  chooseValidation,
  confirmWithRetry,
} from '../../kit/scripts/publish-changes/prompts.mjs';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
const canonicalOutputTheme = JSON.parse(
  readFileSync(new URL('../../kit/config/publish-cli-theme.json', import.meta.url), 'utf8'),
);

describe('CLI options', () => {
  it('requires the declared Node 24 runtime', () => {
    expect(() => assertSupportedRuntime('22.21.1')).toThrow('Node.js 24 or newer is required');
    expect(() => assertSupportedRuntime('24.0.0')).not.toThrow();
  });

  it('preserves two positional arguments and explicit output options', () => {
    expect(parseCliOptions(['--show-diff', 'Commit title', 'PR title'])).toEqual({
      mode: 'publish',
      commitMessage: 'Commit title',
      prTitle: 'PR title',
      prTitleExplicit: true,
      prNumber: null,
      yes: false,
      showDiff: true,
      verbose: false,
      policyPath: '',
      help: false,
    });
  });

  it('preserves quoted and shell-sensitive argument contents verbatim', () => {
    const options = parseCliOptions([
      'Fix "quoted" value; keep $HOME literal',
      "PR title with spaces and 'quotes'",
    ]);
    expect(options.commitMessage).toBe('Fix "quoted" value; keep $HOME literal');
    expect(options.prTitle).toBe("PR title with spaces and 'quotes'");
  });

  it('rejects shell-style unknown options', () => {
    expect(() => parseCliOptions(['--execute=rm -rf /'])).toThrow('Unknown option');
  });

  it('recognizes help without requiring publish arguments', () => {
    expect(parseCliOptions(['--help'])).toMatchObject({
      commitMessage: '',
      prTitle: '',
      help: true,
    });
  });

  it('parses PR-only mode and tracks an explicitly supplied PR title', () => {
    expect(
      parseCliOptions(['--mode', 'pr-only', 'Commit title', 'Explicit PR title']),
    ).toMatchObject({
      mode: 'pr-only',
      commitMessage: 'Commit title',
      prTitle: 'Explicit PR title',
      prTitleExplicit: true,
      prNumber: null,
      yes: false,
    });
  });

  it('requires a positive PR number and scopes --yes to merge-pr mode', () => {
    expect(parseCliOptions(['--mode', 'merge-pr', '42', '--yes'])).toMatchObject({
      mode: 'merge-pr',
      prNumber: 42,
      yes: true,
    });
    expect(() => parseCliOptions(['--mode', 'merge-pr'])).toThrow(
      'requires exactly one positive integer PR number',
    );
    expect(() => parseCliOptions(['--mode', 'merge-pr', '0'])).toThrow(
      'requires exactly one positive integer PR number',
    );
    expect(() => parseCliOptions(['--yes', 'Commit title'])).toThrow(
      '--yes is supported only with merge-pr mode',
    );
  });
});

describe('source repository package scripts', () => {
  it('uses publish:changes as the maintained publish command without Bash or duplicate aliases', () => {
    expect(packageJson.scripts['publish:changes']).toBe(
      'node kit/scripts/publish-changes.mjs',
    );
    expect(packageJson.scripts['publish:local']).toBeUndefined();
    expect(packageJson.scripts['publish:node']).toBeUndefined();
    expect(packageJson.scripts['publish:pr-only']).toBe(
      'node kit/scripts/publish-changes.mjs --mode pr-only',
    );
    expect(packageJson.scripts['publish:merge-pr']).toBe(
      'node kit/scripts/publish-changes.mjs --mode merge-pr',
    );
    expect(packageJson.scripts['publish:bash']).toBeUndefined();
    expect(packageJson.scripts['apply-theme']).toBeUndefined();
  });

  it('keeps Node workflows and whitespace checks in validation', () => {
    expect(packageJson.scripts['test:publish']).toBe('pnpm test:publish:node');
    expect(packageJson.scripts['test:publish:bash']).toBeUndefined();
    expect(packageJson.scripts.check).not.toContain('apply-theme-zip.sh');
    expect(packageJson.scripts.check).not.toContain('workflow-common.sh');
    expect(packageJson.scripts.check).toContain('pnpm test:publish');
    expect(packageJson.scripts.check).toContain('pnpm test:install');
    expect(packageJson.scripts.check).toContain('git diff --check');
  });
});

describe('interactive prompts and output', () => {
  it.each([
    ['y', true],
    ['Y', true],
    ['yes', true],
    ['YES', true],
    ['n', false],
    ['N', false],
    ['no', false],
    ['NO', false],
    ['', false],
  ])('accepts confirmation response %j', async (answer, expected) => {
    await expect(
      confirmWithRetry({
        ask: async () => answer,
        warning: vi.fn(),
        message: 'Continue?',
      }),
    ).resolves.toBe(expected);
  });

  it('warns and retries after an invalid confirmation response', async () => {
    const ask = vi.fn().mockResolvedValueOnce('z').mockResolvedValueOnce('YES');
    const warning = vi.fn();
    await expect(confirmWithRetry({ ask, warning, message: 'Continue?' })).resolves.toBe(true);
    expect(ask).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('Invalid response "z"'));
  });

  it('cancels after two invalid confirmation responses', async () => {
    const ask = vi.fn().mockResolvedValueOnce('z').mockResolvedValueOnce('maybe');
    await expect(
      confirmWithRetry({ ask, warning: vi.fn(), message: 'Continue?' }),
    ).rejects.toMatchObject({
      type: 'USER_CANCELLED',
      message: expect.stringContaining('2 invalid confirmation responses'),
    });
  });

  it('uses full-line semantic color and label-only informational color', () => {
    const tty = { isTTY: true, write: vi.fn() };
    const plain = { isTTY: false, write: vi.fn() };
    const colored = createOutput({ stdout: tty, stderr: tty, env: {}, verbose: true });
    colored.step('Colored step');
    colored.info('Colored info');
    colored.warning('Colored warning');
    colored.error('Colored error');
    colored.danger('Colored danger');
    colored.prompt('Colored prompt');
    colored.success('Colored success');
    colored.skipped('Colored skipped');
    colored.debug('Colored debug');
    createOutput({ stdout: plain, stderr: plain, env: {} }).success('Plain success');

    expect(tty.write.mock.calls[0][0]).toBe(
      '\u001B[1;94m[STEP]\u001B[22m Colored step\u001B[0m\n',
    );
    expect(tty.write.mock.calls[1][0]).toBe(
      '\u001B[1;96m[INFO]\u001B[0m Colored info\n',
    );
    expect(tty.write.mock.calls[2][0]).toBe(
      '\u001B[1;38;2;243;156;18m[WARNING]\u001B[22m Colored warning\u001B[0m\n',
    );
    expect(tty.write.mock.calls[3][0]).toBe(
      '\u001B[1;91m[ERROR]\u001B[22m Colored error\u001B[0m\n',
    );
    expect(tty.write.mock.calls[4][0]).toBe(
      '\u001B[1;91m[DANGER]\u001B[22m Colored danger\u001B[0m\n',
    );
    expect(tty.write.mock.calls[5][0]).toBe(
      '\u001B[1;95m[PROMPT]\u001B[22m Colored prompt\u001B[0m\n',
    );
    expect(tty.write.mock.calls[6][0]).toBe(
      '\u001B[1;32m[SUCCESS]\u001B[0m Colored success\n',
    );
    expect(tty.write.mock.calls[7][0]).toBe(
      '\u001B[1;38;2;221;151;108m[SKIPPED]\u001B[22m Colored skipped\u001B[0m\n',
    );
    expect(tty.write.mock.calls[8][0]).toBe(
      '\u001B[1;90m[DEBUG]\u001B[0m Colored debug\n',
    );
    expect(plain.write).toHaveBeenCalledWith('[SUCCESS] Plain success\n');
    expect(tty.write.mock.calls[0][0]).toContain('[STEP]\u001B[22m Colored step');
    expect(tty.write.mock.calls[0][0]).not.toContain('\u001B[1;94mColored step');
  });

  it('uses distinct styles for STEP/INFO and WARNING/SKIPPED', () => {
    const tty = { isTTY: true, write: vi.fn() };
    const output = createOutput({ stdout: tty, stderr: tty, env: {}, verbose: true });
    output.step('Step');
    output.info('Info');
    output.warning('Warning');
    output.skipped('Skipped');
    output.debug('Debug');

    const [step, info, warning, skipped, debug] = tty.write.mock.calls.map(([text]) => text);
    expect(step).toContain('\u001B[1;94m[STEP]');
    expect(info).toContain('\u001B[1;96m[INFO]');
    expect(warning).toContain('\u001B[1;38;2;243;156;18m[WARNING]');
    expect(skipped).toContain('\u001B[1;38;2;221;151;108m[SKIPPED]');
    expect(debug).toContain('\u001B[1;90m[DEBUG]');
    expect(warning).not.toContain('38;2;221;151;108');
    expect(skipped).not.toContain('38;2;243;156;18');
  });

  it('disables every ANSI style when NO_COLOR is set', () => {
    const tty = { isTTY: true, write: vi.fn() };
    const output = createOutput({
      stdout: tty,
      stderr: tty,
      env: { NO_COLOR: '1' },
      verbose: true,
    });
    for (const level of [
      'step',
      'info',
      'warning',
      'error',
      'danger',
      'prompt',
      'success',
      'skipped',
      'debug',
    ]) {
      output[level](`${level} message`);
    }
    const rendered = tty.write.mock.calls.map(([text]) => text).join('');
    expect(rendered).not.toContain('\u001B[');
    expect(rendered).toContain('[WARNING] warning message');
    expect(rendered).toContain('[DEBUG] debug message');
  });

  it('shows PR-only and auto-merge when Normal policy allows auto-merge', async () => {
    const prompts = { ask: vi.fn().mockResolvedValue('2') };
    const output = { info: vi.fn() };
    await expect(
      chooseCompletionMode(
        prompts,
        'normal',
        { allow_auto_merge: true, allow_immediate_merge: false },
        output,
      ),
    ).resolves.toBe('auto');
    expect(prompts.ask).toHaveBeenCalledWith(
      expect.stringContaining('1) PR only  2) Enable auto-merge with squash'),
    );
  });

  it('explains policy-disabled completion modes and rejects unavailable selection clearly', async () => {
    const prompts = { ask: vi.fn().mockResolvedValue('2') };
    const output = { info: vi.fn() };
    await expect(
      chooseCompletionMode(
        prompts,
        'significant',
        { allow_auto_merge: false, allow_immediate_merge: false },
        output,
      ),
    ).rejects.toThrow('Auto-merge disabled by policy for SIGNIFICANT');
    expect(output.info).toHaveBeenCalledWith(
      'Auto-merge disabled by policy for SIGNIFICANT.',
    );
    expect(output.info).toHaveBeenCalledWith(
      'Immediate merge disabled by policy for SIGNIFICANT.',
    );
  });
});

describe('output theme config', () => {
  it('loads the canonical config with every required level and no boldLabel option', async () => {
    const result = await loadOutputTheme({
      path: new URL('../../kit/config/publish-cli-theme.json', import.meta.url),
    });
    expect(result.warning).toBe('');
    expect(result.theme).toEqual(canonicalOutputTheme);
    expect(Object.keys(result.theme.levels)).toEqual(OUTPUT_LEVELS);
    for (const style of Object.values(result.theme.levels)) {
      expect(style).toEqual({
        color: style.color,
        fullLine: style.fullLine,
      });
      expect(style).not.toHaveProperty('boldLabel');
    }
  });

  it('accepts ANSI color strings and valid RGB arrays', () => {
    const theme = structuredClone(DEFAULT_OUTPUT_THEME);
    theme.levels.STEP.color = '1;94';
    theme.levels.WARNING.color = [0, 128, 255];
    expect(validateOutputTheme(theme)).toBe(theme);
  });

  it.each([
    [[255, 0], 'RGB array'],
    [[256, 0, 0], 'RGB array'],
    [[1.5, 0, 0], 'RGB array'],
    ['#F39C12', 'ANSI color string'],
  ])('rejects unsupported color value %j', (color, message) => {
    const theme = structuredClone(DEFAULT_OUTPUT_THEME);
    theme.levels.WARNING.color = color;
    expect(() => validateOutputTheme(theme)).toThrow(message);
  });

  it('rejects boldLabel because label bold is a fixed rendering rule', () => {
    const theme = structuredClone(DEFAULT_OUTPUT_THEME);
    theme.levels.INFO.boldLabel = false;
    expect(() => validateOutputTheme(theme)).toThrow('Unknown INFO theme key(s): boldLabel');
  });

  it('warns and falls back to canonical built-in defaults for invalid config', async () => {
    const result = await loadOutputTheme({
      path: '/invalid-theme.json',
      readFileImpl: async () => '{"version":1,"levels":{}}',
    });
    expect(result.source).toBe('built-in-invalid');
    expect(result.warning).toContain('using built-in defaults');
    expect(result.theme).toEqual(DEFAULT_OUTPUT_THEME);
  });

  it('warns and falls back to canonical built-in defaults for missing config', async () => {
    const error = Object.assign(new Error('missing'), { code: 'ENOENT' });
    const result = await loadOutputTheme({
      path: '/missing-theme.json',
      readFileImpl: async () => {
        throw error;
      },
    });
    expect(result.source).toBe('built-in-missing');
    expect(result.warning).toContain('Theme config not found');
    expect(result.theme).toEqual(DEFAULT_OUTPUT_THEME);
  });

  it('renders every label bold without leaking bold into message text', () => {
    const tty = { isTTY: true, write: vi.fn() };
    const output = createOutput({
      stdout: tty,
      stderr: tty,
      env: {},
      verbose: true,
      theme: canonicalOutputTheme,
    });

    for (const level of OUTPUT_LEVELS) output.write(level, `${level} message`);

    for (const [index, level] of OUTPUT_LEVELS.entries()) {
      const rendered = tty.write.mock.calls[index][0];
      expect(rendered).toContain(`m[${level}]`);
      expect(rendered.slice(0, rendered.indexOf(`[${level}]`))).toContain('[1;');
      if (canonicalOutputTheme.levels[level].fullLine) {
        expect(rendered).toContain(`m[${level}]\u001B[22m ${level} message\u001B[0m`);
      } else {
        expect(rendered).toContain(`m[${level}]\u001B[0m ${level} message`);
      }
    }
  });
});

describe('policy loading', () => {
  it('parses the shipped YAML policy through the package-managed runtime dependency', async () => {
    const result = await loadPolicy({
      path: new URL('../../kit/config/publish-changes-policy.yml', import.meta.url),
    });
    expect(result.policy).toEqual(DEFAULT_POLICY);
  });

  it('uses conservative built-in defaults when YAML support is unavailable', async () => {
    const result = await loadPolicy({
      path: '/policy.yml',
      readFileImpl: async () => 'version: 1',
      yamlLoader: null,
    });
    expect(result.source).toBe('built-in-no-yaml');
    expect(result.policy).toEqual(DEFAULT_POLICY);
  });

  it('fails closed for malformed policies', () => {
    const invalid = structuredClone(DEFAULT_POLICY);
    invalid.classifications.significant.allow_not_run = true;
    expect(() => validatePolicy(invalid)).toThrow('Significant updates cannot allow NOT_RUN');
  });

  it('fails closed for malformed YAML and unknown keys', async () => {
    await expect(
      loadPolicy({
        path: '/policy.yml',
        readFileImpl: async () => 'version: [',
        yamlLoader: () => {
          throw new Error('bad yaml');
        },
      }),
    ).rejects.toThrow('Could not parse policy');

    const invalid = structuredClone(DEFAULT_POLICY);
    invalid.classifications.normal.unexpected = true;
    expect(() => validatePolicy(invalid)).toThrow('Unknown normal key');
  });

  it.each([
    ['require_validation', false, 'structured validation'],
    ['require_manual_review', false, 'manual review'],
    ['require_typed_confirmation', false, 'typed merge confirmation'],
    ['allow_not_run', true, 'cannot allow NOT_RUN'],
  ])('rejects unsafe Significant policy override %s=%s', (key, value, message) => {
    const invalid = structuredClone(DEFAULT_POLICY);
    invalid.classifications.significant[key] = value;
    expect(() => validatePolicy(invalid)).toThrow(message);
  });

  it('never emits the Small safe validation code for Normal or Significant', async () => {
    const prompts = { ask: async () => 'CHECK_PASSED' };
    await expect(
      chooseValidation(prompts, 'normal', { require_validation: false, allow_not_run: true }),
    ).rejects.toThrow('cannot skip structured validation');
    await expect(
      chooseValidation(prompts, 'significant', {
        require_validation: false,
        allow_not_run: false,
      }),
    ).rejects.toThrow('cannot skip structured validation');
  });
});

describe('scope and validation', () => {
  it('summarizes risk without requiring a full diff', () => {
    const summary = buildScopeSummary({
      branch: 'feature/test',
      nameStatus: 'M\tkit/scripts/publish-changes.mjs\nA\tdocs/note.md',
      numstat: '10\t2\tkit/scripts/publish-changes.mjs\n3\t0\tdocs/note.md',
    });
    expect(summary.lines).toEqual({ added: 13, deleted: 2 });
    expect(summary.highRiskHints).toContain('installable workflow changed');
    expect(recommendClassification(summary)).toBe('significant');
  });

  it('includes untracked paths in the collected scope snapshot', async () => {
    const git = {
      statusZ: async () => ' M tracked.txt\0?? new file.txt\0',
      diff: async () => 'tracked patch',
      hashFiles: async () => 'untracked-hash',
    };
    const snapshot = await captureWorktreeSnapshot(git);
    expect(snapshot.paths).toEqual(['new file.txt', 'tracked.txt']);
    expect(snapshot.untracked).toEqual([{ path: 'new file.txt', hash: 'untracked-hash' }]);
    expect(parsePorcelainZ(snapshot.statusZ)).toContainEqual({
      status: '??',
      path: 'new file.txt',
    });
  });

  it('keeps full diff output opt-in', () => {
    const messages = [];
    const output = {
      step: (message) => messages.push(message),
      info: (message) => messages.push(message),
      warning: (message) => messages.push(message),
      skipped: (message) => messages.push(message),
    };
    const summary = buildScopeSummary({
      branch: 'feature/test',
      nameStatus: 'M\tfile.txt',
      numstat: '1\t0\tfile.txt',
      diff: 'SECRET_FULL_DIFF',
    });
    renderScopeSummary(summary, output);
    expect(messages.join('\n')).not.toContain('SECRET_FULL_DIFF');
    renderScopeSummary(summary, output, { showDiff: true });
    expect(messages.join('\n')).toContain('SECRET_FULL_DIFF');
  });

  it('shows untracked file paths in the concise scope summary', () => {
    const messages = [];
    const output = {
      step: (message) => messages.push(message),
      info: (message) => messages.push(message),
      warning: (message) => messages.push(message),
      skipped: (message) => messages.push(message),
    };
    const summary = buildScopeSummary({
      branch: 'feature/test',
      nameStatus: '?\tnew file.txt\nM\ttracked.txt',
      numstat: '1\t0\ttracked.txt',
    });
    renderScopeSummary(summary, output);
    expect(messages.join('\n')).toContain('? new file.txt');
    expect(messages.join('\n')).toContain('M tracked.txt');
  });

  it('rejects failed and pending checks for immediate merge', () => {
    expect(() => evaluateRequiredChecks([{ bucket: 'fail', state: 'FAILURE' }], 'auto')).toThrow(
      'Required check is fail',
    );
    expect(() => evaluateRequiredChecks([{ bucket: 'pending' }], 'immediate')).toThrow(
      'Required checks are pending',
    );
  });

  it.each([
    ['wrong base', { baseRefName: 'develop' }, 'not main'],
    ['wrong head', { headRefName: 'feature/other' }, 'does not match'],
    ['wrong SHA', { headRefOid: 'other-sha' }, 'does not match the expected head'],
    ['draft', { isDraft: true }, 'Draft PRs'],
    ['conflict', { mergeable: 'CONFLICTING' }, 'conflicts'],
    ['unknown mergeability', { mergeable: 'UNKNOWN' }, 'not resolved merge readiness'],
    ['unknown merge state', { mergeStateStatus: 'UNKNOWN' }, 'not resolved merge readiness'],
  ])('blocks merge for %s', (_label, override, message) => {
    const pr = {
      number: 7,
      state: 'OPEN',
      baseRefName: 'main',
      headRefName: 'feature/test',
      headRefOid: 'head-sha',
      isDraft: false,
      mergeable: 'MERGEABLE',
      mergeStateStatus: 'CLEAN',
      ...override,
    };
    expect(() =>
      assertMergeReady(pr, {
        branch: 'feature/test',
        defaultBranch: 'main',
        headSha: 'head-sha',
      }),
    ).toThrow(message);
  });

  it('retries transient unknown merge readiness before merging', async () => {
    const views = [
      {
        number: 7,
        state: 'OPEN',
        baseRefName: 'main',
        headRefName: 'feature/test',
        headRefOid: 'head-sha',
        isDraft: false,
        mergeable: 'UNKNOWN',
        mergeStateStatus: 'UNKNOWN',
      },
      {
        number: 7,
        state: 'OPEN',
        baseRefName: 'main',
        headRefName: 'feature/test',
        headRefOid: 'head-sha',
        isDraft: false,
        mergeable: 'MERGEABLE',
        mergeStateStatus: 'CLEAN',
      },
    ];
    const gh = {
      viewPullRequest: vi.fn(async () => views.shift()),
      requiredChecks: vi.fn(async () => []),
      merge: vi.fn(async () => {}),
    };
    const sleep = vi.fn(async () => {});
    const output = { warning: vi.fn() };

    await expect(
      verifyAndMerge({
        gh,
        git: { head: async () => 'head-sha' },
        repo: 'owner/repo',
        pr: { number: 7 },
        branch: 'feature/test',
        defaultBranch: 'main',
        mode: 'auto',
        output,
        attempts: 3,
        intervalMs: 1,
        sleep,
      }),
    ).resolves.toMatchObject({ checkState: { pending: false } });

    expect(gh.viewPullRequest).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(output.warning).toHaveBeenCalledWith(
      expect.stringContaining('still calculating merge readiness'),
    );
    expect(gh.merge).toHaveBeenCalledTimes(1);
  });

  it('blocks safely when merge readiness remains unknown', async () => {
    const gh = {
      viewPullRequest: vi.fn(async () => ({
        number: 7,
        state: 'OPEN',
        baseRefName: 'main',
        headRefName: 'feature/test',
        headRefOid: 'head-sha',
        isDraft: false,
        mergeable: 'UNKNOWN',
        mergeStateStatus: 'UNKNOWN',
      })),
      requiredChecks: vi.fn(async () => []),
      merge: vi.fn(async () => {}),
    };

    await expect(
      verifyAndMerge({
        gh,
        git: { head: async () => 'head-sha' },
        repo: 'owner/repo',
        pr: { number: 7 },
        branch: 'feature/test',
        defaultBranch: 'main',
        mode: 'auto',
        output: { warning: vi.fn() },
        attempts: 3,
        intervalMs: 1,
        sleep: async () => {},
      }),
    ).rejects.toThrow('GitHub has not resolved merge readiness');

    expect(gh.viewPullRequest).toHaveBeenCalledTimes(3);
    expect(gh.requiredChecks).not.toHaveBeenCalled();
    expect(gh.merge).not.toHaveBeenCalled();
  });
});

describe('command and branch safety', () => {
  it('passes command arguments without a shell', async () => {
    const runner = createCommandRunner();
    const result = await runner.run(process.execPath, [
      '-e',
      'process.stdout.write(process.argv[1])',
      'literal;$(echo unsafe)',
    ]);
    expect(result.ok).toBe(true);
    expect(result.stdout).toBe('literal;$(echo unsafe)');
  });

  it('creates normalized feature branch names', () => {
    expect(
      safeBranchName('Migrate publish workflow!', {
        prefix: 'change',
        now: new Date('2026-06-13T12:34:56Z'),
      }),
    ).toBe('change/migrate-publish-workflow-20260613-123456');
  });

  it('preserves GitHub CLI required-check errors and blocks merge', async () => {
    const runner = {
      run: vi.fn().mockResolvedValue({
        ok: false,
        exitCode: 1,
        stdout: '',
        stderr: 'HTTP 403: required checks unavailable',
      }),
    };
    const gh = createGhClient(runner, '/repo');
    await expect(gh.requiredChecks('owner/repo', 7)).rejects.toThrow(
      'HTTP 403: required checks unavailable',
    );
  });

  it('blocks a failed required-check command even when it emits JSON', async () => {
    const runner = {
      run: vi.fn().mockResolvedValue({
        ok: false,
        exitCode: 1,
        stdout: '[{"bucket":"pass","state":"SUCCESS"}]',
        stderr: 'HTTP 500: check service unavailable',
      }),
    };
    const gh = createGhClient(runner, '/repo');
    await expect(gh.requiredChecks('owner/repo', 7)).rejects.toThrow(
      'HTTP 500: check service unavailable',
    );
  });

  it('reuses an existing pull request instead of creating a duplicate', async () => {
    const calls = [];
    const gh = {
      listPullRequests: async () => [{ number: 7 }],
      commentPullRequest: async (_repo, number) => calls.push(`comment:${number}`),
      viewPullRequest: async () => ({ number: 7, url: 'https://example.test/pr/7' }),
      createPullRequest: async () => calls.push('create'),
    };
    const result = await createOrUpdatePullRequest({
      gh,
      git: { head: async () => 'head-sha' },
      repo: 'owner/repo',
      branch: 'feature/test',
      defaultBranch: 'main',
      title: 'Reuse PR',
      classification: 'normal',
      validation: 'CHECK_PASSED',
    });
    expect(result).toMatchObject({
      action: 'updated',
      pr: { number: 7 },
    });
    expect(calls).toEqual(['comment:7']);
  });
});

describe('post-merge recovery', () => {
  it('polls until GitHub reports a verified merge into the default branch', async () => {
    const viewPullRequest = vi
      .fn()
      .mockResolvedValueOnce({ number: 4, state: 'OPEN', baseRefName: 'main', mergedAt: null })
      .mockResolvedValueOnce({
        number: 4,
        state: 'MERGED',
        baseRefName: 'main',
        mergedAt: '2026-06-13T12:00:00Z',
      });
    const result = await pollForVerifiedMerge({
      gh: { viewPullRequest },
      repo: 'owner/repo',
      prNumber: 4,
      defaultBranch: 'main',
      intervalMs: 0,
      sleep: async () => {},
    });
    expect(result.state).toBe('MERGED');
  });

  it('creates a backup and requires typed approval before a hard reset', async () => {
    const calls = [];
    const git = {
      status: async () => '',
      fetchDefault: async () => calls.push('fetch'),
      switchBranch: async () => calls.push('switch'),
      canFastForwardTo: async () => false,
      createBackup: async (branch) => calls.push(`backup:${branch}`),
      resetHard: async () => calls.push('reset'),
    };
    const result = await refreshDefaultBranch({
      git,
      prompts: { typed: async () => false },
      output: { danger: vi.fn(), skipped: vi.fn(), success: vi.fn() },
      defaultBranch: 'main',
      verifiedPr: {
        number: 9,
        baseRefName: 'main',
        mergedAt: '2026-06-13T12:00:00Z',
      },
    });
    expect(result.refreshed).toBe(false);
    expect(calls.some((call) => call.startsWith('backup:'))).toBe(true);
    expect(calls).not.toContain('reset');
  });

  it('rejects refresh without a verified merge into the expected base', async () => {
    const git = { status: vi.fn() };
    await expect(
      refreshDefaultBranch({
        git,
        prompts: {},
        output: {},
        defaultBranch: 'main',
        verifiedPr: { number: 9, baseRefName: 'main', mergedAt: null },
      }),
    ).rejects.toThrow('not verified merged');
    await expect(
      refreshDefaultBranch({
        git,
        prompts: {},
        output: {},
        defaultBranch: 'main',
        verifiedPr: {
          number: 9,
          baseRefName: 'develop',
          mergedAt: '2026-06-13T12:00:00Z',
        },
      }),
    ).rejects.toThrow('not verified merged');
    expect(git.status).not.toHaveBeenCalled();
  });

  it('resets a diverged default branch only after backup and typed approval', async () => {
    const calls = [];
    const git = {
      status: async () => '',
      fetchDefault: async () => calls.push('fetch'),
      switchBranch: async () => calls.push('switch'),
      canFastForwardTo: async () => false,
      createBackup: async (branch) => calls.push(`backup:${branch}`),
      resetHard: async () => calls.push('reset'),
    };
    const result = await refreshDefaultBranch({
      git,
      prompts: { typed: async () => true },
      output: { danger: vi.fn(), skipped: vi.fn(), success: vi.fn() },
      defaultBranch: 'main',
      verifiedPr: {
        number: 9,
        baseRefName: 'main',
        mergedAt: '2026-06-13T12:00:00Z',
      },
    });
    expect(result).toMatchObject({ refreshed: true, reset: true });
    expect(calls[2]).toMatch(/^backup:/);
    expect(calls[3]).toBe('reset');
  });

  it('leaves a diverged default branch intact in fast-forward-only mode', async () => {
    const calls = [];
    const git = {
      status: async () => '',
      fetchDefault: async () => calls.push('fetch'),
      switchBranch: async () => calls.push('switch'),
      canFastForwardTo: async () => false,
      createBackup: async () => calls.push('backup'),
      resetHard: async () => calls.push('reset'),
    };
    const result = await refreshDefaultBranch({
      git,
      prompts: { typed: vi.fn() },
      output: { skipped: vi.fn(), success: vi.fn() },
      defaultBranch: 'main',
      verifiedPr: {
        number: 9,
        baseRefName: 'main',
        mergedAt: '2026-06-13T12:00:00Z',
      },
      fastForwardOnly: true,
    });
    expect(result).toMatchObject({
      refreshed: false,
      reset: false,
      reason: 'non-fast-forward',
    });
    expect(calls).toEqual(['fetch', 'switch']);
  });
});
