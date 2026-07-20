import { PublishError } from "../shared/errors.mjs";
import { buildScopeSummary } from "./scope-summary.mjs";

export function parsePorcelainZ(text) {
  const records = text.split("\0");
  const entries = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    const status = record.slice(0, 2);
    const entry = { status, path: record.slice(3) };
    if (/[RC]/.test(status)) {
      index += 1;
      if (records[index]) entry.originalPath = records[index];
    }
    entries.push(entry);
  }
  return entries;
}

export function findMixedIndexWorktreePaths(entries) {
  const states = new Map();
  for (const entry of entries) {
    const indexChanged = entry.status[0] !== " " && entry.status[0] !== "?";
    const worktreeChanged = entry.status[1] !== " ";
    const paths = entry.originalPath ? [entry.path, entry.originalPath] : [entry.path];
    for (const path of paths) {
      const state = states.get(path) || { indexChanged: false, worktreeChanged: false };
      state.indexChanged ||= indexChanged;
      state.worktreeChanged ||= worktreeChanged;
      states.set(path, state);
    }
  }
  return [...states.entries()]
    .filter(([, state]) => state.indexChanged && state.worktreeChanged)
    .map(([path]) => path)
    .sort();
}

export async function captureWorktreeSnapshot(git) {
  const statusZ = await git.statusZ();
  const entries = parsePorcelainZ(statusZ);
  const mixedPaths = findMixedIndexWorktreePaths(entries);
  const untrackedPaths = entries
    .filter((entry) => entry.status === "??")
    .map((entry) => entry.path);
  const hashes = untrackedPaths.length ? (await git.hashFiles(untrackedPaths)).split("\n") : [];
  const observedPaths = entries.flatMap((entry) =>
    entry.originalPath ? [entry.path, entry.originalPath] : [entry.path],
  );
  const stagePaths = entries.flatMap((entry) => {
    if (entry.status !== "??" && entry.status[1] === " ") return [];
    if (entry.originalPath && entry.status[1] === "R") {
      return [entry.path, entry.originalPath];
    }
    return [entry.path];
  });
  return {
    statusZ,
    trackedDiff: await git.diff(["--binary", "HEAD"]),
    untracked: untrackedPaths.map((path, index) => ({ path, hash: hashes[index] })),
    paths: [...new Set(observedPaths)].sort(),
    stagePaths: [...new Set(stagePaths)].sort(),
    mixedPaths,
  };
}

export function worktreeSnapshotsMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function buildStagedScope(git, branch, compareRef, showDiff = false) {
  return buildScopeSummary({
    branch,
    nameStatus: await git.diff(["--cached", "--name-status", "--no-renames", compareRef]),
    numstat: await git.diff(["--cached", "--numstat", "--no-renames", compareRef]),
    diff: showDiff ? await git.diff(["--cached", compareRef]) : "",
  });
}

async function comparisonRef(git, branch, defaultBranch) {
  const upstream = await git.upstream(branch);
  if (upstream) return upstream;
  const defaultRef = `origin/${defaultBranch}`;
  if (!(await git.verifyRef(defaultRef))) {
    throw new PublishError("UNSAFE_BRANCH_STATE", `Comparison ref not found: ${defaultRef}`);
  }
  return defaultRef;
}

export async function detectPublishState({
  git,
  gh,
  output,
  defaultBranch = "main",
  showDiff = false,
}) {
  const root = await git.repoRoot();
  const branch = await git.branch();
  if (branch === "HEAD")
    throw new PublishError("UNSAFE_BRANCH_STATE", "Detached HEAD is unsupported.");
  await git.origin();
  await git.fetchDefault(defaultBranch);
  const defaultFresh = await git.includesDefault(`origin/${defaultBranch}`);

  const worktreeStatus = await git.status();
  const hasUncommitted = Boolean(worktreeStatus);
  const worktreeSnapshot = hasUncommitted ? await captureWorktreeSnapshot(git) : null;
  if (worktreeSnapshot?.mixedPaths.length) {
    const sample = worktreeSnapshot.mixedPaths.slice(0, 5).join(", ");
    const omitted = worktreeSnapshot.mixedPaths.length - 5;
    throw new PublishError(
      "MIXED_INDEX_WORKTREE_STATE",
      `Publish workflow does not support paths with both staged and unstaged changes: ${sample}${omitted > 0 ? `, ... (+${omitted} more)` : ""}. Stage or unstage each listed path consistently, then rerun. No files were staged, committed, pushed, or published.`,
    );
  }
  const compareRef = await comparisonRef(git, branch, defaultBranch);
  const commits = await git.logRange(`${compareRef}..HEAD`);
  const hasUnpushed = Boolean(commits);

  let nameStatus = "";
  let numstat = "";
  let diff = "";
  if (hasUncommitted) {
    nameStatus = await git.diff(["--name-status", "--no-renames", compareRef]);
    const untracked = await git.untracked();
    if (untracked) {
      nameStatus += `${nameStatus ? "\n" : ""}${untracked
        .split("\n")
        .filter(Boolean)
        .map((path) => `?\t${path}`)
        .join("\n")}`;
    }
    numstat = await git.diff(["--numstat", "--no-renames", compareRef]);
    if (showDiff) diff = await git.diff([compareRef]);
  } else if (hasUnpushed) {
    nameStatus = await git.diff(["--name-status", "--no-renames", `${compareRef}...HEAD`]);
    numstat = await git.diff(["--numstat", "--no-renames", `${compareRef}...HEAD`]);
    if (showDiff) diff = await git.diff([`${compareRef}...HEAD`]);
  }

  let repo = "";
  let ghReady = false;
  let repositoryOpenPrs = [];
  let currentBranchPr = null;
  if (gh) {
    ghReady = await gh.authReady();
    if (ghReady) {
      repo = await gh.repoName();
      repositoryOpenPrs = await gh.listPullRequests(repo, ["--state", "open", "--limit", "100"]);
      const branchPrs = await gh.listPullRequests(repo, [
        "--state",
        "all",
        "--head",
        branch,
        "--limit",
        "1",
      ]);
      const currentBranchMatch =
        branchPrs[0] || repositoryOpenPrs.find((pr) => pr.headRefName === branch);
      if (currentBranchMatch) {
        currentBranchPr = await gh.viewPullRequest(repo, currentBranchMatch.number);
      }
      repositoryOpenPrs = repositoryOpenPrs.filter((pr) => pr.number !== currentBranchPr?.number);
    } else {
      output?.warning("GitHub CLI is unavailable or unauthenticated; PR preflight is incomplete.");
    }
  }

  return {
    root,
    repo,
    branch,
    defaultBranch,
    defaultFresh,
    compareRef,
    ghReady,
    hasUncommitted,
    worktreeSnapshot,
    hasUnpushed,
    commits,
    currentBranchPr,
    repositoryOpenPrs,
    scope: buildScopeSummary({ branch, nameStatus, numstat, diff }),
  };
}
