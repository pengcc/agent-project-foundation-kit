import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectReadOnlySafetyScope,
  runSafetyGuardFlow,
} from "../../kit/repo-tools/scripts/publish-changes/safety-guard-flow.mjs";
import { createCommandRunner } from "../../kit/repo-tools/scripts/shared/command-runner.mjs";
import { createGitClient } from "../../kit/repo-tools/scripts/shared/git-client.mjs";

const execFileAsync = promisify(execFile);
const testRoot = resolve(import.meta.dirname, "../../dev_locals/test-runs/publish-safety-guard");
const cleanups = [];

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function git(root, ...args) {
  return execFileAsync("git", args, { cwd: root });
}

async function layeredRepository() {
  await mkdir(testRoot, { recursive: true });
  const root = await mkdtemp(resolve(testRoot, "repo-"));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  await git(root, "init", "-b", "main");
  await git(root, "config", "user.name", "Safety Guard Test");
  await git(root, "config", "user.email", "safety-guard@example.test");
  await writeFile(resolve(root, "staged.ts"), "export const staged = 'baseline';\n");
  await writeFile(resolve(root, "unstaged.ts"), "export const unstaged = 'baseline';\n");
  await git(root, "add", "staged.ts", "unstaged.ts");
  await git(root, "commit", "-m", "baseline");
  await git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
  await git(root, "switch", "-c", "codex/safety-test");
  await writeFile(resolve(root, "committed.ts"), "export const committed = true;\n");
  await git(root, "add", "committed.ts");
  await git(root, "commit", "-m", "committed change");
  await writeFile(resolve(root, "staged.ts"), "export const staged = 'changed';\n");
  await git(root, "add", "staged.ts");
  await writeFile(resolve(root, "unstaged.ts"), "export const unstaged = 'changed';\n");
  await writeFile(resolve(root, "untracked.ts"), "export const untracked = true;\n");
  return root;
}

describe("standalone read-only safety guard", () => {
  it("collects committed, staged, unstaged, and untracked scope without changing Git state", async () => {
    const root = await layeredRepository();
    const client = createGitClient(createCommandRunner(), root);
    const statusBefore = await client.statusZ();
    const indexBefore = await client.required(["ls-files", "--stage"], "inspect index");

    const scope = await collectReadOnlySafetyScope({
      git: client,
      root,
      compareRef: "origin/main",
    });

    expect(scope.files.map(({ path }) => path)).toEqual([
      "committed.ts",
      "staged.ts",
      "unstaged.ts",
      "untracked.ts",
    ]);
    expect(scope.diff).toContain("committed = true");
    expect(scope.diff).toContain("staged = 'changed'");
    expect(scope.diff).toContain("unstaged = 'changed'");
    expect(scope.diff).toContain("untracked = true");
    expect(await client.statusZ()).toBe(statusBefore);
    expect(await client.required(["ls-files", "--stage"], "inspect index")).toBe(indexBefore);
  });

  it("reads an untracked symlink object without following its target", async () => {
    const root = await layeredRepository();
    const outside = resolve(testRoot, "outside-secret.txt");
    cleanups.push(() => rm(outside, { force: true }));
    const outsideValue = ["outside", "credential", "must-not-be-read"].join("-");
    await writeFile(outside, outsideValue);
    await symlink(outside, resolve(root, "linked.txt"));
    const client = createGitClient(createCommandRunner(), root);

    const scope = await collectReadOnlySafetyScope({
      git: client,
      root,
      compareRef: "origin/main",
    });

    expect(scope.diff).not.toContain(outsideValue);
    expect(scope.diff).toContain("new file mode 120000");
    expect(scope.diff).toContain("outside-secret.txt");
  });

  it("performs no fetch, stage, commit, push, or GitHub operation", async () => {
    const gitClient = {
      repoRoot: vi.fn(async () => process.cwd()),
      branch: vi.fn(async () => "codex/safety-test"),
      verifyRef: vi.fn(async () => true),
      mergeBase: vi.fn(async () => "base-sha"),
      statusZ: vi.fn(async () => ""),
      diff: vi.fn(async (args) => (args[0] === "--name-status" ? "" : "")),
      fetchDefault: vi.fn(() => {
        throw new Error("must not fetch");
      }),
      addPaths: vi.fn(() => {
        throw new Error("must not stage");
      }),
      commit: vi.fn(() => {
        throw new Error("must not commit");
      }),
      push: vi.fn(() => {
        throw new Error("must not push");
      }),
    };
    const output = {
      step: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      danger: vi.fn(),
      success: vi.fn(),
    };

    await expect(runSafetyGuardFlow({ git: gitClient, output })).resolves.toMatchObject({
      findings: [],
    });
    expect(gitClient.fetchDefault).not.toHaveBeenCalled();
    expect(gitClient.addPaths).not.toHaveBeenCalled();
    expect(gitClient.commit).not.toHaveBeenCalled();
    expect(gitClient.push).not.toHaveBeenCalled();
  });
});
