# Publish Current Branch Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Publish Manager
- Supporting roles: none by default
- Workflow: publish-current-branch
- Maturity expectation: cautious delivery judgment
- Technical specialist skill: not applicable
- Quality rule: not applicable unless code changes are proposed
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.


Use this skill to publish the current completed and validated branch into the GitHub PR workflow.

This skill does not implement features and does not execute plans.

## Role

When using this skill, act as:

```txt
Publish Manager
```

The Publish Manager checks the current branch state, pushes the branch when safe, creates or updates a pull request, prepares merge or auto-merge only when allowed, and reports publish status.

## When to Use

Use this skill when the user explicitly requests:

```txt
publish-current-branch
```

or:

```txt
Use publish-current-branch.
```

Also use it when the user says:

- Push this branch
- Create a PR
- Publish current branch
- Prepare this branch for merge
- Push and create PR

## When Not to Use

Do not use this skill to:

- Implement features
- Execute a plan
- Modify business code
- Create unplanned implementation commits
- Release
- Deploy
- Bypass branch protection
- Force push to main
- Configure GitHub repo settings
- Perform project setup checks

Use `execute-plan` for approved local implementation work.

Use `initialize-project-context` or a future setup workflow for repo-level setup checks.

Use a future release/deployment workflow for release or deployment.

## Core Boundary

```txt
execute-plan = local implementation and validation, optionally local commit
publish-current-branch = push current branch + create/update PR + prepare merge or auto-merge
release/deploy = future workflow, not v0.1 publish-current-branch
```

`publish-current-branch` must not modify source code as part of publishing.

If new implementation work is needed, stop and recommend `execute-plan`.

## Mechanical Executor

Use the installed Node.js 24+ CLI as the maintained mechanical executor:

```bash
node .codex/scripts/publish-changes.mjs
node .codex/scripts/publish-changes.mjs "Commit message"
node .codex/scripts/publish-changes.mjs "Commit message" "PR title"
node .codex/scripts/publish-changes.mjs --mode pr-only "Commit message" "PR title"
node .codex/scripts/publish-changes.mjs --mode merge-pr 123
node .codex/scripts/publish-changes.mjs --mode merge-pr 123 --yes
node .codex/scripts/publish-changes.mjs --mode merge-pr --auto-merge 123
```

The skill remains responsible for publish judgment, role routing, scope, authorization, and final
reporting. The script owns repeatable Git and GitHub mechanics, including state-aware startup,
feature-branch creation, commit-message prompting when needed, PR creation or update, classified
merge handling, required-check inspection, and verified default-branch refresh.

Use `--mode pr-only` for a quick create-or-update PR operation that must not classify, validate,
merge, or refresh the default branch. It requires an existing feature branch, stages only the
observed paths, stops on drift, preserves an existing PR title unless an explicit second argument
is supplied, and never creates a second open PR for the same branch.

Use `--mode merge-pr <pr-number>` only when the user explicitly requests merging that PR. The mode
requires a clean worktree, displays and revalidates PR metadata, blocks failing or unknown required
checks, squash-merges with expected-head protection, verifies a completed merge, and refreshes the
default branch with fast-forward-only behavior. Pending checks block with wait/rerun guidance
unless the user explicitly supplies `--auto-merge`; that option requests PR-level squash
auto-merge and leaves the local branch unchanged while the PR remains open. `--yes` skips only its
human confirmation. Neither option bypasses repository rules, checks, reviews, mergeability, or
head verification.

Agents should prefer invoking the installed script instead of reproducing its Git and GitHub
command sequence. Users may also run the same command directly.

The installer copies the script into `.codex/scripts/`; it does not add or modify a downstream
`package.json`. Projects may manually add their own short command aliases, including an auto-merge
alias, if desired.

If downstream `yaml` support is absent, the Node CLI must warn and use built-in conservative
policy defaults rather than depending on an uninstalled package.

The Node CLI loads output styles from `.codex/config/publish-cli-theme.json`. Level entries support
ANSI color strings or RGB arrays plus `fullLine`; all `[LEVEL]` labels remain bold by fixed
rendering policy. Missing or invalid theme config warns and uses matching built-in defaults.

If the Node runtime or installed script is unavailable, use the manual workflow in this skill.
Archived Bash scripts are historical reference, not an operational fallback. Do not weaken any
confirmation, branch, check, review, merge, or refresh boundary in the manual path.

Do not install, upgrade, relink, or configure Node, package managers, mise, shell profiles, PATH,
or other global tooling to make publishing available. Report the detected and required runtime,
the failing command, and the project-local alternative. Wait for explicit user approval before
any global or out-of-project mutation.

## Supported Triggers

The short command is enough:

```txt
publish-current-branch
```

or:

```txt
Use publish-current-branch.
```

A safer full prompt is:

```txt
Use publish-current-branch.

Push current branch, create PR, and prepare for merge according to project workflow.
Do not release or deploy.
```

## Required Workflow Header

Before performing publish actions, output:

```txt
Workflow:
- Role: Publish Manager
- Skill: publish-current-branch
- Context: current branch + git status + remote + GitHub PR state
- Mode: publish current branch
```

Then restate:

```txt
Publishing scope:
- push current branch
- create/update PR
- prepare merge or auto-merge if supported and authorized

Out of scope:
- release
- deploy
- force push to main
- bypass branch protection
- implementation changes

Stop conditions:
- direct publishing from main/master without feature-branch creation
- uncommitted scope that has not been displayed and explicitly confirmed
- no uncommitted changes or local commits to publish
- missing remote origin
- missing GitHub auth
- GitHub repo or PR state unclear
- repo-level settings unknown when auto-merge is requested
```

## Preflight Check

Before pushing or creating a PR, perform a lightweight runtime preflight.

