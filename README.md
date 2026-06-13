# agent-project-foundation-kit

Source repository for the Codex Project Foundation Kit.

## Local Commands

This repository uses a private, dependency-free `package.json` as a short command façade:

```bash
pnpm publish:local
pnpm publish:local "Commit message"
pnpm publish:local "Commit message" "PR title"
pnpm apply-theme <zip-path-or-file-name> "Commit message"
pnpm test:install
pnpm test:publish
pnpm check
```

`publish:local` is a source-repository compatibility command. Its thin wrapper delegates to the
same installable implementation shipped in `kit/scripts/publish-changes.sh`.

The publish workflow always uses a feature branch and pull request. It never pushes directly to
`main`. At startup it checks default-branch freshness, lists repository-level open PRs, detects
the current-branch PR, and inspects uncommitted changes and unpushed commits.

The command asks for a commit message only when uncommitted changes need a commit. If the branch
already has unpushed commits, it uses the latest commit subject as the default PR title. A second
argument can override the PR title.

Before update classification, the workflow stages uncommitted changes, displays the complete
relevant scope, and requires scope confirmation. It then shows recommended update type, commit
message, and PR title, followed by a numbered Small safe / Normal / Significant selection.
Validation is recorded with structured codes based on update classification. `SMALL_SAFE`
automatically enables squash auto-merge only after scope confirmation, verifies the remote merge,
and refreshes local `main`. `NORMAL` and `SIGNIFICANT` continue to offer PR-only, squash
auto-merge, or immediate squash merge modes with explicit review gates.

If a previously timed-out PR merges later, rerunning from its clean feature branch detects the
verified merge and offers a safe refresh of local `main`.

### GitHub Settings for SMALL_SAFE Auto-Merge

Configure the repository before using the automatic `SMALL_SAFE` path:

1. Under **Settings > General > Pull Requests**, enable **Allow squash merging**.
2. Under **Settings > General > Pull Requests**, enable **Allow auto-merge**.
3. Protect the default branch with a branch ruleset that requires changes through a pull request
   and permits squash as a merge method.
4. Required approvals and status checks are optional for this local workflow. If configured,
   GitHub must report them satisfied before auto-merge completes.
5. Authenticate GitHub CLI with permission to push branches, create pull requests, and merge them.

The script never bypasses repository rules. It reports GitHub CLI stderr and does not refresh
local `main` until GitHub confirms that the pull request was merged.

## Installed Publish Command

The installer copies the reusable publish implementation and helper to:

```txt
.codex/scripts/publish-changes.sh
.codex/scripts/lib/workflow-common.sh
```

Run it directly from a downstream project:

```bash
bash .codex/scripts/publish-changes.sh
bash .codex/scripts/publish-changes.sh "Commit message" "PR title"
```

The installer does not create or modify a downstream `package.json`. A project that wants a short
command may add its own optional alias:

```json
{
  "scripts": {
    "publish:local": "bash .codex/scripts/publish-changes.sh"
  }
}
```

Reusable settings for downstream repositories are provided under:

```txt
kit/github-settings/
```

The installer maps them to `.codex/github-settings/` as copied-only artifacts; it does not apply
repository settings. The package contains an importable default-branch ruleset, a minimal General
settings REST payload, and an apply/verification checklist.

## Publish Smoke Test

The automated publish tests use fake `git` and `gh` commands and do not access GitHub. Before
relying on changed `gh` behavior, use a disposable low-risk branch and verify:

1. PR creation and existing-PR publish-record comments.
2. Required-check reporting for no checks, passing, pending, failing, and GitHub CLI error cases.
3. Squash auto-merge and immediate squash merge confirmation wording.
4. Default-branch refresh only after GitHub reports the PR as merged.
5. Diverged-main recovery creates a backup branch and requires `RESET_MAIN_TO_ORIGIN`.
