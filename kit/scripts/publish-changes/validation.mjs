import { PublishError } from '../shared/errors.mjs';

export function isMergeReadinessPending(pr) {
  return pr.mergeable === 'UNKNOWN' || pr.mergeStateStatus === 'UNKNOWN';
}

export function evaluateRequiredChecks(checks, mode) {
  let pending = false;
  for (const check of checks) {
    const bucket = String(check.bucket ?? '').toLowerCase();
    if (bucket === 'pass') continue;
    if (bucket === 'pending') {
      pending = true;
      continue;
    }
    if (['fail', 'cancel', 'skipping'].includes(bucket)) {
      throw new PublishError('CHECKS_FAILED', `Required check is ${bucket}: ${check.state ?? ''}`);
    }
    throw new PublishError('CHECKS_FAILED', `Unknown required check state: ${check.bucket}`);
  }
  if (pending && mode === 'immediate') {
    throw new PublishError('CHECKS_PENDING', 'Required checks are pending; use auto-merge or PR-only.');
  }
  return { pending };
}

export function assertMergeReady(pr, { branch, defaultBranch, headSha }) {
  if (pr.state !== 'OPEN') throw new PublishError('POLICY_BLOCKED', `PR #${pr.number} is not open.`);
  if (pr.baseRefName !== defaultBranch) {
    throw new PublishError('POLICY_BLOCKED', `PR targets ${pr.baseRefName}, not ${defaultBranch}.`);
  }
  if (pr.headRefName !== branch) {
    throw new PublishError('POLICY_BLOCKED', `PR head ${pr.headRefName} does not match ${branch}.`);
  }
  if (pr.headRefOid !== headSha) {
    throw new PublishError('POLICY_BLOCKED', 'PR head commit does not match the expected head.');
  }
  if (pr.isDraft) throw new PublishError('POLICY_BLOCKED', 'Draft PRs cannot be merged.');
  if (pr.mergeable === 'CONFLICTING') throw new PublishError('POLICY_BLOCKED', 'PR has conflicts.');
  if (isMergeReadinessPending(pr)) {
    throw new PublishError('POLICY_BLOCKED', 'GitHub has not resolved merge readiness.');
  }
}
