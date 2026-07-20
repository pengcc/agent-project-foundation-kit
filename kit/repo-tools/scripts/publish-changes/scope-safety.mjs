import { PublishError } from "../shared/errors.mjs";
import { buildScopeSummary, compareScopeSummaries, renderScopeSummary } from "./scope-summary.mjs";
import { buildStagedScope, captureWorktreeSnapshot, worktreeSnapshotsMatch } from "./state.mjs";

export async function captureHeadFingerprint(git) {
  const head = await git.head();
  return { head, tree: await git.tree(head) };
}

export async function assertHeadFingerprint(git, expected, message) {
  const current = await captureHeadFingerprint(git);
  if (current.head !== expected.head || current.tree !== expected.tree) {
    throw new PublishError("SCOPE_DRIFT", message);
  }
}

function renderUntrackedLineContributions(output, contributions, sampleLimit = 3) {
  if (!contributions.length) return;
  if (contributions.length === 1) {
    const [entry] = contributions;
    output.info(
      `Exact scope includes staged untracked file content: +${entry.added}/-${entry.deleted} from ${entry.path}.`,
    );
    return;
  }

  const total = contributions.reduce(
    (summary, entry) => ({
      added: summary.added + entry.added,
      deleted: summary.deleted + entry.deleted,
    }),
    { added: 0, deleted: 0 },
  );
  const sample = contributions
    .slice(0, sampleLimit)
    .map((entry) => `+${entry.added}/-${entry.deleted} ${entry.path}`)
    .join("; ");
  const omitted = contributions.length - sampleLimit;
  output.info(
    `Exact scope includes staged untracked file content from ${contributions.length} files (total +${total.added}/-${total.deleted}): ${sample}${omitted > 0 ? `; ... (+${omitted} more)` : ""}.`,
  );
}

function validateOrRenderExactScope({ scope, preliminaryScope, output, showDiff }) {
  if (!preliminaryScope) {
    renderScopeSummary(scope, output, {
      showDiff,
      heading: "Exact publish scope",
    });
    return;
  }

  const comparison = compareScopeSummaries(preliminaryScope, scope);
  if (!comparison.matches) {
    throw new PublishError(
      "SCOPE_DRIFT",
      [
        "Scope validation failed: exact publish scope differs from the preliminary summary.",
        "Difference summary:",
        ...comparison.differences.map((difference) => `- ${difference}`),
        "No files were committed, pushed, or published. Re-run the command and confirm the updated scope.",
      ].join("\n"),
    );
  }
  renderUntrackedLineContributions(output, comparison.untrackedLineContributions);
  output.success("Scope validation passed: exact publish scope matches preliminary summary.");
}

export async function collectExactPublishScope({
  git,
  state,
  output,
  showDiff = false,
  preliminaryScope = null,
}) {
  if (preliminaryScope) output.step("Exact publish scope validation");
  if (state.hasUncommitted) {
    const currentSnapshot = await captureWorktreeSnapshot(git);
    if (!worktreeSnapshotsMatch(state.worktreeSnapshot, currentSnapshot)) {
      throw new PublishError(
        "SCOPE_DRIFT",
        "Worktree changed after scope collection. No files were committed or pushed. Re-run and confirm the updated scope.",
      );
    }
    if (state.worktreeSnapshot.stagePaths.length) {
      await git.addPaths(state.worktreeSnapshot.stagePaths);
    }
    const scope = await buildStagedScope(git, state.branch, state.compareRef, showDiff);
    validateOrRenderExactScope({ scope, preliminaryScope, output, showDiff });
    return {
      scope,
      indexTree: await git.writeTree(),
      head: await captureHeadFingerprint(git),
    };
  }

  const head = await captureHeadFingerprint(git);
  const confirmedRange = `${state.compareRef}...${head.head}`;
  const scope = buildScopeSummary({
    branch: state.branch,
    nameStatus: await git.diff(["--name-status", "--no-renames", confirmedRange]),
    numstat: await git.diff(["--numstat", "--no-renames", confirmedRange]),
    diff: showDiff ? await git.diff([confirmedRange]) : "",
  });
  validateOrRenderExactScope({ scope, preliminaryScope, output, showDiff });
  return { scope, indexTree: "", head };
}

export async function commitConfirmedScope({
  git,
  state,
  confirmed,
  commitMessage,
  stagedDriftMessage,
  headDriftMessage,
}) {
  if (!state.hasUncommitted) return confirmed.head;
  if ((await git.writeTree()) !== confirmed.indexTree) {
    throw new PublishError("SCOPE_DRIFT", stagedDriftMessage);
  }
  await assertHeadFingerprint(git, confirmed.head, headDriftMessage);
  await git.commit(commitMessage);
  const committedHead = await captureHeadFingerprint(git);
  if (
    committedHead.tree !== confirmed.indexTree ||
    (await git.parent(committedHead.head)) !== confirmed.head.head
  ) {
    throw new PublishError(
      "SCOPE_DRIFT",
      "Created commit does not match the confirmed scope. Do not push; re-run and confirm the updated scope.",
    );
  }
  return committedHead;
}
