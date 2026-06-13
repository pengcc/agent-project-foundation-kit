# AGENTS.md

This file is the stable entry point for coding agents working in this project.

Keep this file short and operational. Do not store detailed project facts here. Project-specific facts belong in `.codex/project/project-guideline.md`.

## Required Startup Context

Before any project-related planning, implementation, review, refactor, debugging, documentation, or publishing task, use the `project-memory` skill.

The `project-memory` skill is the unified entry point for reading and applying durable project memory.

It covers:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

For project-specific technology stack, package manager, runtime, scripts, testing, deployment, environment variables, and directory rules, always use `.codex/project/project-guideline.md` as the current source of truth.

## First-Run Startup Order

After installing the foundation kit or first adopting this project, use this order:

```txt
AGENTS.md
-> project-memory
-> agent-roles-and-capabilities
-> initialize-project-context
-> routed follow-up skill
```

`grill-me` is not the first startup step. Use it when goals, scope, requirements, constraints, or decision branches remain unclear after checking available project context.

## Project Root Boundary

The current project root is the default file-operation boundary.

Do not read, write, delete, move, inspect, or generate files outside the project root unless the user explicitly approves the exact path and purpose.

## Working Style

Work professionally, efficiently, and concisely.

For meaningful changes, explain the reason, relevant tradeoffs, expected impact or risk, and validation.

Prefer small, reviewable, reversible changes. Do not silently perform meaningful or risky actions.

## Agent Operating Contract

Detailed first-run, skill routing, concise output, durable memory, evidence-first research, and safety rules live in:

```txt
.codex/rules/agent-operating-contract.md
```

## Required Role Routing

For every meaningful task, state:

```txt
Role Routing:
- Workflow:
- Primary role:
- Supporting roles:
- Scope:
- Stop conditions:
```

Keep the header concise and truthful.

When switching workflow or mode, restate the role routing.

## Installed Foundation Content

Use the installed project content under:

```txt
.codex/skills/
.codex/rules/
.codex/prompts/
.codex/project/
```

Use the relevant skill before acting.

Do not bypass the required workflow when a task clearly matches an installed skill.

Use the skill routing map in `.codex/rules/agent-operating-contract.md` when the correct workflow is unclear.

## Planning Rules

Temporary plans belong in:

```txt
dev_locals/plans/
```

Plans are process documents.

They are not continuously maintained after execution and must not be treated as the current project source of truth.

If a plan produces durable project changes, summarize the resulting facts, decisions, or lessons into the project memory files under `.codex/project/` using `update-project-memory`.

## Handoff Rules

Agent handoffs belong in:

```txt
dev_locals/handoffs/
```

Handoffs are local-only context transfer documents.

If a handoff contains durable decisions, risks, or lessons, summarize them into the project memory files under `.codex/project/` using `update-project-memory`.

## Local-Only Files

The following directory is local-only and must not be committed:

```txt
dev_locals/
```

It may contain temporary plans, handoffs, scratch notes, research notes, theme zip files, and other local agent working files.

## Project Memory Rules

Current project facts belong in:

```txt
.codex/project/project-guideline.md
```

Important long-term decisions belong in:

```txt
.codex/project/project-decisions.md
```

Reusable mistakes, debugging findings, successful patterns, and lessons belong in:

```txt
.codex/project/lessons-learned.md
```

Update project memory only for durable current facts, important long-term decisions, and reusable lessons.

Do not record routine implementation details, temporary status, logs, or unverified assumptions.

After meaningful planning, implementation, debugging, review, publishing, installation, or major discussion, consider whether the `update-project-memory` workflow is needed.

## Git and Publishing Rules

Before editing for new work, check:

- current branch
- uncommitted changes
- unpushed commits
- current-branch open pull request
- repository-level open pull requests

If a non-default branch has unfinished work, pause before starting an unrelated task. Report the
pending work and ask whether to finish, merge, or switch branches. Do not mix tasks without
explicit user approval.

Start new work from an up-to-date default branch and create a feature branch unless the user explicitly approves a different workflow.

Do not push directly to the default branch.

Local commits may be part of an approved `execute-plan` workflow if the approved plan explicitly includes a commit step or the user explicitly requested commit.

Do not treat a local commit as a remote publish.

Push, pull request, merge, release, and publish actions require explicit user intent.

When work is complete and validated, use `publish-current-branch` for push / PR / merge workflows.

Do not release or deploy unless a separate workflow or explicit user instruction covers it.

## Final Report Requirements

Every implementation final report must classify the update as one of:

- `small safe update`
- `normal update`
- `significant / high-impact update`

The report must include:

- recommended update type
- recommended commit message
- recommended PR title
- changed files
- reason for the change
- impact / risk
- validation performed
- project memory or documentation updates
- whether commit, push, pull request, merge, or other external actions were performed

## Scope and Safety Rules

Prefer minimal, reversible changes.

Do not expand scope without calling it out.

Do not introduce new dependencies, tools, workflows, or architecture changes without checking project memory and explaining the impact.

Do not store secrets, tokens, private data, local databases, or environment-specific files in project memory or committed files.
