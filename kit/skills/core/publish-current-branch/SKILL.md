# Publish Current Branch Skill

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
- current branch is main/master
- dirty working tree
- no local commit
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

pause by default.

Do not push directly to main/master.

v0.1 `publish-current-branch` assumes:

```txt
feature branch -> push -> PR -> merge
```

If the user wants a direct main push, require explicit confirmation and project policy support.

Prefer recommending a feature branch and PR workflow.

## Working Tree Boundary

If the working tree is dirty, pause.

Do not silently include uncommitted changes in publishing.

Report:

```txt
Publish paused.
Reason: working tree is not clean.
Suggested workflow: execute-plan
```

If there are no local commits to publish, pause and report that there is nothing to publish.

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

## Merge Policy

Default behavior does not immediately merge.

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

Do not invent release notes or deployment claims.

If there is not enough context for a good PR body, create a concise factual PR body and state what was checked.

## Project Memory Interaction

Read project memory before publishing when available:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

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

When publishing finishes or pauses, output:

```txt
Publish Summary:
- Branch:
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
