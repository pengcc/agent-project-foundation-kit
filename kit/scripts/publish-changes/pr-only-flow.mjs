import { PublishError } from "../shared/errors.mjs";
import { prOnlyPublishRecord } from "./actions.mjs";
import { renderPrOnlyReport } from "./final-report.mjs";
import {
  assertHeadFingerprint,
  collectExactPublishScope,
  commitConfirmedScope,
} from "./scope-safety.mjs";
import { renderScopeSummary } from "./scope-summary.mjs";
import { assertSecretSafePublishScope } from "./secret-safety.mjs";
import { detectPublishState } from "./state.mjs";

function isDefaultBranch(branch, defaultBranch) {
  return ["main", "master", defaultBranch].includes(branch);
}

export async function runPrOnlyFlow({ git, gh, prompts, output, options, env = process.env }) {
  const defaultBranch = env.DEFAULT_BRANCH || "main";
  const state = await detectPublishState({
    git,
    gh,
    output,
    defaultBranch,
    showDiff: options.showDiff,
  });

  output.step("PR-only preflight");
  output.info(`Current branch: ${state.branch}`);
  output.info(`Uncommitted changes: ${state.hasUncommitted ? "yes" : "no"}`);
  output.info(`Unpushed commits: ${state.hasUnpushed ? "yes" : "no"}`);
  output.info(`Current-branch PR: ${state.currentBranchPr?.number ?? "none detected"}`);

  if (isDefaultBranch(state.branch, defaultBranch)) {
    throw new PublishError(
      "UNSAFE_BRANCH_STATE",
      `PR-only publishing from ${state.branch} is blocked. Create or switch to a feature branch first.`,
    );
  }
  if (!state.defaultFresh) {
    throw new PublishError(
      "UNSAFE_BRANCH_STATE",
      `Current HEAD does not include origin/${defaultBranch}. Rebase or update the feature branch before publishing.`,
    );
  }
  if (!state.ghReady) {
    throw new PublishError(
      "GH_AUTH_FAILED",
      "GitHub CLI authentication is required before push or pull request actions.",
    );
  }

  const openBranchPrs = await gh.listPullRequests(state.repo, [
    "--state",
    "open",
    "--head",
    state.branch,
    "--limit",
    "1",
  ]);
  const existingPr = openBranchPrs[0]
    ? await gh.viewPullRequest(state.repo, openBranchPrs[0].number)
    : null;
  const defaultRangeCommits = await git.logRange(`origin/${defaultBranch}..HEAD`);
  if (!state.hasUncommitted && !defaultRangeCommits && !existingPr) {
    output.success("Nothing to publish.");
    return { status: "noop" };
  }

  let commitMessage = options.commitMessage;
  if (state.hasUncommitted && !commitMessage) {
    commitMessage = await prompts.ask("Enter commit message: ");
    if (!commitMessage.trim()) {
      throw new PublishError("INVALID_ARGUMENT", "Commit message is required.");
    }
  }
  if (!commitMessage && (state.hasUnpushed || defaultRangeCommits)) {
    commitMessage = await git.latestSubject();
  }

  renderScopeSummary(state.scope, output, {
    showDiff: options.showDiff,
    heading: "Preliminary scope summary",
  });
  const confirmed = await collectExactPublishScope({
    git,
    state,
    output,
    showDiff: options.showDiff,
  });
  await assertHeadFingerprint(
    git,
    confirmed.head,
    "Branch history changed during scope verification. No files were pushed. Re-run the command.",
  );
  await assertSecretSafePublishScope({
    git,
    state,
    confirmed,
    output,
  });

  let expectedPushHead = confirmed.head;
  if (state.hasUncommitted) {
    expectedPushHead = await commitConfirmedScope({
      git,
      state,
      confirmed,
      commitMessage,
      stagedDriftMessage:
        "Staged scope changed after verification. No files were pushed. Re-run the command.",
      headDriftMessage:
        "Branch history changed after scope verification. No files were pushed. Re-run the command.",
    });
  }
  await assertHeadFingerprint(
    git,
    expectedPushHead,
    "Branch history changed after scope verification. Do not push; re-run the command.",
  );

  await git.push(state.branch);
  const headSha = expectedPushHead.head;
  const body = prOnlyPublishRecord({ headSha, defaultBranch });
  let pr;
  let action;

  if (existingPr) {
    let updated = state.hasUncommitted || state.hasUnpushed;
    if (updated) {
      await gh.commentPullRequest(state.repo, existingPr.number, body);
    }
    if (options.prTitleExplicit && options.prTitle !== existingPr.title) {
      await gh.updatePullRequestTitle(state.repo, existingPr.number, options.prTitle);
      updated = true;
    }
    pr = await gh.viewPullRequest(state.repo, existingPr.number);
    action = updated ? "updated" : "unchanged";
  } else {
    const title = options.prTitle || commitMessage || (await git.latestSubject());
    await gh.createPullRequest(state.repo, {
      base: defaultBranch,
      head: state.branch,
      title,
      body,
    });
    pr = await gh.viewPullRequest(state.repo, state.branch);
    action = "created";
  }

  const report = {
    prNumber: pr.number,
    prUrl: pr.url,
    prChangesUrl: `${pr.url}/files`,
    branch: state.branch,
    action,
  };
  renderPrOnlyReport(output, report);
  return { status: "published", report };
}
