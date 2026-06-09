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

## Workflow Declaration

For explicit project workflows, start with a short workflow header:

```txt
Workflow:
- Role:
- Skill:
- Context:
- Mode:
```

Keep the header concise and truthful.

If required context is missing, state it as `missing`.

## Skills Location

Installed skills live under:

```txt
.codex/skills/
```

Use the relevant skill before acting.

Do not bypass the required workflow when a task clearly matches an installed skill.

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

Reusable mistakes, debugging findings, and lessons belong in:

```txt
.codex/project/lessons-learned.md
```

Major changes must trigger consideration of the `update-project-memory` workflow.

## Git and Publishing Rules

Local commits may be part of an approved `execute-plan` workflow if the approved plan explicitly includes a commit step or the user explicitly requested commit.

Do not treat a local commit as a remote publish.

Push, pull request, merge, release, and publish actions require explicit user intent.

Use `publish-current-branch` for push / PR / merge workflows.

Do not release or deploy unless a separate workflow or explicit user instruction covers it.

## Scope and Safety Rules

Prefer minimal, reversible changes.

Do not expand scope without calling it out.

Do not introduce new dependencies, tools, workflows, or architecture changes without checking project memory and explaining the impact.

Do not store secrets, tokens, private data, local databases, or environment-specific files in project memory or committed files.
