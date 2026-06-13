# AGENTS.md

## Repository Purpose

This repository is the source repository for developing the Codex Project Foundation Kit.

The goal is to make the kit mature, directly usable, safe, and maintainable for downstream software projects. Work in this repository should improve the kit's skills, rules, prompts, scripts, templates, documentation, and project memory.

## Source of Truth

This repository develops the kit; it is not a downstream project with the kit installed.

- `kit/` is the installable payload source of truth.
- `.codex/project/` is this repository's own development memory.
- `kit/project-templates/AGENTS.md` is the downstream project template, not this repository's root AGENTS file.
- Do not assume `.codex/skills/` exists or that the kit has been installed into this repository.

Use these source files as the intended installed behavior:

- `kit/skills/core/*/SKILL.md`
- `kit/skills/core/*/metadata.yml`
- `kit/rules/*`
- `kit/prompts/*`
- `kit/project-templates/*`

## Working Style

Work professionally, efficiently, and concisely.

For meaningful changes, explain:

- why the change is needed
- the tradeoffs or alternatives considered
- the expected impact and risk
- how the change should be validated

Do not silently perform meaningful or risky actions. Prefer small, reviewable, reversible changes.

## Required Role Routing

For every meaningful task, state the active workflow, primary role, supporting roles, scope, and stop conditions.

When switching workflow or mode, restate the role routing.

Use the relevant kit source skills as workflow guidance. Commonly relevant skills include:

- `agent-roles-and-capabilities`
- `initialize-project-context`
- `grill-me`
- `plan-with-context`
- `execute-plan`
- `code-review`
- `write-a-skill`
- `handoff`
- `update-project-memory`

## Basic Branch Workflow

Before editing files:

1. Check the current branch, uncommitted changes, unpushed commits, the current-branch PR, and
   repository-level open PRs.
2. If a non-default branch has unfinished work, stop before starting an unrelated task and ask
   whether to finish, merge, or switch branches.
3. Start new work from an up-to-date `main`.
4. Create a new feature branch.
5. Make updates on the feature branch.

Do not work directly on `main` except for reading or explicitly approved maintenance.

Do not push directly to `main`.

When ready to publish local changes, normally use:

```bash
pnpm publish:local "Commit message"
```

## Final Report Requirement

Every implementation final report must classify the update as one of:

- `small safe update`
- `normal update`
- `significant / high-impact update`

The final report must include:

- recommended update type
- recommended commit message
- recommended PR title
- files changed
- why the change was made
- impact / risk level
- validation performed
- whether project memory or docs were updated
- whether commit, push, PR, merge, or other external actions were performed

## Project Memory

Use `.codex/project/` as this repository's durable development memory.

Update project memory when durable facts, long-term decisions, or reusable lessons change. Do not write foundation-kit-specific development history into installable downstream templates unless it has been deliberately distilled into generic reusable guidance.
