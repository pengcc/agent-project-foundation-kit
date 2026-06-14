# agent-project-foundation-kit

Source repository for the Codex Project Foundation Kit.

## Local Commands

This repository uses a private `package.json` as a short command façade:

```bash
pnpm publish:local
pnpm publish:local "Commit message"
pnpm publish:local "Commit message" "PR title"
pnpm publish:node "Commit message" "PR title"
pnpm publish:bash "Commit message" "PR title"
pnpm apply-theme <zip-path-or-file-name> "Commit message"
pnpm test:install
pnpm test:publish
pnpm check
```

`publish:local` and `publish:node` run the Node.js 24+ ESM publish CLI. `publish:bash` retains the
Bash implementation as an explicit fallback. `pnpm check` validates both publish paths, installer
behavior, and remaining shell syntax.

Both publish implementations use a feature branch and pull request. They never push directly to
`main`. At startup they check default-branch freshness, list repository-level open PRs, detect the
current-branch PR, and inspect uncommitted changes and unpushed commits.

The command asks for a commit message only when uncommitted changes need a commit. If the branch
already has unpushed commits, it uses the latest commit subject as the default PR title. A second
argument can override the PR title.

The Bash fallback retains its established scope-first interaction. The Node default displays a
concise preliminary scope and recommendations, asks for the update type, verifies the worktree has
not changed, stages only the observed path set, displays the exact upstream-relative publish scope
including prior unpushed commits, and then requires scope confirmation. It verifies the confirmed
index tree again before commit.

Validation is recorded with structured codes based on update classification.
`SMALL_SAFE_SCOPE_CONFIRMED` is valid only for Small safe. Normal and Significant require
structured validation, and external policy cannot remove Significant review or typed merge gates.

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
.codex/scripts/publish-changes.mjs
.codex/scripts/publish-changes/
.codex/scripts/shared/
.codex/config/publish-changes-policy.yml
.codex/scripts/lib/workflow-common.sh
```

Use the installed Node CLI directly when Node.js 24 or newer is available:

```bash
node .codex/scripts/publish-changes.mjs --help
node .codex/scripts/publish-changes.mjs "Commit message" "PR title"
```

The installed Bash implementation remains a supported fallback:

```bash
bash .codex/scripts/publish-changes.sh
bash .codex/scripts/publish-changes.sh "Commit message" "PR title"
```

The source repository uses package-managed `yaml` for policy loading. The installer does not
create or modify a downstream `package.json`; if `yaml` is unavailable downstream, the Node CLI
ignores the external YAML file, warns clearly, and uses built-in conservative defaults.

A project that wants a short Bash fallback alias may add its own optional configuration:

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
