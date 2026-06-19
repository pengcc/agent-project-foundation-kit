# agent-project-foundation-kit

Source repository for the Codex Project Foundation Kit.

## Skill Taxonomy

Foundation-kit skills use three conceptual categories:

- `meta`: reusable agent disciplines shared across workflows
- `core`: default-installed engineering and project workflows
- `optional`: explicitly adopted specialist capabilities outside the default install

Metadata also declares `invocation: user | model | support`, `required`, and hard `depends_on`
relationships. Category does not imply a physical directory: meta candidates remain under
`kit/skills/core/` until a separately approved migration reviews installer and downstream mapping
impact. Meta and core remain default-installed; optional skills remain explicit-adoption only. See
`kit/rules/skill-invocation-and-dependency-boundaries.md` for the canonical boundaries.

## Local Commands

This repository uses a private `package.json` as a short command façade:

```bash
pnpm publish:changes
pnpm publish:changes "Commit message"
pnpm publish:changes "Commit message" "PR title"
pnpm publish:pr-only "Commit message" "PR title"
pnpm publish:merge-pr 123
pnpm publish:merge-pr 123 --yes
pnpm publish:merge-pr:auto 123
pnpm install:node --target /path/to/project
pnpm test:install
pnpm test:publish
pnpm format
pnpm format:check
pnpm biome:fix
pnpm check
```

`publish:changes`, `publish:pr-only`, and `publish:merge-pr` run the maintained Node.js 24+ ESM
publish CLI. Biome 2.5.0 is a source-repository quality gate: `pnpm format` writes formatting,
`pnpm format:check` checks formatting, and `pnpm biome:fix` applies Biome safe fixes, including
formatting, safe lint fixes, and organize-imports assist fixes. `pnpm check` runs `biome check .`
before the Node publish tests, installer tests, and whitespace validation.

Biome is a source-repo quality gate for the foundation kit, not a downstream installation
requirement. Source checks cover installable files under `kit/`, including scripts later copied to
`.codex/scripts/`, before they are published or installed. The installer does not install Biome,
create Biome configuration, or modify target `package.json`. If a downstream project has no
formatter/linter, `initialize-project-context` may recommend Biome as a manual setup task; it does
not require or install it.

`publish:changes` and `publish:pr-only` run a lightweight local secret-safety guard against the
confirmed publish scope before commit, push, or PR updates. The guard is dependency-free and
high-confidence only; it can have false positives and false negatives.
Bash apply-theme tooling is archived under `archive/legacy-bash-workflows/` as source-only
historical reference. Future apply-theme behavior should be planned as a Node.js workflow before
being reintroduced.

## Installer Commands

The Node.js 24+ ESM installer is maintained source-repository tooling:

```bash
pnpm install:node --target /path/to/downstream-project
pnpm install:node --target /path/to/downstream-project --apply
pnpm install:node --target /path/to/downstream-project --project-mode existing
```

When using pnpm's direct script shortcut, pass installer flags directly as shown above. If using the explicit `pnpm run` form, use pnpm's separator instead: `pnpm run install:node -- --target /path/to/downstream-project`.

The installer defaults to dry-run. It reads installable content only from `kit/`
and never installs its own `scripts/install-foundation-kit.mjs` entrypoint or installer-specific
modules. It may reuse source-repository output helpers from `kit/scripts/shared/` at runtime, but
that does not make the installer part of the downstream payload.

For conflicting files, Node apply requires the exact `INSTALL_WITH_BACKUP` token from interactive
or piped input. It stages and verifies all replacements and backup snapshots under
`dev_locals/workflow-tmp/` and revalidates the plan before the first downstream write. Verified
backups are materialized under `.codex/backups/install-YYYYMMDD-HHMMSS[-N]/` with a
`manifest.json`. The installer does not create or modify downstream `package.json`.

Project mode controls conflict policy without changing mappings:

- `--project-mode auto` is the default. Existing-project signals or mapped-file conflicts select
  existing-like caution; no signals and no conflicts select new-like behavior.
