import { PublishError } from '../shared/errors.mjs';
import { pollForVerifiedMerge, refreshDefaultBranch } from './actions.mjs';
import { renderMergePrReport } from './final-report.mjs';
import { assertMergeReady, evaluateRequiredChecks } from './validation.mjs';

function showPullRequestMetadata(output, pr) {
  output.step('Pull request metadata');
  output.info(`Number: ${pr.number}`);
  output.info(`Title: ${pr.title}`);
  output.info(`URL: ${pr.url}`);
  output.info(`Head branch: ${pr.headRefName}`);
  output.info(`Head SHA/OID: ${pr.headRefOid}`);
  output.info(`Base branch: ${pr.baseRefName}`);
  output.info(`State: ${pr.state}`);
  output.info(`Draft: ${pr.isDraft ? 'yes' : 'no'}`);
  output.info(`Mergeability: ${pr.mergeable}`);
}

async function validateMergeCandidate({ gh, repo, prNumber, defaultBranch, expected }) {
  const pr = await gh.viewPullRequest(repo, prNumber);
  const headBranch = expected?.headRefName || pr.headRefName;
  const headSha = expected?.headRefOid || pr.headRefOid;
  assertMergeReady(pr, {
    branch: headBranch,
    defaultBranch,
    headSha,
  });
  const checks = await gh.requiredChecks(repo, pr.number);
  evaluateRequiredChecks(checks, 'immediate');
  return pr;
}

export async function runMergePrFlow({
  git,
  gh,
  prompts,
  output,
  options,
  env = process.env,
  sleep,
}) {
  const defaultBranch = env.DEFAULT_BRANCH || 'main';
  await git.repoRoot();
  await git.origin();
  if (await git.status()) {
    throw new PublishError(
      'UNSAFE_BRANCH_STATE',
      'Worktree must be clean before merge or default-branch refresh actions.',
    );
  }
  if (!(await gh.authReady())) {
    throw new PublishError(
      'GH_AUTH_FAILED',
      'GitHub CLI authentication is required before pull request merge actions.',
    );
  }

  const repo = await gh.repoName();
  const displayedPr = await gh.viewPullRequest(repo, options.prNumber);
  showPullRequestMetadata(output, displayedPr);
  await validateMergeCandidate({
    gh,
    repo,
    prNumber: displayedPr.number,
    defaultBranch,
    expected: displayedPr,
  });

  if (
    !options.yes &&
    !(await prompts.confirm(`Squash merge PR #${displayedPr.number}?`))
  ) {
    throw new PublishError('USER_CANCELLED', 'Pull request merge was not approved.');
  }

  const mergePr = await validateMergeCandidate({
    gh,
    repo,
    prNumber: displayedPr.number,
    defaultBranch,
    expected: displayedPr,
  });
  if (await git.status()) {
    throw new PublishError(
      'UNSAFE_BRANCH_STATE',
      'Worktree changed before merge. No merge was attempted.',
    );
  }

  await gh.merge(repo, mergePr.number, {
    auto: false,
    headSha: displayedPr.headRefOid,
  });
  const verifiedPr = await pollForVerifiedMerge({
    gh,
    repo,
    prNumber: mergePr.number,
    defaultBranch,
    attempts: Number(env.PUBLISH_MERGE_POLL_ATTEMPTS || 12),
    intervalMs: Number(env.PUBLISH_MERGE_POLL_INTERVAL_MS || 5000),
    sleep,
  });

  if (await git.status()) {
    throw new PublishError(
      'UNSAFE_BRANCH_STATE',
      `PR #${verifiedPr.number} merged, but the worktree changed before refresh. Local branches were not switched.`,
    );
  }
  const refresh = await refreshDefaultBranch({
    git,
    prompts,
    output,
    defaultBranch,
    verifiedPr,
    fastForwardOnly: true,
  });
  const currentBranch = await git.branch();
  const report = {
    prNumber: verifiedPr.number,
    prUrl: verifiedPr.url || displayedPr.url,
    mergeStatus: 'verified merged',
    refreshStatus: refresh.refreshed
      ? 'refreshed with fast-forward only'
      : 'merge succeeded; refresh blocked because fast-forward was unavailable',
    currentBranch,
  };
  renderMergePrReport(output, report);
  return {
    status: refresh.refreshed ? 'merged-and-refreshed' : 'merged-refresh-blocked',
    report,
  };
}
