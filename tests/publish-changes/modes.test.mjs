import { describe, expect, it, vi } from 'vitest';
import { runMergePrFlow } from '../../kit/scripts/publish-changes/merge-pr-flow.mjs';
import { runPrOnlyFlow } from '../../kit/scripts/publish-changes/pr-only-flow.mjs';

function createOutput() {
  const messages = [];
  return {
    messages,
    step: (message) => messages.push(['STEP', message]),
    info: (message) => messages.push(['INFO', message]),
    warning: (message) => messages.push(['WARNING', message]),
    danger: (message) => messages.push(['DANGER', message]),
    success: (message) => messages.push(['SUCCESS', message]),
    skipped: (message) => messages.push(['SKIPPED', message]),
  };
}

function generatedToken(prefix, length = 24) {
  return `${prefix}${'A'.repeat(length)}`;
}

function createPrOnlyHarness({
  branch = 'feature/quick-pr',
  hasUncommitted = true,
  hasUnpushed = false,
  existingPr = null,
} = {}) {
  const calls = [];
  const promptEvents = [];
  let clean = !hasUncommitted;
  let staged = false;
  let head = 'head-sha';
  let tree = hasUncommitted ? 'base-tree' : 'confirmed-tree';
  let parent = 'base-parent';
  const git = {
    repoRoot: async () => '/repo',
    branch: async () => branch,
    origin: async () => 'git@example.test:owner/repo.git',
    fetchDefault: async () => calls.push('fetch'),
    includesDefault: async () => true,
    status: async () => (clean ? '' : ' M package.json'),
    statusZ: async () => (clean ? '' : ' M package.json\0'),
    hashFiles: async () => '',
    upstream: async () => `origin/${branch}`,
    verifyRef: async () => true,
    logRange: async (range) => {
      if (range === 'origin/main..HEAD') return 'abc Branch commit';
      return hasUnpushed ? 'abc Unpushed commit' : '';
    },
    latestSubject: async () => 'Existing branch work',
    diff: async (args) => {
      if (args.includes('--binary')) return 'binary patch';
      if (args.includes('--numstat')) return '2\t0\tpackage.json';
      if (args.includes('--name-status')) return 'M\tpackage.json';
      return '';
    },
    untracked: async () => '',
    addPaths: async (paths) => {
      calls.push(`add:${paths.join(',')}`);
      staged = true;
    },
    writeTree: async () => (staged ? 'confirmed-tree' : 'unstaged-tree'),
    commit: async (message) => {
      calls.push(`commit:${message}`);
      clean = true;
      staged = false;
      parent = head;
      head = 'committed-head';
      tree = 'confirmed-tree';
    },
    push: async (pushedBranch) => calls.push(`push:${pushedBranch}`),
    head: async () => head,
    tree: async () => tree,
    parent: async () => parent,
  };
  const pr = existingPr
    ? {
        number: 17,
        title: 'Existing PR title',
        url: 'https://example.test/pr/17',
        state: 'OPEN',
        baseRefName: 'main',
        headRefName: branch,
        headRefOid: head,
        ...existingPr,
      }
    : null;
  const gh = {
    authReady: async () => true,
    repoName: async () => 'owner/repo',
    listPullRequests: async (_repo, args) => {
      if (args.includes('--head')) return pr ? [{ number: pr.number }] : [];
      return pr ? [pr] : [];
    },
    viewPullRequest: async () =>
      pr || {
        number: 18,
        title: 'New PR',
        url: 'https://example.test/pr/18',
        state: 'OPEN',
        baseRefName: 'main',
        headRefName: branch,
        headRefOid: head,
      },
    createPullRequest: async (_repo, input) => calls.push(`create-pr:${input.title}`),
    commentPullRequest: async (_repo, number) => calls.push(`comment-pr:${number}`),
    updatePullRequestTitle: async (_repo, number, title) =>
      calls.push(`title-pr:${number}:${title}`),
  };
  const prompts = {
    ask: async (message) => {
      promptEvents.push(`ask:${message}`);
      return 'Prompted commit';
    },
    confirm: async (message) => {
      promptEvents.push(`confirm:${message}`);
      return true;
    },
    typed: async (message) => {
      promptEvents.push(`typed:${message}`);
      return true;
    },
  };
  return { calls, promptEvents, git, gh, prompts, output: createOutput() };
}

function prOnlyOptions(overrides = {}) {
  return {
    mode: 'pr-only',
    commitMessage: 'Quick publish',
    prTitle: 'Quick publish',
    prTitleExplicit: false,
    showDiff: false,
    ...overrides,
  };
}

