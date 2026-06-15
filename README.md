# agent-project-foundation-kit

Source repository for the Codex Project Foundation Kit.

## Local Commands

This repository uses a private `package.json` as a short command façade:

```bash
pnpm publish:local
pnpm publish:local "Commit message"
pnpm publish:local "Commit message" "PR title"
pnpm publish:node "Commit message" "PR title"
pnpm install:node -- --target /path/to/project
pnpm apply-theme <zip-path-or-file-name> "Commit message"
pnpm test:install
pnpm test:publish
pnpm check
```

`publish:local` and `publish:node` run the maintained Node.js 24+ ESM publish CLI. `pnpm check`
validates the Node publish and installer paths, active apply-theme Bash syntax, and whitespace.

## Installer Commands

The Node.js 24+ ESM installer is maintained source-repository tooling:

```bash
pnpm install:node -- --target /path/to/downstream-project
pnpm install:node -- --target /path/to/downstream-project --apply
```

The installer defaults to dry-run. It reads installable content only from `kit/`
and never installs its own `scripts/install-foundation-kit.mjs` entrypoint or installer-specific
modules. It may reuse source-repository output helpers from `kit/scripts/shared/` at runtime, but
that does not make the installer part of the downstream payload.

For conflicting files, Node apply requires the exact `INSTALL_WITH_BACKUP` token from interactive
or piped input. It stages and verifies all replacements and backup snapshots under
`dev_locals/workflow-tmp/` and revalidates the plan before the first downstream write. Verified
backups are materialized under `.codex/backups/install-YYYYMMDD-HHMMSS[-N]/` with a
`manifest.json`. The installer does not create or modify downstream `package.json`.

Use `--show-diff` for optional `diff -u` previews. A missing `diff` command warns but does not
block dry-run, apply authorization, backup, installation, or verification.

The Node publish implementation uses a feature branch and pull request. It never pushes directly
to `main`. At startup it checks default-branch freshness, lists repository-level open PRs, detects
the current-branch PR, and inspects uncommitted changes and unpushed commits.

The command asks for a commit message only when uncommitted changes need a commit. If the branch
already has unpushed commits, it uses the latest commit subject as the default PR title. A second
argument can override the PR title.

The Node default displays a concise preliminary scope and recommendations, asks for the update
type, verifies the worktree has not changed, stages only the observed path set, displays the exact
upstream-relative publish scope including prior unpushed commits, and then requires scope
confirmation. It verifies the confirmed index tree again before commit.

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

The installer copies the reusable Node publish implementation and helpers to:

```txt
.codex/scripts/publish-changes.mjs
.codex/scripts/publish-changes/
.codex/scripts/shared/
.codex/config/publish-changes-policy.yml
.codex/config/publish-cli-theme.json
```

Use the installed Node CLI directly when Node.js 24 or newer is available:

```bash
node .codex/scripts/publish-changes.mjs --help
node .codex/scripts/publish-changes.mjs "Commit message" "PR title"
```

The source repository uses package-managed `yaml` for policy loading. The installer does not
create or modify a downstream `package.json`; if `yaml` is unavailable downstream, the Node CLI
ignores the external YAML file, warns clearly, and uses built-in conservative defaults.

`kit/config/publish-cli-theme.json` is the source of truth for publish CLI level colors and
label-only versus full-line rendering. Installed projects receive the same file at
`.codex/config/publish-cli-theme.json`. Theme styles support ANSI color strings such as `"96"` and
RGB arrays such as `[243, 156, 18]`; hex strings are not supported. Every `[LEVEL]` label is always
bold, so label bold is intentionally not configurable. Missing or invalid theme config produces a
warning and activates matching built-in defaults. Documentation should reference the config
rather than duplicating its complete color table.

Historical Bash publish and installer snapshots are retained under
`archive/legacy-bash-workflows/` for source-only reference. They are unsupported, are outside
`kit/`, and are never installed downstream. Existing downstream projects may still contain Bash
files installed by older kit versions; this installer does not automatically delete them.

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
