import { PublishError } from '../shared/errors.mjs';
import { buildScopeSummary } from './scope-summary.mjs';

export function parsePorcelainZ(text) {
  const records = text.split('\0');
  const entries = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    const status = record.slice(0, 2);
    entries.push({ status, path: record.slice(3) });
    if (/[RC]/.test(status)) {
      index += 1;
      if (records[index]) entries.push({ status, path: records[index] });
    }
  }
  return entries;
}

export async function captureWorktreeSnapshot(git) {
  const statusZ = await git.statusZ();
  const entries = parsePorcelainZ(statusZ);
  const untrackedPaths = entries
    .filter((entry) => entry.status === '??')
    .map((entry) => entry.path);
  const hashes = untrackedPaths.length ? (await git.hashFiles(untrackedPaths)).split('\n') : [];
  return {
    statusZ,
    trackedDiff: await git.diff(['--binary', 'HEAD']),
    untracked: untrackedPaths.map((path, index) => ({ path, hash: hashes[index] })),
    paths: [...new Set(entries.map((entry) => entry.path))].sort(),
  };
}

export function worktreeSnapshotsMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function buildStagedScope(git, branch, compareRef, showDiff = false) {
  return buildScopeSummary({
    branch,
    nameStatus: await git.diff(['--cached', '--name-status', compareRef]),
    numstat: await git.diff(['--cached', '--numstat', compareRef]),
    diff: showDiff ? await git.diff(['--cached', compareRef]) : '',
  });
}

async function comparisonRef(git, branch, defaultBranch) {
  const upstream = await git.upstream(branch);
  if (upstream) return upstream;
  const defaultRef = `origin/${defaultBranch}`;
  if (!(await git.verifyRef(defaultRef))) {
    throw new PublishError('UNSAFE_BRANCH_STATE', `Comparison ref not found: ${defaultRef}`);
  }
  return defaultRef;
}

export async function detectPublishState({
  git,
  gh,
  output,
  defaultBranch = 'main',
  showDiff = false,
}) {
  const root = await git.repoRoot();
  const branch = await git.branch();
  if (branch === 'HEAD') throw new PublishError('UNSAFE_BRANCH_STATE', 'Detached HEAD is unsupported.');
  await git.origin();
  await git.fetchDefault(defaultBranch);
  const defaultFresh = await git.includesDefault(`origin/${defaultBranch}`);

  const worktreeStatus = await git.status();
  const hasUncommitted = Boolean(worktreeStatus);
  const worktreeSnapshot = hasUncommitted ? await captureWorktreeSnapshot(git) : null;
  const compareRef = await comparisonRef(git, branch, defaultBranch);
  const commits = await git.logRange(`${compareRef}..HEAD`);
  const hasUnpushed = Boolean(commits);

  let nameStatus = '';
  let numstat = '';
  let diff = '';
  if (hasUncommitted) {
    nameStatus = await git.diff(['--name-status', compareRef]);
    const untracked = await git.untracked();
    if (untracked) {
      nameStatus += `${nameStatus ? '\n' : ''}${untracked
        .split('\n')
        .filter(Boolean)
        .map((path) => `?\t${path}`)
        .join('\n')}`;
    }
    numstat = await git.diff(['--numstat', compareRef]);
    if (showDiff) diff = await git.diff([compareRef]);
  } else if (hasUnpushed) {
    nameStatus = await git.diff(['--name-status', `${compareRef}...HEAD`]);
    numstat = await git.diff(['--numstat', `${compareRef}...HEAD`]);
    if (showDiff) diff = await git.diff([`${compareRef}...HEAD`]);
  }

  let repo = '';
  let ghReady = false;
  let repositoryOpenPrs = [];
  let currentBranchPr = null;
  if (gh) {
    ghReady = await gh.authReady();
    if (ghReady) {
      repo = await gh.repoName();
      repositoryOpenPrs = await gh.listPullRequests(repo, ['--state', 'open', '--limit', '100']);
      const branchPrs = await gh.listPullRequests(repo, [
        '--state',
        'all',
        '--head',
        branch,
        '--limit',
        '1',
      ]);
      const currentBranchMatch =
        branchPrs[0] || repositoryOpenPrs.find((pr) => pr.headRefName === branch);
      if (currentBranchMatch) {
        currentBranchPr = await gh.viewPullRequest(repo, currentBranchMatch.number);
      }
      repositoryOpenPrs = repositoryOpenPrs.filter(
        (pr) => pr.number !== currentBranchPr?.number,
      );
    } else {
      output?.warning('GitHub CLI is unavailable or unauthenticated; PR preflight is incomplete.');
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