describe('PR-only flow', () => {
  it('commits, pushes, and creates a PR without normal publish prompts', async () => {
    const harness = createPrOnlyHarness();
    const result = await runPrOnlyFlow({
      ...harness,
      options: prOnlyOptions(),
      env: {},
    });
    expect(result.report).toMatchObject({
      prNumber: 18,
      prChangesUrl: 'https://example.test/pr/18/files',
      branch: 'feature/quick-pr',
      action: 'created',
    });
    expect(harness.calls).toEqual([
      'fetch',
      'add:package.json',
      'commit:Quick publish',
      'push:feature/quick-pr',
      'create-pr:Quick publish',
    ]);
    expect(harness.promptEvents).toEqual([]);
  });

  it('prompts only for a missing commit message when uncommitted work exists', async () => {
    const harness = createPrOnlyHarness();
    await runPrOnlyFlow({
      ...harness,
      options: prOnlyOptions({ commitMessage: '', prTitle: '' }),
      env: {},
    });
    expect(harness.promptEvents).toEqual(['ask:Enter commit message: ']);
    expect(harness.calls).toContain('commit:Prompted commit');
  });

  it('reuses an open PR, preserves its title, and never creates a duplicate', async () => {
    const harness = createPrOnlyHarness({ existingPr: {} });
    const result = await runPrOnlyFlow({
      ...harness,
      options: prOnlyOptions(),
      env: {},
    });
    expect(result.report.action).toBe('updated');
    expect(harness.calls).toContain('comment-pr:17');
    expect(harness.calls.some((call) => call.startsWith('create-pr:'))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith('title-pr:'))).toBe(false);
  });

  it('updates an existing title only when the second argument was explicit', async () => {
    const harness = createPrOnlyHarness({ existingPr: {} });
    await runPrOnlyFlow({
      ...harness,
      options: prOnlyOptions({
        prTitle: 'Reviewed title',
        prTitleExplicit: true,
      }),
      env: {},
    });
    expect(harness.calls).toContain('title-pr:17:Reviewed title');
  });

  it('reports an unchanged existing PR without adding a comment', async () => {
    const harness = createPrOnlyHarness({
      hasUncommitted: false,
      hasUnpushed: false,
      existingPr: {},
    });
    const result = await runPrOnlyFlow({
      ...harness,
      options: prOnlyOptions({ commitMessage: '', prTitle: '' }),
      env: {},
    });
    expect(result.report.action).toBe('unchanged');
    expect(harness.calls).toEqual(['fetch', 'push:feature/quick-pr']);
  });

  it('blocks the default branch without creating a feature branch', async () => {
    const harness = createPrOnlyHarness({ branch: 'main' });
    await expect(
      runPrOnlyFlow({
        ...harness,
        options: prOnlyOptions(),
        env: {},
      }),
    ).rejects.toThrow('Create or switch to a feature branch first');
    expect(harness.calls).toEqual(['fetch']);
    expect(harness.promptEvents).toEqual([]);
  });

  it('blocks unauthenticated publishing before staging or push', async () => {
    const harness = createPrOnlyHarness();
    harness.gh.authReady = async () => false;
    await expect(
      runPrOnlyFlow({
        ...harness,
        options: prOnlyOptions(),
        env: {},
      }),
    ).rejects.toThrow('authentication is required');
    expect(harness.calls).toEqual(['fetch']);
  });

  it('blocks confirmed secret-looking content before commit, push, or PR creation', async () => {
    const harness = createPrOnlyHarness();
    const sensitiveValue = generatedToken('xoxb-', 24);
    harness.git.status = async () => ' M config.js';
    harness.git.statusZ = async () => ' M config.js\0';
    harness.git.diff = async (args) => {
      if (args.includes('--binary')) return 'binary patch';
      if (args.includes('--numstat')) return '1\t0\tconfig.js';
      if (args.includes('--name-status')) return 'M\tconfig.js';
      if (args.includes('--cached')) {
        return [
          'diff --git a/config.js b/config.js',
          '--- a/config.js',
          '+++ b/config.js',
          '@@ -0,0 +1 @@',
          `+const value = "${sensitiveValue}";`,
        ].join('\n');
      }
      return '';
    };

    await expect(
      runPrOnlyFlow({
        ...harness,
        options: prOnlyOptions(),
        env: {},
      }),
    ).rejects.toThrow('Publish blocked');

    expect(harness.calls).toEqual(['fetch', 'add:config.js']);
    expect(harness.calls.some((call) => call.startsWith('commit:'))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith('push:'))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith('create-pr:'))).toBe(false);
    expect(
      harness.output.messages.some(([, message]) => message.includes(sensitiveValue)),
    ).toBe(false);
  });

  it('blocks worktree drift before staging or push', async () => {
    const harness = createPrOnlyHarness();
    let snapshots = 0;
    harness.git.statusZ = async () => {
      snapshots += 1;
      return snapshots === 1 ? ' M package.json\0' : ' M package.json\0?? drift.txt\0';
    };
    harness.git.hashFiles = async () => 'drift-hash';
    await expect(
      runPrOnlyFlow({
        ...harness,
        options: prOnlyOptions(),
        env: {},
      }),
    ).rejects.toThrow('Worktree changed after scope collection');
    expect(harness.calls).toEqual(['fetch']);
  });
});

