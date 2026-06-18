import { PublishError } from "../shared/errors.mjs";
import {
  createOrUpdatePullRequest,
  ensureFeatureBranch,
  pollForVerifiedMerge,
  refreshDefaultBranch,
  verifyAndMerge,
} from "./actions.mjs";
import { renderFinalReport } from "./final-report.mjs";
import { chooseClassification, chooseCompletionMode, chooseValidation } from "./prompts.mjs";
import {
  assertHeadFingerprint,
  collectExactPublishScope,
  commitConfirmedScope,
} from "./scope-safety.mjs";
import { recommendClassification, renderScopeSummary } from "./scope-summary.mjs";
import { assertSecretSafePublishScope } from "./secret-safety.mjs";
import { detectPublishState } from "./state.mjs";

const LABELS = {
  small_safe: "Small safe",
  normal: "Normal",
  significant: "Significant",
};

function manualRefreshInstruction(defaultBranch) {
  return `After merge verification, re-run this workflow or run: git switch ${defaultBranch} && git fetch origin ${defaultBranch} && git pull --ff-only origin ${defaultBranch}`;
}

export async function runPublishFlow({
  git,
  gh,
  prompts,
  output,
  policy,
  options,
  env = process.env,
  sleep,
}) {
  const defaultBranch = env.DEFAULT_BRANCH || "main";
  const state = await detectPublishState({
    git,
    gh,
    output,
    defaultBranch,
    showDiff: options.showDiff,
  });
  output.step("Publish preflight");
  output.info(`Current branch: ${state.branch}`);
  output.info(`Uncommitted changes: ${state.hasUncommitted ? "yes" : "no"}`);
  output.info(`Unpushed commits: ${state.hasUnpushed ? "yes" : "no"}`);
  output.info(`Current-branch PR: ${state.currentBranchPr?.number ?? "none detected"}`);

  if (!state.defaultFresh) {
    output.warning(`Current HEAD does not include the latest origin/${defaultBranch}.`);
    if (!(await prompts.confirm("Continue publishing from the current branch state?"))) {
      throw new PublishError(
        "UNSAFE_BRANCH_STATE",
        `Stopped because the current branch is not based on origin/${defaultBranch}.`,
      );
    }
  }

  if (state.repositoryOpenPrs.length) {
    output.warning(
      `Repository open PRs: ${state.repositoryOpenPrs
        .map((pr) => `#${pr.number} ${pr.title} ${pr.url}`)
        .join("; ")}`,
    );
    if (!(await prompts.confirm("Continue after reviewing repository open pull requests?"))) {
      throw new PublishError("USER_CANCELLED", "Stopped after repository pull request review.");
    }
  }

  if (!state.hasUncommitted && !state.hasUnpushed) {
    if (state.currentBranchPr?.mergedAt && state.currentBranchPr.baseRefName === defaultBranch) {
      const approved = await prompts.confirm(
        `Refresh local ${defaultBranch} from verified merged PR?`,
      );
      if (approved) {
        await refreshDefaultBranch({
          git,
          prompts,
          output,
          defaultBranch,
          verifiedPr: state.currentBranchPr,
        });
      }
      return { status: "recovered", state };
    }
    if (state.currentBranchPr?.state === "OPEN") {
      output.info(`PR #${state.currentBranchPr.number} remains open: ${state.currentBranchPr.url}`);
      return { status: "open-pr", state };
    }
    output.success("Nothing to publish.");
    return { status: "noop", state };
  }

  if (!state.ghReady) {
    throw new PublishError(
      "GH_AUTH_FAILED",
      "GitHub CLI authentication is required before commit, push, or pull request actions.",
    );
  }

  let commitMessage = options.commitMessage;
  if (state.hasUncommitted && !commitMessage) {
    commitMessage = await prompts.ask("Enter commit message: ");
    if (!commitMessage.trim())
      throw new PublishError("INVALID_ARGUMENT", "Commit message is required.");
  }
  if (!commitMessage) commitMessage = await git.latestSubject();
  const prTitle = options.prTitle || commitMessage;

  renderScopeSummary(state.scope, output, {
    showDiff: options.showDiff,
    heading: "Preliminary scope summary",
  });
  const recommended = recommendClassification(state.scope);
  output.step("Recommended publish context");
  output.info(`Recommended update type: ${LABELS[recommended]}`);
  output.info(
    `Recommended commit message: ${state.hasUncommitted ? commitMessage : "no new commit needed"}`,
  );
  output.info(`Recommended PR title: ${prTitle}`);

  const classification = await chooseClassification(prompts, recommended);
  const classificationPolicy = policy.classifications[classification];
  output.info(`Selected update type: ${LABELS[classification]}`);

  const confirmed = await collectExactPublishScope({
    git,
    state,
    output,
    showDiff: options.showDiff,
  });
  const confirmedScope = confirmed.scope;

  if (!(await prompts.confirm("Does this scope match the intended task boundary?"))) {
    throw new PublishError("USER_CANCELLED", "Scope consistency was not confirmed.");
  }
  await assertHeadFingerprint(
    git,
    confirmed.head,
    "Branch history changed during scope confirmation. Re-run and confirm the updated scope.",
  );
  await assertSecretSafePublishScope({
    git,
    state,
    confirmed,
    output,
  });

  const branch = await ensureFeatureBranch({
    state,
    git,
    prompts,
    output,
    commitMessage,
    classification,
    branchPrefix: env.CHANGE_BRANCH_PREFIX || "change",
  });
  const actions = [];
  let expectedPushHead = confirmed.head;
  if (state.hasUncommitted) {
    expectedPushHead = await commitConfirmedScope({
      git,
      state,
      confirmed,
      commitMessage,
      stagedDriftMessage:
        "Staged scope changed after confirmation. Re-run and confirm the updated scope.",
      headDriftMessage:
        "Branch history changed after scope confirmation. Re-run and confirm the updated scope.",
    });
    actions.push("commit");
  }

  const validation = await chooseValidation(prompts, classification, classificationPolicy);
  await assertHeadFingerprint(
    git,
    expectedPushHead,
    "Branch history changed after scope confirmation. Do not push; re-run and confirm the updated scope.",
  );
  await git.push(branch);
  actions.push("push");
  const { pr } = await createOrUpdatePullRequest({
    gh,
    git,
    repo: state.repo,
    branch,
    defaultBranch,
    title: prTitle,
    classification,
    validation,
  });
  actions.push("pull request create/update");

  const mode =
    classification === "small_safe" && classificationPolicy.allow_auto_merge
      ? "auto"
      : await chooseCompletionMode(prompts, classification, classificationPolicy, output);
  let refreshStatus = "not requested";

  if (mode !== "pr_only") {
    if (classificationPolicy.require_manual_review) {
      const approved = await prompts.typed(
        "Confirm manual PR review and squash merge approval.",
        "I HAVE REVIEWED THE PR AND APPROVE SQUASH MERGE",
      );
      if (!approved) throw new PublishError("USER_CANCELLED", "Manual PR review was not approved.");
    }
    if (classification === "significant" && classificationPolicy.require_typed_confirmation) {
      const approved = await prompts.typed(
        "High-impact merge requires additional approval.",
        "I APPROVE HIGH IMPACT MERGE",
      );
      if (!approved)
        throw new PublishError("USER_CANCELLED", "High-impact merge was not approved.");
    }

    await verifyAndMerge({
      gh,
      git,
      repo: state.repo,
      pr,
      branch,
      defaultBranch,
      mode,
      output,
      attempts: Number(env.PUBLISH_READINESS_POLL_ATTEMPTS || 6),
      intervalMs: Number(env.PUBLISH_READINESS_POLL_INTERVAL_MS || 2000),
      sleep,
    });
    actions.push(mode === "auto" ? "enable auto-merge" : "immediate squash merge");

    let verifiedPr = null;
    if (mode === "immediate" || (mode === "auto" && classificationPolicy.poll_after_auto_merge)) {
      verifiedPr = await pollForVerifiedMerge({
        gh,
        repo: state.repo,
        prNumber: pr.number,
        defaultBranch,
        attempts: Number(env.PUBLISH_MERGE_POLL_ATTEMPTS || 12),
        intervalMs: Number(env.PUBLISH_MERGE_POLL_INTERVAL_MS || 5000),
        sleep,
      });
    } else {
      output.info(manualRefreshInstruction(defaultBranch));
      refreshStatus = "polling disabled by policy";
    }

    if (verifiedPr && classificationPolicy.refresh_default_branch_after_verified_merge) {
      const result = await refreshDefaultBranch({
        git,
        prompts,
        output,
        defaultBranch,
        verifiedPr,
      });
      refreshStatus = result.refreshed ? "refreshed after verified merge" : "refresh not completed";
      if (result.refreshed) actions.push("default branch refresh");
    } else if (verifiedPr) {
      output.info(manualRefreshInstruction(defaultBranch));
      refreshStatus = "disabled by policy";
    }
  }

  const report = {
    classification: LABELS[classification],
    commitMessage,
    prTitle,
    branch,
    validation,
    prUrl: pr.url,
    mode,
    refreshStatus,
    actions,
    filesChanged: confirmedScope.files.map((file) => file.path),
    docsUpdated: confirmedScope.files.some(
      (file) => file.path === "README.md" || file.path?.startsWith("docs/"),
    ),
    projectMemoryUpdated: confirmedScope.files.some((file) =>
      file.path?.startsWith(".codex/project/"),
    ),
  };
  renderFinalReport(output, report);
  return { status: "published", report };
}