Check:

- Current branch name
- Whether current branch is `main` or `master`
- Whether working tree is clean
- Whether local commits exist
- Whether remote `origin` exists
- Whether upstream is configured
- Whether GitHub CLI is available if PR work is required
- Whether GitHub CLI is authenticated
- Whether current repo is recognized by GitHub CLI
- Whether a PR already exists for the current branch

Do not run a full repo settings audit every time.

Repo-level settings readiness belongs to project initialization / setup.

## Main Branch Boundary

If the current branch is:

```txt
main
master
```

do not push it directly.

Do not push directly to main/master.

The installed publish script may start on the default branch when local changes need publishing.
It must create a feature branch before committing or pushing.

The manual fallback assumes:

```txt
feature branch -> push -> PR -> merge
```

If the user wants a direct main push, require explicit confirmation and project policy support.

Prefer recommending a feature branch and PR workflow.

## Working Tree Boundary

When the installed publish script is available, a dirty working tree is allowed only as the
explicit scope being published. The script must stage and display the complete scope, require
scope confirmation, create or use a feature branch, and prompt for a commit message only when a
new commit is needed.

Do not silently include uncommitted changes.

When using the manual fallback, pause on a dirty working tree and report:

```txt
Publish paused.
Reason: working tree is not clean.
Suggested workflow: execute-plan
```

If there are neither uncommitted changes nor local commits to publish, pause and report that there
is nothing to publish.

## GitHub Repo Settings Boundary

`publish-current-branch` does not perform full GitHub repo settings setup.

Repo-level settings such as these belong to project setup / initialization:

- GitHub repo creation
- Remote origin configuration
- Ruleset import
- Branch protection
- Required checks
- Auto-merge enablement
- Repository permissions
- Main branch protection policy

These should be recorded in project memory by a setup workflow such as `initialize-project-context`.

`publish-current-branch` reads project memory for known GitHub workflow readiness.

If project memory says settings are unknown, do not deep-audit them during publish.

Default to create/update PR only and recommend setup check.

## Auto-Merge Policy

`publish-current-branch` may prepare auto-merge only when:

- User explicitly requests it, or project memory records that auto-merge is the project convention
- GitHub CLI is available and authenticated
- The PR exists
- Repo settings are known to support auto-merge
- Branch protection/ruleset does not block it
- Required checks can be waited on or are expected
- User did not request PR-only mode

If auto-merge support is unclear, do not attempt to enable it.

Report:

```txt
Auto-merge support is unknown.
Action: PR created/updated only.
Recommended next workflow: initialize-project-context or GitHub setup check.
```

Never bypass branch protection, checks, reviews, or rulesets.

Repository-level **Allow auto-merge** only permits the feature. Each PR still needs auto-merge
enabled explicitly. The equivalent GitHub CLI operation is
`gh pr merge <PR_NUMBER> --auto --squash`; it waits for required checks and reviews rather than
bypassing them.

## Merge Policy

Default behavior does not immediately merge.

The installed script's `SMALL_SAFE` selection is an exception only after it displays the complete
scope and the user confirms that scope. That selection authorizes its bounded squash auto-merge
and verified default-branch refresh flow. `NORMAL` and `SIGNIFICANT` keep their explicit completion
mode and typed review boundaries.

Allowed default actions:

- Push current branch
- Create or update PR
- Prepare auto-merge only if authorized and supported

Immediate merge requires explicit user authorization and must respect branch protection, checks, reviews, and rulesets.

If merge or auto-merge conditions are not met, report the PR URL, blockers, and next steps.

## PR Creation and Update

If no PR exists, create one.

If a PR already exists, update it when useful.

PR title and body should be based on:

- Current branch
- Recent commit message(s)
- Approved plan or execution summary if available
- Project conventions from project memory

Before publishing, state the recommended update type, commit message, and PR title. Treat these as
recommendations: the user may override them before commit or PR creation.

Do not invent release notes or deployment claims.

If there is not enough context for a good PR body, create a concise factual PR body and state what was checked.

## Project Memory Interaction

Before publishing, pass the Project Memory Context Gate defined in the `project-memory` skill and
include its report in the publish context. Do not redefine the gate sequence or status meanings
here.

Use project memory to understand:

- Default branch
- PR workflow
- Direct push policy
- Auto-merge convention
- Known GitHub setup status
- Required validation before publish
- Whether release/deploy is separate

If GitHub workflow readiness changes or is discovered during publishing, recommend `update-project-memory`.

Do not update project memory directly.

## Publish Summary

Use the Report Depth Levels from `agent-operating-contract`. Publish summaries should stay
Standard and factual unless blockers, unknown GitHub state, or high-risk publishing conditions
require more detail.

When publishing finishes or pauses, output:

```txt
Publish Summary:
- Branch:
- Recommended update type:
- Recommended commit message:
- Recommended PR title:
- Remote:
- Working tree:
- Local commit:
- Push:
- PR:
- Auto-merge:
- Merge:
- Checks:
- Blockers:
- Project memory update check:
- External / global actions:
- Recommended next workflow:
```

Rules:

- Include PR URL when available
- Explain skipped, unknown, failed, or blocked states
- If GitHub repo settings are unknown, recommend `initialize-project-context` or setup check
- If publish succeeds but durable GitHub workflow readiness changed, recommend `update-project-memory`
- If implementation work is still needed, recommend `execute-plan`
- Do not recommend release/deploy unless explicitly requested and a workflow exists

## Output Expectations

Keep publish output practical and factual.

Always make clear:

- What branch was published
- Whether push happened
- Whether PR was created or updated
- Whether auto-merge was enabled, skipped, unsupported, or unknown
- Whether merge happened or was intentionally not performed
- What blockers remain
- What the next workflow should be
