import { describe, expect, it } from "vitest";
import { runPublishFlow } from "../../kit/scripts/publish-changes/flow.mjs";
import { DEFAULT_POLICY } from "../../kit/scripts/publish-changes/policy.mjs";

function createOutput() {
  const messages = [];
  return {
    messages,
    step: (message) => messages.push(["STEP", message]),
    info: (message) => messages.push(["INFO", message]),
    warning: (message) => messages.push(["WARNING", message]),
    danger: (message) => messages.push(["DANGER", message]),
    success: (message) => messages.push(["SUCCESS", message]),
    skipped: (message) => messages.push(["SKIPPED", message]),
  };
}

function generatedToken(prefix, length = 24) {
  return `${prefix}${"A".repeat(length)}`;
}

function createHarness({
  classification,
  validation = "CHECK_PASSED",
  completion = "1",
  branch = "feature/publish",
  defaultFresh = true,
  hasUncommitted = true,
  hasUnpushed = false,
} = {}) {
  const calls = [];
  const promptEvents = [];
  let clean = !hasUncommitted;
  let staged = false;
  let merged = false;
  let prCreated = false;
  let currentBranch = branch;
  let currentHead = "head-sha";
  let currentTree = hasUncommitted ? "base-tree" : "confirmed-tree";
  let currentParent = "base-parent";
  const answers =
    classification === "small_safe"
      ? ["1"]
      : classification === "normal"
        ? ["2", validation, completion]
        : ["3", validation, completion];

  const git = {
    repoRoot: async () => "/repo",
    branch: async () => currentBranch,
    origin: async () => "git@example.test:owner/repo.git",
    fetchDefault: async () => calls.push("fetch"),
    includesDefault: async () => defaultFresh,
    status: async () => (clean ? "" : " M package.json"),
    statusZ: async () => (clean ? "" : " M package.json\0"),
    hashFiles: async () => "",
    upstream: async () => "origin/feature/publish",
    verifyRef: async () => true,
    logRange: async () => (hasUnpushed ? "abc Existing local commit" : ""),
    latestSubject: async () => "Existing local commit",
    diff: async (args) => {
      if (args.includes("--binary")) return "binary patch";
      if (args.includes("--numstat")) return "2\t0\tpackage.json";
      if (args.includes("--name-status")) return "M\tpackage.json";
      if (args.includes("--cached")) return "staged patch";
      return "M\tpackage.json";
    },
    untracked: async () => "",
    addPaths: async (paths) => {
      calls.push(`add:${paths.join(",")}`);
      staged = true;
    },
    writeTree: async () => (staged ? "confirmed-tree" : "unstaged-tree"),
    commit: async () => {
      calls.push("commit");
      clean = true;
      staged = false;
      currentParent = currentHead;
      currentHead = "committed-head-sha";
      currentTree = "confirmed-tree";
    },
    switchCreate: async (newBranch) => {
      calls.push(`switch-create:${newBranch}`);
      currentBranch = newBranch;
    },
    push: async (pushedBranch) => calls.push(`push:${pushedBranch}`),
    head: async () => currentHead,
    tree: async () => currentTree,
    parent: async () => currentParent,
    switchBranch: async () => calls.push("switch-main"),
    canFastForwardTo: async () => true,
    pullFastForward: async () => calls.push("pull-main"),
  };

  const gh = {
    authReady: async () => true,
    repoName: async () => "owner/repo",
    listPullRequests: async (_repo, args) => {
      if (
        args.includes("--head") &&
        args.includes("--state") &&
        args.includes("open") &&
        prCreated
      ) {
        return [{ number: 12 }];
      }
      return [];
    },
    createPullRequest: async () => {
      calls.push("create-pr");
      prCreated = true;
      return "https://example.test/pr/12";
    },
    commentPullRequest: async (_repo, number) => calls.push(`comment-pr:${number}`),
    viewPullRequest: async () => ({
      number: 12,
      url: "https://example.test/pr/12",
      state: merged ? "MERGED" : "OPEN",
      baseRefName: "main",
      headRefName: currentBranch,
      headRefOid: currentHead,
      isDraft: false,
      mergeable: "MERGEABLE",
      mergeStateStatus: "CLEAN",
      mergedAt: merged ? "2026-06-13T12:00:00Z" : null,
    }),
    requiredChecks: async () => [],
    merge: async () => {
      calls.push("merge");
      merged = true;
    },
  };

  const prompts = {
    ask: async (message) => {
      promptEvents.push(`ask:${message}`);
      return answers.shift() ?? "";
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

describe("publish flow classification gates", () => {
  it("auto-merges small safe changes and refreshes only after verified merge", async () => {
    const harness = createHarness({ classification: "small_safe" });
    const result = await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Small update",
        prTitle: "Small update",
        showDiff: false,
      },
      env: {},
      sleep: async () => {},
    });
    expect(result.report.mode).toBe("auto");
    expect(harness.calls).toEqual([
      "fetch",
      "add:package.json",
      "commit",
      "push:feature/publish",
      "create-pr",
      "merge",
      "fetch",
      "switch-main",
      "pull-main",
    ]);
  });

  it.each([
    "normal",
    "significant",
  ])("keeps %s updates at PR review by default", async (classification) => {
    const harness = createHarness({ classification });
    const result = await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Publish migration",
        prTitle: "Publish migration",
        showDiff: false,
      },
      env: {},
    });
    expect(result.report.mode).toBe("pr_review");
    expect(harness.calls).toContain("create-pr");
    expect(harness.calls).not.toContain("merge");
    expect(harness.calls).not.toContain("switch-main");
  });

  it("blocks unauthenticated GitHub state before staging or commit", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.gh.authReady = async () => false;
    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Publish migration",
          prTitle: "Publish migration",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("before commit, push, or pull request actions");
    expect(harness.calls).toEqual(["fetch"]);
  });

  it("blocks confirmed secret-looking content before commit, push, or PR creation", async () => {
    const harness = createHarness({ classification: "normal" });
    const sensitiveValue = generatedToken("ghp_", 24);
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
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Publish guarded change",
          prTitle: "Publish guarded change",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Publish blocked");

    expect(harness.calls).toEqual(["fetch", "add:config.js"]);
    expect(harness.calls).not.toContain("commit");
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
    expect(harness.calls).not.toContain("create-pr");
    expect(harness.output.messages.some(([, message]) => message.includes(sensitiveValue))).toBe(
      false,
    );
  });

  it("asks for update type before final scope confirmation", async () => {
    const harness = createHarness({ classification: "normal" });
    await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Ordered prompts",
        prTitle: "Ordered prompts",
        showDiff: false,
      },
      env: {},
    });
    const classificationIndex = harness.promptEvents.findIndex((event) =>
      event.includes("Choose update type"),
    );
    const scopeIndex = harness.promptEvents.findIndex((event) =>
      event.includes("Does this scope match"),
    );
    expect(classificationIndex).toBeGreaterThanOrEqual(0);
    expect(classificationIndex).toBeLessThan(scopeIndex);
  });

  it("shows prior unpushed commits and newly staged work in the exact confirmed scope", async () => {
    const harness = createHarness({ classification: "normal", hasUnpushed: true });
    const diffCalls = [];
    harness.git.diff = async (args) => {
      diffCalls.push(args);
      if (args.includes("--binary")) return "worktree patch";
      if (args.includes("--cached") && args.includes("--name-status")) {
        return "A\tcommitted.txt\nM\tpackage.json";
      }
      if (args.includes("--cached") && args.includes("--numstat")) {
        return "1\t0\tcommitted.txt\n2\t0\tpackage.json";
      }
      if (args.includes("--name-status")) return "A\tcommitted.txt\nM\tpackage.json";
      if (args.includes("--numstat")) return "1\t0\tcommitted.txt\n2\t0\tpackage.json";
      return "";
    };

    const result = await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Combined scope",
        prTitle: "Combined scope",
        showDiff: false,
      },
      env: {},
    });

    expect(diffCalls).toContainEqual([
      "--cached",
      "--name-status",
      "--no-renames",
      "origin/feature/publish",
    ]);
    expect(
      diffCalls
        .filter((args) => args.includes("--name-status") || args.includes("--numstat"))
        .every((args) => args.includes("--no-renames")),
    ).toBe(true);
    expect(harness.output.messages).toContainEqual(["STEP", "Exact publish scope"]);
    expect(harness.output.messages.some(([, message]) => message.includes("A committed.txt"))).toBe(
      true,
    );
    expect(result.report.filesChanged).toEqual(["committed.txt", "package.json"]);
  });

  it("stages and displays an observed untracked file before confirmation", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.git.status = async () => (harness.calls.includes("commit") ? "" : "?? new file.txt");
    harness.git.statusZ = async () => "?? new file.txt\0";
    harness.git.hashFiles = async () => "new-file-hash";
    harness.git.untracked = async () => "new file.txt";
    harness.git.diff = async (args) => {
      if (args.includes("--binary")) return "";
      if (args.includes("--cached") && args.includes("--name-status")) return "A\tnew file.txt";
      if (args.includes("--cached") && args.includes("--numstat")) return "1\t0\tnew file.txt";
      return "";
    };

    await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Add untracked file",
        prTitle: "Add untracked file",
        showDiff: false,
      },
      env: {},
    });

    expect(harness.calls).toContain("add:new file.txt");
    expect(harness.output.messages.some(([, message]) => message.includes("A new file.txt"))).toBe(
      true,
    );
  });

  it("aborts when the worktree drifts after collection and before staging", async () => {
    const harness = createHarness({ classification: "normal" });
    let snapshotRead = 0;
    harness.git.statusZ = async () => {
      snapshotRead += 1;
      return snapshotRead === 1 ? " M package.json\0" : " M package.json\0?? surprise.txt\0";
    };
    harness.git.hashFiles = async () => "surprise-hash";
    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Drift test",
          prTitle: "Drift test",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Worktree changed after scope collection");
    expect(harness.calls.some((call) => call.startsWith("add:"))).toBe(false);
    expect(harness.calls).not.toContain("commit");
  });

  it("aborts when tracked content changes without changing porcelain status", async () => {
    const harness = createHarness({ classification: "normal" });
    let binaryDiffRead = 0;
    const baseDiff = harness.git.diff;
    harness.git.diff = async (args) => {
      if (args.includes("--binary")) {
        binaryDiffRead += 1;
        return binaryDiffRead === 1 ? "first patch" : "changed patch";
      }
      return baseDiff(args);
    };

    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Tracked drift test",
          prTitle: "Tracked drift test",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Worktree changed after scope collection");
    expect(harness.calls.some((call) => call.startsWith("add:"))).toBe(false);
  });

  it("aborts when untracked content changes without changing its path", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.git.statusZ = async () => "?? new file.txt\0";
    let hashRead = 0;
    harness.git.hashFiles = async () => {
      hashRead += 1;
      return hashRead === 1 ? "first-hash" : "changed-hash";
    };

    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Untracked content drift",
          prTitle: "Untracked content drift",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Worktree changed after scope collection");
    expect(harness.calls.some((call) => call.startsWith("add:"))).toBe(false);
  });

  it("aborts when the staged tree changes after scope confirmation", async () => {
    const harness = createHarness({ classification: "normal" });
    let treeRead = 0;
    harness.git.writeTree = async () => {
      treeRead += 1;
      return treeRead === 1 ? "confirmed-tree" : "changed-tree";
    };
    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Index drift test",
          prTitle: "Index drift test",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Staged scope changed after confirmation");
    expect(harness.calls).not.toContain("commit");
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
  });

  it("aborts when existing unpushed history changes after confirmation", async () => {
    const harness = createHarness({
      classification: "normal",
      hasUncommitted: false,
      hasUnpushed: true,
    });
    let head = "confirmed-head";
    harness.git.head = async () => head;
    harness.git.tree = async () => `${head}-tree`;
    const ask = harness.prompts.ask;
    harness.prompts.ask = async (message) => {
      const answer = await ask(message);
      if (message.includes("validation code")) head = "changed-head";
      return answer;
    };

    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "",
          prTitle: "Existing history drift",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Branch history changed after scope confirmation");
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
  });

  it("aborts when the newly created commit tree differs from the confirmed staged tree", async () => {
    const harness = createHarness({ classification: "normal" });
    const commit = harness.git.commit;
    harness.git.commit = async (...args) => {
      await commit(...args);
      harness.git.tree = async () => "changed-commit-tree";
    };

    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Commit tree drift",
          prTitle: "Commit tree drift",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Created commit does not match the confirmed scope");
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
  });

  it("aborts when HEAD changes during validation before push", async () => {
    const harness = createHarness({ classification: "normal" });
    const head = harness.git.head;
    let changed = false;
    harness.git.head = async () => (changed ? "changed-after-validation" : head());
    const ask = harness.prompts.ask;
    harness.prompts.ask = async (message) => {
      const answer = await ask(message);
      if (message.includes("validation code")) changed = true;
      return answer;
    };

    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Validation head drift",
          prTitle: "Validation head drift",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Branch history changed after scope confirmation");
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
  });

  it("warns and requires confirmation when the branch is behind the default branch", async () => {
    const harness = createHarness({ classification: "normal", defaultFresh: false });
    await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Stale branch",
        prTitle: "Stale branch",
        showDiff: false,
      },
      env: {},
    });
    expect(harness.promptEvents[0]).toContain("Continue publishing from the current branch state");
    expect(harness.output.messages).toContainEqual([
      "WARNING",
      "Current HEAD does not include the latest origin/main.",
    ]);
  });

  it("continues after the user reviews an unrelated open pull request", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.gh.listPullRequests = async (_repo, args) => {
      if (!args.includes("--head")) {
        return [
          {
            number: 3,
            title: "Other work",
            url: "https://example.test/pr/3",
            headRefName: "feature/other",
          },
        ];
      }
      return [];
    };

    await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Reuse PR",
        prTitle: "Reuse PR",
        showDiff: false,
      },
      env: {},
    });

    expect(harness.promptEvents).toContain(
      "confirm:Continue after reviewing repository open pull requests?",
    );
    expect(harness.output.messages).toContainEqual([
      "WARNING",
      "Repository open PRs: #3 Other work https://example.test/pr/3",
    ]);
    expect(harness.calls).toContain("create-pr");
  });

  it("cancels safely when the user declines an unrelated open pull request warning", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.gh.listPullRequests = async (_repo, args) =>
      args.includes("--head")
        ? []
        : [
            {
              number: 3,
              title: "Other work",
              url: "https://example.test/pr/3",
              headRefName: "feature/other",
            },
          ];
    harness.prompts.confirm = async (message) => {
      harness.promptEvents.push(`confirm:${message}`);
      return !message.includes("Continue after reviewing repository open pull requests");
    };

    await expect(
      runPublishFlow({
        ...harness,
        policy: structuredClone(DEFAULT_POLICY),
        options: {
          commitMessage: "Decline unrelated PR",
          prTitle: "Decline unrelated PR",
          showDiff: false,
        },
        env: {},
      }),
    ).rejects.toThrow("Stopped after repository pull request review");
    expect(harness.calls.some((call) => call.startsWith("add:"))).toBe(false);
    expect(harness.calls.some((call) => call.startsWith("push:"))).toBe(false);
  });

  it("routes a clean current-branch open PR to recovery without unrelated PR warning", async () => {
    const harness = createHarness({
      classification: "normal",
      hasUncommitted: false,
      hasUnpushed: false,
    });
    harness.gh.listPullRequests = async (_repo, args) =>
      args.includes("--head")
        ? []
        : [
            {
              number: 12,
              title: "Current work",
              url: "https://example.test/pr/12",
              headRefName: "feature/publish",
            },
          ];

    const result = await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: { commitMessage: "", prTitle: "", showDiff: false },
      env: {},
    });

    expect(result.status).toBe("open-pr");
    expect(harness.output.messages).toContainEqual([
      "INFO",
      "PR #12 remains open: https://example.test/pr/12",
    ]);
    expect(harness.promptEvents).not.toContain(
      "confirm:Continue after reviewing repository open pull requests?",
    );
    expect(harness.calls).not.toContain("create-pr");
  });

  it("continues an existing current-branch PR without creating a duplicate", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.gh.listPullRequests = async (_repo, args) =>
      args.includes("--head")
        ? [{ number: 12 }]
        : [
            {
              number: 12,
              title: "Current work",
              url: "https://example.test/pr/12",
              headRefName: "feature/publish",
            },
          ];

    await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Continue current PR",
        prTitle: "Continue current PR",
        showDiff: false,
      },
      env: {},
    });

    expect(harness.promptEvents).not.toContain(
      "confirm:Continue after reviewing repository open pull requests?",
    );
    expect(harness.calls).toContain("comment-pr:12");
    expect(harness.calls).not.toContain("create-pr");
  });

  it("recovers a clean branch only after its PR is verified merged into the default branch", async () => {
    const harness = createHarness({
      classification: "normal",
      hasUncommitted: false,
      hasUnpushed: false,
    });
    harness.gh.listPullRequests = async (_repo, args) =>
      args.includes("--head")
        ? [{ number: 12 }]
        : [
            {
              number: 12,
              title: "Merged work",
              url: "https://example.test/pr/12",
              headRefName: "feature/publish",
            },
          ];
    harness.gh.viewPullRequest = async () => ({
      number: 12,
      url: "https://example.test/pr/12",
      state: "MERGED",
      baseRefName: "main",
      headRefName: "feature/publish",
      headRefOid: "head-sha",
      mergedAt: "2026-06-13T12:00:00Z",
    });

    const result = await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: { commitMessage: "", prTitle: "", showDiff: false },
      env: {},
    });

    expect(result.status).toBe("recovered");
    expect(harness.calls).toEqual(["fetch", "fetch", "switch-main", "pull-main"]);
    expect(harness.promptEvents).not.toContain(
      "confirm:Continue after reviewing repository open pull requests?",
    );
    expect(harness.calls).not.toContain("create-pr");
  });

  it("never pushes the default branch directly", async () => {
    const harness = createHarness({ classification: "small_safe", branch: "main" });
    await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Main branch change",
        prTitle: "Main branch change",
        showDiff: false,
      },
      env: {},
      sleep: async () => {},
    });
    const pushCall = harness.calls.find((call) => call.startsWith("push:"));
    const switchCall = harness.calls.find((call) => call.startsWith("switch-create:"));
    expect(switchCall).toBeTruthy();
    expect(pushCall).not.toBe("push:main");
    expect(harness.calls.indexOf(switchCall)).toBeLessThan(harness.calls.indexOf(pushCall));
  });

  it("verifies an immediate merge before refreshing the default branch", async () => {
    const harness = createHarness({ classification: "normal", completion: "3" });
    const policy = structuredClone(DEFAULT_POLICY);
    policy.classifications.normal.allow_immediate_merge = true;
    const result = await runPublishFlow({
      ...harness,
      policy,
      options: {
        commitMessage: "Reviewed update",
        prTitle: "Reviewed update",
        showDiff: false,
      },
      env: {},
      sleep: async () => {},
    });
    expect(result.report.mode).toBe("immediate");
    expect(harness.calls.indexOf("merge")).toBeLessThan(harness.calls.indexOf("switch-main"));
    expect(harness.calls).toContain("pull-main");
  });

  it.each([
    "normal",
    "significant",
  ])("verifies %s auto-merge before refreshing when policy explicitly allows it", async (classification) => {
    const harness = createHarness({ classification, completion: "2" });
    const policy = structuredClone(DEFAULT_POLICY);
    policy.classifications[classification].allow_auto_merge = true;
    const result = await runPublishFlow({
      ...harness,
      policy,
      options: {
        commitMessage: "Reviewed auto merge",
        prTitle: "Reviewed auto merge",
        showDiff: false,
      },
      env: {},
      sleep: async () => {},
    });
    expect(result.report.mode).toBe("auto");
    expect(harness.calls.indexOf("merge")).toBeLessThan(harness.calls.indexOf("switch-main"));
    expect(harness.calls).toContain("pull-main");
  });

  it("reports confirmed files, documentation, memory, validation, and external actions", async () => {
    const harness = createHarness({ classification: "normal" });
    harness.git.status = async () => (harness.calls.includes("commit") ? "" : " M README.md");
    harness.git.statusZ = async () => " M README.md\0 M .codex/project/project-guideline.md\0";
    harness.git.diff = async (args) => {
      if (args.includes("--binary")) return "documentation patch";
      if (args.includes("--name-status")) {
        return "M\tREADME.md\nM\t.codex/project/project-guideline.md";
      }
      if (args.includes("--numstat")) {
        return "2\t0\tREADME.md\n1\t0\t.codex/project/project-guideline.md";
      }
      return "";
    };

    const result = await runPublishFlow({
      ...harness,
      policy: structuredClone(DEFAULT_POLICY),
      options: {
        commitMessage: "Update docs",
        prTitle: "Update docs",
        showDiff: false,
      },
      env: {},
    });

    expect(result.report.filesChanged).toEqual([
      "README.md",
      ".codex/project/project-guideline.md",
    ]);
    expect(result.report.docsUpdated).toBe(true);
    expect(result.report.projectMemoryUpdated).toBe(true);
    expect(result.report.validation).toBe("CHECK_PASSED");
    expect(result.report.actions).toEqual(["commit", "push", "pull request create/update"]);
    expect(harness.output.messages).toContainEqual(["INFO", "Documentation updated: yes"]);
    expect(harness.output.messages).toContainEqual(["INFO", "Project memory updated: yes"]);
  });
});
