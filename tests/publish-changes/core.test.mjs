import { describe, expect, it, vi } from 'vitest';
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
} from '../../kit/scripts/publish-changes/actions.mjs';
import { createCommandRunner } from '../../kit/scripts/shared/command-runner.mjs';
import { createGhClient } from '../../kit/scripts/shared/gh-client.mjs';
import { assertSupportedRuntime } from '../../kit/scripts/publish-changes.mjs';
import {
  captureWorktreeSnapshot,
  parsePorcelainZ,
} from '../../kit/scripts/publish-changes/state.mjs';
import { chooseValidation } from '../../kit/scripts/publish-changes/prompts.mjs';

describe('CLI options', () => {
  it('requires the declared Node 24 runtime', () => {
    expect(() => assertSupportedRuntime('22.21.1')).toThrow('Node.js 24 or newer is required');
    expect(() => assertSupportedRuntime('24.0.0')).not.toThrow();
  });

  it('preserves two positional arguments and explicit output options', () => {
    expect(parseCliOptions(['--show-diff', 'Commit title', 'PR title'])).toEqual({
      commitMessage: 'Commit title',
      prTitle: 'PR title',
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
    ['wrong SHA', { headRefOid: 'other-sha' }, 'does not match local HEAD'],
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
    expect(result.number).toBe(7);
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
});
