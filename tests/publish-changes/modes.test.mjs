import { describe, expect, it, vi } from "vitest";
import { runMergePrFlow } from "../../kit/scripts/publish-changes/merge-pr-flow.mjs";
import { runPrReviewFlow } from "../../kit/scripts/publish-changes/pr-review-flow.mjs";
import { PublishError } from "../../kit/scripts/shared/errors.mjs";

function createOutput() {
  const messages = [];
  return {
    messages,
    step: (message) => messages.push(["STEP", message]),
    info: (message) => messages.push(["INFO", message]),
    command: (label, command) => messages.push(["INFO", `${label} ${command}`]),
    warning: (message) => messages.push(["WARNING", message]),
    danger: (message) => messages.push(["DANGER", message]),
    success: (message) => messages.push(["SUCCESS", message]),
    skipped: (message) => messages.push(["SKIPPED", message]),
  };
}

function generatedToken(prefix, length = 24) {
  return `${prefix}${"A".repeat(length)}`;
}

function createPrReviewHarness({
  branch = "feature/quick-pr",
  hasUncommitted = true,
  hasUnpushed = false,
  existingPr = null,
} = {}) {
  const calls = [];
  const promptEvents = [];
  let clean = !hasUncommitted;
  let staged = false;
  let head = "head-sha";
  let tree = hasUncommitted ? "base-tree" : "confirmed-tree";
  let parent = "base-parent";
  const git = {
    repoRoot: async () => "/repo",
    branch: async () => branch,
    origin: async () => "git@example.test:owner/repo.git",
    fetchDefault: async () => calls.push("fetch"),
    includesDefault: async () => true,
    status: async () => (clean ? "" : " M package.json"),
    statusZ: async () => (clean ? "" : " M package.json\0"),
    hashFiles: async () => "",
    upstream: async () => `origin/${branch}`,
    verifyRef: async () => true,
    logRange: async (range) => {
      if (range === "origin/main..HEAD") return "abc Branch commit";
      return hasUnpushed ? "abc Unpushed commit" : "";
    },
    latestSubject: async () => "Existing branch work",
    diff: async (args) => {
      if (args.includes("--binary")) return "binary patch";
      if (!hasUncommitted && !hasUnpushed) return "";
      if (args.includes("--numstat")) return "2\t0\tpackage.json";
      if (args.includes("--name-status")) return "M\tpackage.json";
      return "";
    },
    untracked: async () => "",
    addPaths: async (paths) => {
      calls.push(`add:${paths.join(",")}`);
      staged = true;
    },
    writeTree: async () => (staged ? "confirmed-tree" : "unstaged-tree"),
    commit: async (message) => {
      calls.push(`commit:${message}`);
      clean = true;
      staged = false;
      parent = head;
      head = "committed-head";
      tree = "confirmed-tree";
    },
    push: async (pushedBranch) => calls.push(`push:${pushedBranch}`),
    head: async () => head,
    tree: async () => tree,
    parent: async () => parent,
  };
  const pr = existingPr
    ? {
        number: 17,
        title: "Existing PR title",
        url: "https://example.test/pr/17",
        state: "OPEN",
        baseRefName: "main",
        headRefName: branch,
        headRefOid: head,
        ...existingPr,
      }
    : null;
  const gh = {
    authReady: async () => true,
    repoName: async () => "owner/repo",
    listPullRequests: async (_repo, args) => {
      if (args.includes("--head")) return pr ? [{ number: pr.number }] : [];
      return pr ? [pr] : [];
    },
    viewPullRequest: async () => {
      const viewedPr = pr || {
        number: 18,
        title: "New PR",
        url: "https://example.test/pr/18",
        state: "OPEN",
        baseRefName: "main",
        headRefName: branch,
        headRefOid: head,
      };
      return {
        ...viewedPr,
        headRefOid: existingPr?.headRefOid ?? head,
      };
    },
    createPullRequest: async (_repo, input) => calls.push(`create-pr:${input.title}`),
    commentPullRequest: async (_repo, number) => calls.push(`comment-pr:${number}`),
    updatePullRequestTitle: async (_repo, number, title) =>
      calls.push(`title-pr:${number}:${title}`),
  };
  const prompts = {
    ask: async (message) => {
      promptEvents.push(`ask:${message}`);
      return "Prompted commit";
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

function prReviewOptions(overrides = {}) {
  return {
    mode: "pr-review",
    commitMessage: "Quick publish",
    prTitle: "Quick publish",
    prTitleExplicit: false,
    showDiff: false,
    ...overrides,
  };
}

describe("PR-review flow", () => {
  it("commits, pushes, and creates a PR without normal publish prompts", async () => {
    const harness = createPrReviewHarness();
    const result = await runPrReviewFlow({
      ...harness,
      options: prReviewOptions(),
      env: {},
    });
    expect(result.report).toMatchObject({
      prNumber: 18,
      prChangesUrl: "https://example.test/pr/18/files",
      latestCommitChangesUrl: "https://example.test/pr/18/changes/committed-head",
      latestHeadCommit: null,
      nextStep: "pnpm pr:merge 18",
      branch: "feature/quick-pr",
      action: "created",
    });
    expect(harness.output.messages).toContainEqual([
      "INFO",
      "Latest commit changes: https://example.test/pr/18/changes/committed-head",
    ]);
    expect(harness.output.messages).toContainEqual([
      "INFO",
      "Next Step After Review: pnpm pr:merge 18",
    ]);
    expect(harness.output.messages).toContainEqual(["STEP", "PR review report"]);
    expect(harness.calls).toEqual([
      "fetch",
      "add:package.json",
      "commit:Quick publish",
      "push:feature/quick-pr",
      "create-pr:Quick publish",
    ]);
    expect(harness.promptEvents).toEqual([]);
    expect(harness.output.messages).toContainEqual(["STEP", "Preliminary scope summary"]);
    expect(harness.output.messages).toContainEqual(["STEP", "Exact publish scope validation"]);
    expect(harness.output.messages).toContainEqual([
      "SUCCESS",
      "Scope validation passed: exact publish scope matches preliminary summary.",
    ]);
    expect(harness.output.messages).not.toContainEqual(["STEP", "Exact publish scope"]);
    expect(
      harness.output.messages.filter(([, message]) => message === "Changed files: 1"),
    ).toHaveLength(1);
  });

  it("shows the full diff only once when exact scope validation succeeds", async () => {
    const harness = createPrReviewHarness();
    await runPrReviewFlow({
      ...harness,
      options: prReviewOptions({ showDiff: true }),
      env: {},
    });

    expect(
      harness.output.messages.filter(([, message]) => message.startsWith("Full diff:")),
    ).toHaveLength(1);
  });

  it("validates staged deletions and a rename without restaging missing paths", async () => {
    const harness = createPrReviewHarness();
    harness.git.status = async () =>
      [
        "D  .codex/skills/core/code-review/SKILL.md",
        "D  .codex/skills/core/code-review/metadata.yml",
        "R  .codex/scripts/publish-changes/pr-only-flow.mjs -> .codex/scripts/publish-changes/pr-review-flow.mjs",
      ].join("\n");
    harness.git.statusZ = async () =>
      [
        "D  .codex/skills/core/code-review/SKILL.md\0",
        "D  .codex/skills/core/code-review/metadata.yml\0",
        "R  .codex/scripts/publish-changes/pr-review-flow.mjs\0",
        ".codex/scripts/publish-changes/pr-only-flow.mjs\0",
      ].join("");
    harness.git.writeTree = async () => "confirmed-tree";
    harness.git.diff = async (args) => {
      if (args.includes("--binary")) return "rename patch";
      if (args.includes("--name-status")) {
        return [
          "D\t.codex/skills/core/code-review/SKILL.md",
          "D\t.codex/skills/core/code-review/metadata.yml",
          "D\t.codex/scripts/publish-changes/pr-only-flow.mjs",
          "A\t.codex/scripts/publish-changes/pr-review-flow.mjs",
        ].join("\n");
      }
      if (args.includes("--numstat")) {
        return [
          "0\t518\t.codex/skills/core/code-review/SKILL.md",
          "0\t16\t.codex/skills/core/code-review/metadata.yml",
          "0\t163\t.codex/scripts/publish-changes/pr-only-flow.mjs",
          "163\t0\t.codex/scripts/publish-changes/pr-review-flow.mjs",
        ].join("\n");
      }
      return "";
    };

    await expect(
      runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      }),
    ).resolves.toMatchObject({ status: "published" });
    expect(harness.calls.some((call) => call.startsWith("add:"))).toBe(false);
  });

  it("blocks mixed staged and unstaged state before staging", async () => {
    const harness = createPrReviewHarness();
    harness.git.status = async () => "D  obsolete.md\n?? obsolete.md";
    harness.git.statusZ = async () => "D  obsolete.md\0?? obsolete.md\0";
    harness.git.hashFiles = async () => "restored-hash";

    await expect(
      runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      }),
    ).rejects.toMatchObject({
      type: "MIXED_INDEX_WORKTREE_STATE",
      message: expect.stringContaining("obsolete.md"),
    });
    expect(harness.calls).toEqual(["fetch"]);
    expect(harness.calls.some((call) => call.startsWith("add:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("commit:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
  });

  it("reports exact staged line contributions for untracked files before success", async () => {
    const harness = createPrReviewHarness();
    harness.git.status = async () => "?? new.md";
    harness.git.statusZ = async () => "?? new.md\0";
    harness.git.hashFiles = async () => "new-md-hash";
    harness.git.untracked = async () => "new.md";
    harness.git.diff = async (args) => {
      if (args.includes("--binary")) return "";
      if (args.includes("--cached") && args.includes("--name-status")) return "A\tnew.md";
      if (args.includes("--cached") && args.includes("--numstat")) return "4\t0\tnew.md";
      if (args.includes("--cached")) return "staged new.md content";
      return "";
    };

    await runPrReviewFlow({
      ...harness,
      options: prReviewOptions(),
      env: {},
    });

    expect(harness.output.messages).toContainEqual([
      "INFO",
      "Exact scope includes staged untracked file content: +4/-0 from new.md.",
    ]);
    const contributionIndex = harness.output.messages.findIndex(([, message]) =>
      message.includes("staged untracked file content"),
    );
    const successIndex = harness.output.messages.findIndex(([, message]) =>
      message.includes("Scope validation passed"),
    );
    expect(contributionIndex).toBeGreaterThanOrEqual(0);
    expect(contributionIndex).toBeLessThan(successIndex);
  });

  it("prompts only for a missing commit message when uncommitted work exists", async () => {
    const harness = createPrReviewHarness();
    await runPrReviewFlow({
      ...harness,
      options: prReviewOptions({ commitMessage: "", prTitle: "" }),
      env: {},
    });
    expect(harness.promptEvents).toEqual(["ask:Enter commit message: "]);
    expect(harness.calls).toContain("commit:Prompted commit");
  });

  it("reuses an open PR, preserves its title, and never creates a duplicate", async () => {
    const harness = createPrReviewHarness({ existingPr: {} });
    const result = await runPrReviewFlow({
      ...harness,
      options: prReviewOptions(),
      env: {},
    });
    expect(result.report.action).toBe("updated");
    expect(result.report.latestCommitChangesUrl).toBe(
      "https://example.test/pr/17/changes/committed-head",
    );
    expect(harness.calls).toContain("comment-pr:17");
    expect(harness.calls.some((call) => call.startsWith("create-pr:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("title-pr:"))).toBe(false);
  });

  it("falls back to the pushed head SHA when current PR metadata does not match", async () => {
    const harness = createPrReviewHarness({
      existingPr: { headRefOid: "stale-remote-head" },
    });
    const result = await runPrReviewFlow({
      ...harness,
      options: prReviewOptions(),
      env: {},
    });
    expect(result.report).toMatchObject({
      latestCommitChangesUrl: null,
      latestHeadCommit: "committed-head",
      nextStep: "pnpm pr:merge 17",
    });
    expect(harness.output.messages).toContainEqual([
      "INFO",
      "Latest head commit changes: https://example.test/pr/17/files/committed-head",
    ]);
  });

  it("updates an existing title only when the second argument was explicit", async () => {
    const harness = createPrReviewHarness({ existingPr: {} });
    await runPrReviewFlow({
      ...harness,
      options: prReviewOptions({
        prTitle: "Reviewed title",
        prTitleExplicit: true,
      }),
      env: {},
    });
    expect(harness.calls).toContain("title-pr:17:Reviewed title");
  });

  it("reports an unchanged existing PR without adding a comment", async () => {
    const harness = createPrReviewHarness({
      hasUncommitted: false,
      hasUnpushed: false,
      existingPr: {},
    });
    const result = await runPrReviewFlow({
      ...harness,
      options: prReviewOptions({ commitMessage: "", prTitle: "" }),
      env: {},
    });
    expect(result.report.action).toBe("unchanged");
    expect(harness.calls).toEqual(["fetch", "push:feature/quick-pr"]);
  });

  it("blocks the default branch without creating a feature branch", async () => {
    const harness = createPrReviewHarness({ branch: "main" });
    await expect(
      runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      }),
    ).rejects.toThrow("Create or switch to a feature branch first");
    expect(harness.calls).toEqual(["fetch"]);
    expect(harness.promptEvents).toEqual([]);
  });

  it("blocks unauthenticated publishing before staging or push", async () => {
    const harness = createPrReviewHarness();
    harness.gh.authReady = async () => false;
    await expect(
      runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      }),
    ).rejects.toThrow("authentication is required");
    expect(harness.calls).toEqual(["fetch"]);
  });

  it("blocks confirmed secret-looking content before commit, push, or PR creation", async () => {
    const harness = createPrReviewHarness();
    const sensitiveValue = generatedToken("xoxb-", 24);
    harness.git.status = async () => " M config.js";
    harness.git.statusZ = async () => " M config.js\0";
    harness.git.diff = async (args) => {
      if (args.includes("--binary")) return "binary patch";
      if (args.includes("--numstat")) return "1\t0\tconfig.js";
      if (args.includes("--name-status")) return "M\tconfig.js";
      if (args.includes("--cached")) {
        return [
          "diff --git a/config.js b/config.js",
          "--- a/config.js",
          "+++ b/config.js",
          "@@ -0,0 +1 @@",
          `+const value = "${sensitiveValue}";`,
        ].join("\n");
      }
      return "";
    };

    await expect(
      runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      }),
    ).rejects.toThrow("Publish blocked");

    expect(harness.calls).toEqual(["fetch", "add:config.js"]);
    expect(harness.calls.some((call) => call.startsWith("commit:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("create-pr:"))).toBe(false);
    expect(harness.output.messages.some(([, message]) => message.includes(sensitiveValue))).toBe(
      false,
    );
  });

  it("blocks exact scope mismatch with a concise difference summary before publication", async () => {
    const harness = createPrReviewHarness();
    const diff = harness.git.diff;
    harness.git.diff = async (args) => {
      if (args.includes("--cached") && args.includes("--name-status")) {
        return "A\tpackage.json\nA\tkit/scripts/new-helper.mjs";
      }
      if (args.includes("--cached") && args.includes("--numstat")) {
        return "4\t1\tpackage.json\n2\t0\tkit/scripts/new-helper.mjs";
      }
      return diff(args);
    };

    let failure;
    try {
      await runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({
      type: "SCOPE_DRIFT",
      message: expect.stringContaining("Difference summary:"),
    });
    expect(failure.message).toContain("File set differs:");
    expect(failure.message).toContain("Status differs:");
    expect(failure.message).toContain("Line summary differs:");
    expect(failure.message).toContain("High-risk hints differ:");
    expect(failure.message).toContain("No files were committed, pushed, or published");
    expect(harness.calls).toEqual(["fetch", "add:package.json"]);
    expect(harness.calls.some((call) => call.startsWith("commit:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("create-pr:"))).toBe(false);
    expect(harness.output.messages).toContainEqual(["STEP", "Exact publish scope validation"]);
  });

  it("blocks worktree drift before staging or push", async () => {
    const harness = createPrReviewHarness();
    let snapshots = 0;
    harness.git.statusZ = async () => {
      snapshots += 1;
      return snapshots === 1 ? " M package.json\0" : " M package.json\0?? drift.txt\0";
    };
    harness.git.hashFiles = async () => "drift-hash";
    await expect(
      runPrReviewFlow({
        ...harness,
        options: prReviewOptions(),
        env: {},
      }),
    ).rejects.toThrow("Worktree changed after scope collection");
    expect(harness.calls).toEqual(["fetch"]);
  });
});

function createMergeHarness({
  yes = false,
  autoMerge = false,
  canFastForward = true,
  checks = [],
  checksSequence = null,
  mergeAfterView = 4,
  mergeError = null,
} = {}) {
  const calls = [];
  const promptEvents = [];
  let viewCount = 0;
  let branch = "feature/reviewed";
  const openPr = {
    number: 23,
    title: "Reviewed change",
    url: "https://example.test/pr/23",
    state: "OPEN",
    baseRefName: "main",
    headRefName: "feature/reviewed",
    headRefOid: "reviewed-head",
    isDraft: false,
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    mergedAt: null,
  };
  const mergedPr = {
    ...openPr,
    state: "MERGED",
    mergedAt: "2026-06-15T12:00:00Z",
  };
  const git = {
    repoRoot: async () => "/repo",
    origin: async () => "git@example.test:owner/repo.git",
    status: async () => "",
    fetchDefault: async () => calls.push("fetch"),
    switchBranch: async (next) => {
      calls.push(`switch:${next}`);
      branch = next;
    },
    canFastForwardTo: async () => canFastForward,
    pullFastForward: async (next) => calls.push(`pull:${next}`),
    createBackup: async () => calls.push("backup"),
    resetHard: async () => calls.push("reset"),
    branch: async () => branch,
  };
  const gh = {
    authReady: async () => true,
    repoName: async () => "owner/repo",
    viewPullRequest: async () => {
      viewCount += 1;
      return viewCount >= mergeAfterView ? mergedPr : openPr;
    },
    requiredChecks: vi.fn(async () => checksSequence?.shift() ?? checks),
    merge: async (_repo, number, options) => {
      if (mergeError) throw mergeError;
      calls.push(`merge:${number}:${options.headSha}:${options.auto}`);
    },
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
    options: { mode: "pr-merge", prNumber: 23, yes, autoMerge },
  };
}

describe("PR-merge flow", () => {
  it("shows metadata, verifies the merge without prompting, and refreshes main", async () => {
    const harness = createMergeHarness();
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.promptEvents).toEqual([]);
    expect(harness.gh.requiredChecks).toHaveBeenCalledTimes(2);
    expect(harness.calls).toEqual([
      "merge:23:reviewed-head:false",
      "fetch",
      "switch:main",
      "pull:main",
    ]);
    expect(result.report).toMatchObject({
      prNumber: 23,
      mergeStatus: "verified merged",
      autoMergeStatus: "not enabled",
      refreshStatus: "refreshed with fast-forward only",
      currentBranch: "main",
    });
    expect(harness.output.messages).toContainEqual(["STEP", "PR merge report"]);
    expect(harness.output.messages.flat().join("\n")).toContain("Head SHA/OID: reviewed-head");
  });

  it("keeps --yes compatible with the non-interactive immediate merge path", async () => {
    const harness = createMergeHarness({ yes: true });
    await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.promptEvents).toEqual([]);
    expect(harness.gh.requiredChecks).toHaveBeenCalledTimes(2);
    expect(harness.calls).toContain("merge:23:reviewed-head:false");
  });

  it("treats no required checks as a passing empty requirement set", async () => {
    const harness = createMergeHarness({ yes: true, checks: [] });
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).resolves.toMatchObject({ status: "merged-and-refreshed" });
    expect(harness.calls).toContain("merge:23:reviewed-head:false");
  });

  it("blocks a dirty worktree before reading or merging a PR", async () => {
    const harness = createMergeHarness({ yes: true });
    harness.git.status = async () => " M package.json";
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).rejects.toThrow("Worktree must be clean");
    expect(harness.calls).toEqual([]);
  });

  it("blocks pending required checks with guidance before merge", async () => {
    const harness = createMergeHarness({ checks: [{ bucket: "pending", state: "PENDING" }] });
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).rejects.toThrow("wait and rerun pnpm pr:merge, or use pnpm pr:auto-merge");
    expect(harness.calls.some((call) => call.startsWith("merge:"))).toBe(false);
  });

  it("enables auto-merge for pending checks without polling or refreshing locally", async () => {
    const harness = createMergeHarness({
      autoMerge: true,
      checks: [{ bucket: "pending", state: "PENDING" }],
      mergeAfterView: Number.POSITIVE_INFINITY,
    });
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.promptEvents).toEqual([
      "confirm:Complete PR #23 with squash merge now if ready, or enable auto-merge if required checks are pending?",
    ]);
    expect(harness.calls).toEqual(["merge:23:reviewed-head:true"]);
    expect(result).toMatchObject({
      status: "auto-merge-enabled",
      report: {
        prNumber: 23,
        autoMergeStatus: "enabled; GitHub will merge after requirements pass",
        refreshStatus: "not attempted; PR remains open and local branch is unchanged",
        currentBranch: "feature/reviewed",
      },
    });
  });

  it("uses the immediate merge path when checks pass with --auto-merge", async () => {
    const harness = createMergeHarness({ yes: true, autoMerge: true });
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.calls).toEqual([
      "merge:23:reviewed-head:false",
      "fetch",
      "switch:main",
      "pull:main",
    ]);
    expect(result.report.autoMergeStatus).toBe("not enabled");
  });

  it("revalidates pending checks and merges immediately if they pass before execution", async () => {
    const harness = createMergeHarness({
      yes: true,
      autoMerge: true,
      checksSequence: [[{ bucket: "pending", state: "PENDING" }], []],
    });
    await runMergePrFlow({ ...harness, env: {}, sleep: async () => {} });
    expect(harness.calls).toContain("merge:23:reviewed-head:false");
  });

  it("refreshes main when GitHub reports a verified merge after the auto-merge request", async () => {
    const harness = createMergeHarness({
      yes: true,
      autoMerge: true,
      checks: [{ bucket: "pending", state: "PENDING" }],
    });
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(harness.calls).toEqual([
      "merge:23:reviewed-head:true",
      "fetch",
      "switch:main",
      "pull:main",
    ]);
    expect(result.report.autoMergeStatus).toContain("already merged");
  });

  it("reports AUTO_MERGE_FAILED and leaves local state unchanged when GitHub rejects it", async () => {
    const harness = createMergeHarness({
      yes: true,
      autoMerge: true,
      checks: [{ bucket: "pending", state: "PENDING" }],
      mergeError: new PublishError("COMMAND_FAILED", "auto-merge is disabled", {
        result: { stderr: "repository does not allow auto-merge" },
      }),
    });
    await expect(
      runMergePrFlow({ ...harness, env: {}, sleep: async () => {} }),
    ).rejects.toMatchObject({
      type: "AUTO_MERGE_FAILED",
      message: expect.stringMatching(/remains open.*settings.*permissions.*eligibility.*disabled/i),
      details: {
        causeType: "COMMAND_FAILED",
        causeDetails: { result: { stderr: "repository does not allow auto-merge" } },
      },
    });
    expect(harness.calls).toEqual([]);
  });

  it("blocks a closed, unmerged PR after an auto-merge request", async () => {
    const harness = createMergeHarness({
      yes: true,
      autoMerge: true,
      checks: [{ bucket: "pending", state: "PENDING" }],
      mergeAfterView: Number.POSITIVE_INFINITY,
    });
    let views = 0;
    const originalView = harness.gh.viewPullRequest;
    harness.gh.viewPullRequest = async (...args) => {
      views += 1;
      const pr = await originalView(...args);
      return views === 4 ? { ...pr, state: "CLOSED" } : pr;
    };
    await expect(runMergePrFlow({ ...harness, env: {}, sleep: async () => {} })).rejects.toThrow(
      "CLOSED without verified merge",
    );
    expect(harness.calls).toEqual(["merge:23:reviewed-head:true"]);
  });

  it("blocks a changed remote head after metadata display", async () => {
    const harness = createMergeHarness();
    let views = 0;
    const originalView = harness.gh.viewPullRequest;
    harness.gh.viewPullRequest = async () => {
      views += 1;
      const pr = await originalView();
      return views === 2 ? { ...pr, headRefOid: "changed-head" } : pr;
    };
    await expect(
      runMergePrFlow({
        ...harness,
        env: {},
        sleep: async () => {},
      }),
    ).rejects.toThrow("does not match the expected head");
    expect(harness.calls.some((call) => call.startsWith("merge:"))).toBe(false);
  });

  it("reports partial success without reset when main cannot fast-forward", async () => {
    const harness = createMergeHarness({ yes: true, canFastForward: false });
    const result = await runMergePrFlow({
      ...harness,
      env: {},
      sleep: async () => {},
    });
    expect(result.status).toBe("merged-refresh-blocked");
    expect(result.report.refreshStatus).toContain("merge succeeded");
    expect(harness.calls).toEqual(["merge:23:reviewed-head:false", "fetch", "switch:main"]);
    expect(harness.calls).not.toContain("backup");
    expect(harness.calls).not.toContain("reset");
  });
});
