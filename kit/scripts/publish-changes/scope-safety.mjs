import { PublishError } from "../shared/errors.mjs";
import { buildScopeSummary, renderScopeSummary } from "./scope-summary.mjs";
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

export async function collectExactPublishScope({ git, state, output, showDiff = false }) {
  if (state.hasUncommitted) {
    const currentSnapshot = await captureWorktreeSnapshot(git);
    if (!worktreeSnapshotsMatch(state.worktreeSnapshot, currentSnapshot)) {
      throw new PublishError(
        "SCOPE_DRIFT",
        "Worktree changed after scope collection. No files were committed or pushed. Re-run and confirm the updated scope.",
      );
    }
    await git.addPaths(state.worktreeSnapshot.paths);
    const scope = await buildStagedScope(git, state.branch, state.compareRef, showDiff);
    renderScopeSummary(scope, output, {
      showDiff,
      heading: "Exact publish scope",
    });
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
    nameStatus: await git.diff(["--name-status", confirmedRange]),
    numstat: await git.diff(["--numstat", confirmedRange]),
    diff: showDiff ? await git.diff([confirmedRange]) : "",
  });
  renderScopeSummary(scope, output, {
    showDiff,
    heading: "Exact publish scope",
  });
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
