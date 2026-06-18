import { PublishError } from "../shared/errors.mjs";
import { pollForVerifiedMerge, refreshDefaultBranch } from "./actions.mjs";
import { renderMergePrReport } from "./final-report.mjs";
import { assertMergeReady, evaluateRequiredChecks } from "./validation.mjs";

function showPullRequestMetadata(output, pr) {
  output.step("Pull request metadata");
  output.info(`Number: ${pr.number}`);
  output.info(`Title: ${pr.title}`);
  output.info(`URL: ${pr.url}`);
  output.info(`Head branch: ${pr.headRefName}`);
  output.info(`Head SHA/OID: ${pr.headRefOid}`);
  output.info(`Base branch: ${pr.baseRefName}`);
  output.info(`State: ${pr.state}`);
  output.info(`Draft: ${pr.isDraft ? "yes" : "no"}`);
  output.info(`Mergeability: ${pr.mergeable}`);
}

async function validateMergeCandidate({ gh, repo, prNumber, defaultBranch, expected, checkMode }) {
  const pr = await gh.viewPullRequest(repo, prNumber);
  const headBranch = expected?.headRefName || pr.headRefName;
  const headSha = expected?.headRefOid || pr.headRefOid;
  assertMergeReady(pr, {
    branch: headBranch,
    defaultBranch,
    headSha,
  });
  const checks = await gh.requiredChecks(repo, pr.number);
  const checkState = evaluateRequiredChecks(checks, checkMode);
  return { pr, checkState };
}

function autoMergeFailure(error, prNumber) {
  return new PublishError(
    "AUTO_MERGE_FAILED",
    `GitHub did not enable auto-merge for PR #${prNumber}; the PR remains open. Check repository auto-merge settings, permissions, and PR eligibility. ${error.message}`,
    { causeType: error.type, causeDetails: error.details },
  );
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
  const defaultBranch = env.DEFAULT_BRANCH || "main";
  await git.repoRoot();
  await git.origin();
  if (await git.status()) {
    throw new PublishError(
      "UNSAFE_BRANCH_STATE",
      "Worktree must be clean before merge or default-branch refresh actions.",
    );
  }
  if (!(await gh.authReady())) {
    throw new PublishError(
      "GH_AUTH_FAILED",
      "GitHub CLI authentication is required before pull request merge actions.",
    );
  }

  const repo = await gh.repoName();
  const displayedPr = await gh.viewPullRequest(repo, options.prNumber);
  showPullRequestMetadata(output, displayedPr);
  const checkMode = options.autoMerge ? "auto" : "immediate";
  await validateMergeCandidate({
    gh,
    repo,
    prNumber: displayedPr.number,
    defaultBranch,
    expected: displayedPr,
    checkMode,
  });

  const confirmation = options.autoMerge
    ? `Complete PR #${displayedPr.number} with squash merge now if ready, or enable auto-merge if required checks are pending?`
    : `Squash merge PR #${displayedPr.number}?`;
  if (!options.yes && !(await prompts.confirm(confirmation))) {
    throw new PublishError("USER_CANCELLED", "Pull request merge was not approved.");
  }

  const { pr: mergePr, checkState } = await validateMergeCandidate({
    gh,
    repo,
    prNumber: displayedPr.number,
    defaultBranch,
    expected: displayedPr,
    checkMode,
  });
  if (await git.status()) {
    throw new PublishError(
      "UNSAFE_BRANCH_STATE",
      "Worktree changed before merge. No merge was attempted.",
    );
  }

  const enableAutoMerge = options.autoMerge && checkState.pending;
  try {
    await gh.merge(repo, mergePr.number, {
      auto: enableAutoMerge,
      headSha: displayedPr.headRefOid,
    });
  } catch (error) {
    if (enableAutoMerge) throw autoMergeFailure(error, mergePr.number);
    throw error;
  }

  let verifiedPr;
  if (enableAutoMerge) {
    const afterRequest = await gh.viewPullRequest(repo, mergePr.number);
    if (afterRequest.mergedAt && afterRequest.baseRefName === defaultBranch) {
      verifiedPr = afterRequest;
    } else if (afterRequest.state === "OPEN") {
      const currentBranch = await git.branch();
      const report = {
        prNumber: afterRequest.number,
        prUrl: afterRequest.url || displayedPr.url,
        mergeStatus: "waiting for required checks and reviews",
        autoMergeStatus: "enabled; GitHub will merge after requirements pass",
        refreshStatus: "not attempted; PR remains open and local branch is unchanged",
        currentBranch,
      };
      renderMergePrReport(output, report);
      return { status: "auto-merge-enabled", report };
    } else {
      throw new PublishError(
        "POLICY_BLOCKED",
        `PR #${afterRequest.number} is ${afterRequest.state} without verified merge into ${defaultBranch} after the auto-merge request.`,
      );
    }
  } else {
    verifiedPr = await pollForVerifiedMerge({
      gh,
      repo,
      prNumber: mergePr.number,
      defaultBranch,
      attempts: Number(env.PUBLISH_MERGE_POLL_ATTEMPTS || 12),
      intervalMs: Number(env.PUBLISH_MERGE_POLL_INTERVAL_MS || 5000),
      sleep,
    });
  }

  if (await git.status()) {
    throw new PublishError(
      "UNSAFE_BRANCH_STATE",
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
    mergeStatus: "verified merged",
    autoMergeStatus: enableAutoMerge
      ? "requested; GitHub reported the PR already merged"
      : "not enabled",
    refreshStatus: refresh.refreshed
      ? "refreshed with fast-forward only"
      : "merge succeeded; refresh blocked because fast-forward was unavailable",
    currentBranch,
  };
  renderMergePrReport(output, report);
  return {
    status: refresh.refreshed ? "merged-and-refreshed" : "merged-refresh-blocked",
    report,
  };
}