function createMergeHarness({ yes = false, canFastForward = true, checks = [] } = {}) {
  const calls = [];
  const promptEvents = [];
  let viewCount = 0;
  let branch = 'feature/reviewed';
  const openPr = {
    number: 23,
    title: 'Reviewed change',
    url: 'https://example.test/pr/23',
    state: 'OPEN',
    baseRefName: 'main',
    headRefName: 'feature/reviewed',
    headRefOid: 'reviewed-head',
    isDraft: false,
    mergeable: 'MERGEABLE',
    mergeStateStatus: 'CLEAN',
    mergedAt: null,
  };
  const mergedPr = {
    ...openPr,
    state: 'MERGED',
    mergedAt: '2026-06-15T12:00:00Z',
  };
  const git = {
    repoRoot: async () => '/repo',
    origin: async () => 'git@example.test:owner/repo.git',
    status: async () => '',
    fetchDefault: async () => calls.push('fetch'),
    switchBranch: async (next) => {
      calls.push(`switch:${next}`);
      branch = next;
    },
    canFastForwardTo: async () => canFastForward,
    pullFastForward: async (next) => calls.push(`pull:${next}`),
    createBackup: async () => calls.push('backup'),
    resetHard: async () => calls.push('reset'),
    branch: async () => branch,
  };
  const gh = {
    authReady: async () => true,
    repoName: async () => 'owner/repo',
    viewPullRequest: async () => {
      viewCount += 1;
      return viewCount >= 4 ? mergedPr : openPr;
    },
    requiredChecks: vi.fn(async () => checks),
    merge: async (_repo, number, options) =>
      calls.push(`merge:${number}:${options.headSha}:${options.auto}`),
  };
  const prompts = {
    confirm: async (message) => {
      promptEvents.push(`confirm:${message}`);
      return true;
    },
  };
  return {
    calls,
    promptEvents,
    git,
    gh,
    prompts,
    output: createOutput(),
    options: { mode: 'merge-pr', prNumber: 23, yes },
  };
}

describe('merge-PR flow', () => {
  it('shows metadata, confirms, verifies the merge, and refreshes main', async () => {
    const harness = createMergeHarness();
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.promptEvents).toEqual(['confirm:Squash merge PR #23?']);
    expect(harness.calls).toEqual([
      'merge:23:reviewed-head:false',
      'fetch',
      'switch:main',
      'pull:main',
    ]);
    expect(result.report).toMatchObject({
      prNumber: 23,
      mergeStatus: 'verified merged',
      refreshStatus: 'refreshed with fast-forward only',
      currentBranch: 'main',
    });
    expect(harness.output.messages.flat().join('\n')).toContain('Head SHA/OID: reviewed-head');
  });

  it('--yes skips only the human confirmation', async () => {
    const harness = createMergeHarness({ yes: true });
    await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.promptEvents).toEqual([]);
    expect(harness.gh.requiredChecks).toHaveBeenCalledTimes(2);
    expect(harness.calls).toContain('merge:23:reviewed-head:false');
  });

  it('treats no required checks as a passing empty requirement set', async () => {
    const harness = createMergeHarness({ yes: true, checks: [] });
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).resolves.toMatchObject({ status: 'merged-and-refreshed' });
    expect(harness.calls).toContain('merge:23:reviewed-head:false');
  });

  it('blocks a dirty worktree before reading or merging a PR', async () => {
    const harness = createMergeHarness({ yes: true });
    harness.git.status = async () => ' M package.json';
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).rejects.toThrow('Worktree must be clean');
    expect(harness.calls).toEqual([]);
  });

  it('blocks pending required checks before merge', async () => {
    const harness = createMergeHarness({ checks: [{ bucket: 'pending', state: 'PENDING' }] });
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).rejects.toThrow('Required checks are pending');
    expect(harness.calls.some((call) => call.startsWith('merge:'))).toBe(false);
  });

  it('blocks a changed remote head after metadata display', async () => {
    const harness = createMergeHarness();
    let views = 0;
    const originalView = harness.gh.viewPullRequest;
    harness.gh.viewPullRequest = async () => {
      views += 1;
      const pr = await originalView();
      return views === 2 ? { ...pr, headRefOid: 'changed-head' } : pr;
    };
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).rejects.toThrow('does not match the expected head');
    expect(harness.calls.some((call) => call.startsWith('merge:'))).toBe(false);
  });

  it('reports partial success without reset when main cannot fast-forward', async () => {
    const harness = createMergeHarness({ yes: true, canFastForward: false });
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(result.status).toBe('merged-refresh-blocked');
    expect(result.report.refreshStatus).toContain('merge succeeded');
    expect(harness.calls).toEqual([
      'merge:23:reviewed-head:false',
      'fetch',
      'switch:main',
    ]);
    expect(harness.calls).not.toContain('backup');
    expect(harness.calls).not.toContain('reset');
  });
});