- `--project-mode new` treats conflicts as starter files or previous-install remnants and permits
  the existing backup-and-overwrite flow after the typed confirmation.
- `--project-mode existing` treats conflicts as important project context and blocks apply until
  they are reviewed or `--overwrite-conflicts` is explicitly supplied.

`--overwrite-conflicts` never skips conflict display, the strong warning, typed confirmation,
backup preparation, plan revalidation, or verified overwrite. It only authorizes the existing-mode
flow to reach those safeguards. Project mode never changes package files, dependencies, formatter
or linter tooling, optional-skill installation, project-memory merging, or publish behavior.

Use `--show-diff` for optional `diff -u` previews. A missing `diff` command warns but does not
block dry-run, apply authorization, backup, installation, or verification.

### After Installation or First Adoption

After a successful apply, ask the agent to run:

```txt
.codex/prompts/force-initialize-project-context.md
```

Initialization compares the product plan or roadmap, README and docs, code, configuration, tests,
Git/GitHub state, and existing project memory. An existing roadmap is input to that comparison,
not a conflicting replacement target. Do not begin feature implementation until initialization is
complete and proposed durable-memory updates have been reviewed and approved through
`update-project-memory`.

The installer does not silently merge installed templates into existing project memory. For
important conflicting context, use manual review/merge rather than authorizing overwrite.

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

The repository setting only permits PR-level auto-merge; each PR still needs auto-merge enabled.
The manual GitHub CLI equivalent is `gh pr merge <PR_NUMBER> --auto --squash`. Auto-merge waits
for required checks and reviews and never bypasses them.

### Quick PR-Only and Explicit Merge Commands

`pnpm publish:pr-only` is the non-merging path for quickly publishing review changes from the
current feature branch. It commits confirmed uncommitted changes when needed, stages only observed
paths, pushes the branch, and creates or reuses its open PR. It does not ask classification,
validation, scope-confirmation, completion-mode, or merge questions. It blocks on the default
branch instead of creating a feature branch automatically.

An existing PR keeps its title unless the optional second argument is explicitly supplied. The
result reports the PR number, PR URL, files URL, branch, and whether the PR was created, updated,
or unchanged.

`pnpm publish:merge-pr <pr-number>` reads and validates the named PR, required checks, base branch,
mergeability, and head OID before requesting one squash-merge confirmation. `--yes` skips only
that confirmation. It does not bypass repository rules or checks. After GitHub verifies the merge,
the command refreshes the default branch with fast-forward-only behavior and never hard-resets a
diverged branch.

`pnpm publish:merge-pr:auto <pr-number>` adds explicit `--auto-merge` authorization. Passed checks
still use the immediate merge path. Pending checks request PR-level squash auto-merge with
expected-head protection, then read the PR once: an open PR is reported as waiting and the local
branch remains unchanged. If GitHub rejects the request, the PR remains open and the command
reports the original error with guidance to check repository settings, permissions, and PR
eligibility. Failed or unknown checks still block.

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
node .codex/scripts/publish-changes.mjs --mode pr-only "Commit message" "PR title"
node .codex/scripts/publish-changes.mjs --mode merge-pr 123
node .codex/scripts/publish-changes.mjs --mode merge-pr 123 --yes
node .codex/scripts/publish-changes.mjs --mode merge-pr --auto-merge 123
```

Run these commands from the target project root. Existing projects may add equivalent
`package.json` aliases manually when they fit local package-manager and script conventions. The
installer does not add aliases and does not create a `package.json` solely for shortcuts.
An optional downstream alias equivalent to `publish:merge-pr:auto` is manual setup only.

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

Historical Bash publish, installer, and apply-theme snapshots are retained under
`archive/legacy-bash-workflows/` for source-only reference. They are unsupported, are outside
`kit/`, and are never installed downstream. Existing downstream projects may still contain Bash
files installed by older kit versions; this installer does not automatically delete them. Future
apply-theme behavior should be planned as a Node.js workflow before being reintroduced.

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
