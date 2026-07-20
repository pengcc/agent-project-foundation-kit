# agent-project-foundation-kit

Source repository for the Codex Project Foundation Kit.

## Skill Taxonomy

Foundation-kit skills use three conceptual categories:

- `meta`: reusable agent disciplines shared across workflows
- `core`: default-installed engineering and project workflows
- `optional`: explicitly adopted specialist capabilities outside the default install

Metadata also declares `invocation: user | model | support`, `required`, and hard `depends_on`
relationships. Physical source paths match metadata category: meta skills live under
`kit/skills/meta/`, core workflows under `kit/skills/core/`, and optional skills under
`kit/optional-skills/`. The installer copies the complete `kit/skills/` tree, so meta and core
remain default-installed. Optional skills remain excluded unless selected explicitly and install
under `.codex/skills/engineering/<name>/`. See
`kit/rules/skill-invocation-and-dependency-boundaries.md` for the canonical boundaries.

## Local Commands

This repository uses a private `package.json` as a short command façade:

```bash
pnpm publish:changes
pnpm publish:changes "Commit message"
pnpm publish:changes "Commit message" "PR title"
pnpm pr:review "Commit message" "PR title"
pnpm pr:merge 123
pnpm pr:merge 123 --yes
pnpm pr:auto-merge 123
pnpm install:node --target /path/to/project
pnpm test:install
pnpm test:publish
pnpm format
pnpm format:check
pnpm biome:fix
pnpm check
```

`publish:changes`, `pr:review`, and `pr:merge` run the maintained Node.js 24+ ESM
publish CLI. Biome 2.5.0 is a source-repository quality gate: `pnpm format` writes formatting,
`pnpm format:check` checks formatting, and `pnpm biome:fix` applies Biome safe fixes, including
formatting, safe lint fixes, and organize-imports assist fixes. `pnpm check` runs `biome check .`
before the Node publish tests, installer tests, and whitespace validation.

Biome is a source-repo quality gate for the foundation kit, not a downstream installation
requirement. Source checks cover installable files under `kit/`, including scripts later copied to
`.codex/scripts/`, before they are published or installed. The installer does not install Biome or
create Biome configuration. Its only `package.json` convenience is safely adding missing default
publish aliases without replacing conflicting values. If a downstream project has no
formatter/linter, `initialize-project-context` may recommend Biome as a manual setup task; it does
not require or install it.

