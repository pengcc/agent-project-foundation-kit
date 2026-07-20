import { lstat, readFile, readlink } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { PublishError } from "../shared/errors.mjs";
import { parseNameStatus } from "./scope-summary.mjs";
import { assertSecretSafeScope } from "./secret-safety.mjs";
import { parsePorcelainZ } from "./state.mjs";

function statusForWorktreeEntry(entry) {
  if (entry.status === "??") return "A";
  if (entry.status.includes("D")) return "D";
  if (entry.status.includes("A")) return "A";
  return "M";
}

function mergeFiles(...groups) {
  const files = new Map();
  for (const group of groups) {
    for (const file of group) files.set(file.path, file);
  }
  return [...files.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function untrackedFileDiff(path, content, mode = "100644") {
  return [
    `diff --git a/${path} b/${path}`,
    `new file mode ${mode}`,
    "--- /dev/null",
    `+++ b/${path}`,
    ...content.split(/\r?\n/).map((line) => `+${line}`),
  ].join("\n");
}

async function readUntrackedGitContent(root, path) {
  const absolutePath = resolve(root, path);
  const relativePath = relative(root, absolutePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new PublishError(
      "UNSAFE_PATH",
      `Untracked path resolves outside the repository: ${path}`,
    );
  }
  const stats = await lstat(absolutePath);
  if (stats.isSymbolicLink()) {
    return { content: await readlink(absolutePath), mode: "120000" };
  }
  if (!stats.isFile()) {
    throw new PublishError(
      "UNSAFE_PATH",
      `Unsupported untracked filesystem entry in safety scope: ${path}`,
    );
  }
  return { content: await readFile(absolutePath, "utf8"), mode: "100644" };
}

export async function collectReadOnlySafetyScope({ git, root, compareRef }) {
  if (!(await git.verifyRef(compareRef))) {
    throw new PublishError(
      "UNSAFE_BRANCH_STATE",
      `Comparison ref not found: ${compareRef}. Refresh or create the local remote-tracking ref before running safety:guard.`,
    );
  }

  const mergeBase = await git.mergeBase(compareRef, "HEAD");
  const committedRange = `${mergeBase}...HEAD`;
  const committedFiles = parseNameStatus(
    await git.diff(["--name-status", "--no-renames", committedRange]),
  );
  const committedDiff = await git.diff([committedRange]);
  const worktreeEntries = parsePorcelainZ(await git.statusZ());
  const worktreeFiles = worktreeEntries.flatMap((entry) => {
    const files = [{ path: entry.path, status: statusForWorktreeEntry(entry) }];
    if (entry.originalPath) files.push({ path: entry.originalPath, status: "D" });
    return files;
  });
  const trackedWorktreeDiff = await git.diff(["HEAD"]);
  const untrackedEntries = worktreeEntries.filter((entry) => entry.status === "??");
  const untrackedDiffs = await Promise.all(
    untrackedEntries.map(async ({ path }) => {
      const { content, mode } = await readUntrackedGitContent(root, path);
      return untrackedFileDiff(path, content, mode);
    }),
  );

  return {
    compareRef,
    mergeBase,
    files: mergeFiles(committedFiles, worktreeFiles),
    diff: [committedDiff, trackedWorktreeDiff, ...untrackedDiffs].filter(Boolean).join("\n"),
  };
}

export async function runSafetyGuardFlow({ git, output, env = process.env }) {
  const defaultBranch = env.DEFAULT_BRANCH || "main";
  const compareRef = `origin/${defaultBranch}`;
  const root = await git.repoRoot();
  const branch = await git.branch();
  const scope = await collectReadOnlySafetyScope({ git, root, compareRef });

  output.step("Read-only secret-safety guard");
  output.info(`Branch: ${branch}`);
  output.info(`Local comparison ref: ${scope.compareRef}`);
  output.info(`Merge base: ${scope.mergeBase}`);
  output.info(`Changed files scanned: ${scope.files.length}`);
  output.info("GitHub, fetch, stage, commit, push, and PR operations: none");

  return assertSecretSafeScope({
    files: scope.files,
    diff: scope.diff,
    output,
    standalone: true,
  });
}
