import { commandFailure } from "./errors.mjs";

export function createGitClient(commandRunner, cwd) {
  const run = (args, options = {}) => commandRunner.run("git", args, { cwd, ...options });
  const required = async (args, context) => {
    const result = await run(args);
    if (!result.ok) throw commandFailure(context, result);
    return result.stdout.trim();
  };
  const requiredRaw = async (args, context) => {
    const result = await run(args);
    if (!result.ok) throw commandFailure(context, result);
    return result.stdout;
  };

  return {
    run,
    required,
    repoRoot: () =>
      required(["rev-parse", "--show-toplevel"], "Could not determine repository root"),
    branch: () =>
      required(["rev-parse", "--abbrev-ref", "HEAD"], "Could not determine current branch"),
    head: () => required(["rev-parse", "HEAD"], "Could not determine HEAD"),
    tree: (ref) => required(["rev-parse", `${ref}^{tree}`], `Could not determine tree for ${ref}`),
    parent: (ref) => required(["rev-parse", `${ref}^`], `Could not determine parent for ${ref}`),
    status: () => required(["status", "--porcelain"], "Could not inspect worktree"),
    statusZ: () =>
      requiredRaw(
        ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
        "Could not inspect worktree",
      ),
    origin: () => required(["remote", "get-url", "origin"], "Remote 'origin' is required"),
    fetchDefault: (branch) =>
      required(["fetch", "origin", branch], `Could not fetch origin/${branch}`),
    upstream: async (branch) => {
      const result = await run([
        "rev-parse",
        "--abbrev-ref",
        "--symbolic-full-name",
        `${branch}@{upstream}`,
      ]);
      return result.ok ? result.stdout.trim() : "";
    },
    verifyRef: async (ref) => (await run(["rev-parse", "--verify", ref])).ok,
    logRange: (range, format = "--oneline") =>
      required(["log", format, range], "Could not inspect commits"),
    latestSubject: () =>
      required(["log", "-1", "--format=%s"], "Could not read latest commit subject"),
    diff: (args) => required(["--no-pager", "diff", ...args], "Could not inspect diff"),
    untracked: () =>
      required(["ls-files", "--others", "--exclude-standard"], "Could not inspect untracked files"),
    hashFiles: (paths) =>
      required(
        ["hash-object", "--no-filters", "--", ...paths],
        "Could not fingerprint untracked files",
      ),
    includesDefault: async (defaultRef) =>
      (await run(["merge-base", "--is-ancestor", defaultRef, "HEAD"])).ok,
    addPaths: (paths) =>
      required(["add", "-A", "--", ...paths], "Could not stage confirmed changes"),
    writeTree: () => required(["write-tree"], "Could not fingerprint staged changes"),
    commit: (message) => required(["commit", "-m", message], "Could not create commit"),
    switchCreate: (branch) =>
      required(["switch", "-c", branch], `Could not create branch ${branch}`),
    switchBranch: (branch) => required(["switch", branch], `Could not switch to ${branch}`),
    push: (branch) => required(["push", "-u", "origin", branch], `Could not push ${branch}`),
    pullFastForward: (branch) =>
      required(["pull", "--ff-only", "origin", branch], `Could not fast-forward ${branch}`),
    createBackup: (branch) =>
      required(["branch", branch], `Could not create backup branch ${branch}`),
    resetHard: (ref) => required(["reset", "--hard", ref], `Could not reset to ${ref}`),
    canFastForwardTo: async (ref) => (await run(["merge-base", "--is-ancestor", "HEAD", ref])).ok,
  };
}