`publish:changes` and `pr:review` run a lightweight local secret-safety guard against the
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
pnpm install:node --target /path/to/downstream-project --include-optional react-component-patterns
pnpm install:node --target /path/to/downstream-project --kit-profile docs
```

When using pnpm's direct script shortcut, pass installer flags directly as shown above. If using the explicit `pnpm run` form, use pnpm's separator instead: `pnpm run install:node -- --target /path/to/downstream-project`.

The installer defaults to dry-run. It reads installable content only from `kit/`
and never installs its own `scripts/install-foundation-kit.mjs` entrypoint or installer-specific
modules. It may reuse source-repository output helpers from `kit/scripts/shared/` at runtime, but
that does not make the installer part of the downstream payload.

`--kit-profile docs` selects only project templates, common workflow, docs/writing workflow, and
the complete publish package. It excludes code workflow, GitHub setup, optional skills, and
unclassified mappings. The profile is intended for writing, research, planning, business-note,
interview-preparation, and documentation projects. It cannot be combined with
`--include-optional`.

Without `--kit-profile`, the installer selects the complete current Kit payload. `--apply`
replaces selected Kit-owned targets, including root `AGENTS.md`, installed skills, rules, prompts,
scripts, configuration, GitHub settings, and selected optional packages. Differences in those
paths are ordinary update state and do not require conflict flags or per-file approval. Files no
longer present in the selected source payload are removed from the corresponding Kit-owned target
paths.

The installer stages and verifies replacements under `dev_locals/workflow-tmp/`, prepares a
verified backup of existing files inside the selected replacement boundary, and revalidates the
complete plan before the first downstream write. Backups are materialized under
`.codex/backups/install-YYYYMMDD-HHMMSS[-N]/`.

Repository-owned content is created only when missing and preserved afterward:

```txt
.codex/project-memory/
.codex/project-specific/
```

Fresh installs create `guideline.md`, `decisions.md`, `lessons-learned.md`, and the concise
`project-specific/agent-guidance.md` starter. Optional project-specific capability directories are
not created unless the repository needs them. The installer does not generate or migrate the
legacy `.codex/project/` structure.

For a valid existing downstream `package.json`, the installer may add missing default publish
aliases. `package.json` remains project-owned: the installer never creates or repairs it and
preserves same-name aliases with different values. This bounded augmentation is intentionally
separate from full Kit-owned payload replacement.

Use repeatable `--include-optional <name>` flags to select packages from
`kit/optional-skills/<name>/`. Selected packages install only under
`.codex/skills/engineering/<name>/`; they are never installed under `.codex/skills/optional/`,
`.codex/project-specific/`, or a flat `.codex/skills/<name>/` path. Repository-only capabilities
belong under `.codex/project-specific/` and are preserved across installation and update.

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

The installer does not merge or overwrite existing project memory or project-specific guidance.

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

### PR Review and Explicit Merge Commands

`pnpm pr:review` creates or updates a PR for review from the
current feature branch. It commits confirmed uncommitted changes when needed, stages only observed
paths, pushes the branch, and creates or reuses its open PR. It does not ask classification,
validation, scope-confirmation, completion-mode, or merge questions. It does not run code review,
merge, release, deploy, refresh the default branch, or finalize publication. It blocks on the
default branch instead of creating a feature branch automatically.

An existing PR keeps its title unless the optional second argument is explicitly supplied. The
result reports the PR number, PR URL, general Files changed URL, and a neutral latest-commit
review link only when the re-read PR head matches the verified pushed head. If those heads cannot
be reconciled, it reports the verified pushed SHA instead. It also prints the copyable next step
`pnpm pr:merge <pr-number>`, the branch, and whether the PR was created, updated, or
unchanged.

`pnpm pr:merge <pr-number>` merges an already-reviewed PR after reading and validating the named
PR, required checks, base branch, mergeability, and head OID. The explicit command and PR number
authorize the immediate squash-merge attempt, so this mode does not add a second confirmation
prompt. `--yes` remains accepted for compatibility. The command does not bypass repository rules
or checks. After GitHub verifies the merge, it refreshes the default branch with fast-forward-only
behavior and never hard-resets a diverged branch.

`pnpm pr:auto-merge <pr-number>` adds explicit `--auto-merge` authorization. Passed checks
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
node .codex/scripts/publish-changes.mjs --mode pr-review "Commit message" "PR title"
node .codex/scripts/publish-changes.mjs --mode pr-merge 123
node .codex/scripts/publish-changes.mjs --mode pr-merge 123 --yes
node .codex/scripts/publish-changes.mjs --mode pr-merge --auto-merge 123
```

Run these commands from the target project root. For a valid existing `package.json`, installer
dry-run reports and apply safely adds missing `publish:changes`, `pr:review`, `pr:merge`, and
`pr:auto-merge` aliases. Existing aliases with different values
are reported and preserved. The installer does not create or repair `package.json` solely for
these shortcuts.

The source repository uses package-managed `yaml` for policy loading. The installer does not add
downstream dependencies; if `yaml` is unavailable downstream, the Node CLI ignores the external
YAML file, warns clearly, and uses built-in conservative defaults.

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
3. Squash auto-merge confirmation and non-interactive immediate squash merge behavior.
4. Default-branch refresh only after GitHub reports the PR as merged.
5. Diverged-main recovery creates a backup branch and requires `RESET_MAIN_TO_ORIGIN`.
