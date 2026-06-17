# AGENTS.md

This file is the stable entry point for coding agents working in this project.

Keep this file short and operational. Do not store detailed project facts here. Project-specific facts belong in `.codex/project/project-guideline.md`.

## Required Startup Context

Before any project-related planning, implementation, review, refactor, debugging, documentation,
or publishing task, pass the Project Memory Context Gate defined in the installed
`project-memory` skill. Report the gate result before context-dependent output or mutation.

The `project-memory` skill is the unified entry point for reading and applying durable project memory.

It covers:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

For project-specific technology stack, package manager, runtime, scripts, testing, deployment, environment variables, and directory rules, always use `.codex/project/project-guideline.md` as the current source of truth.

Use installed skills for detailed workflow rules: `project-memory` for durable memory context,
`update-project-memory` for confirmed durable writes, `docs-first-research` for external fact
verification, and `agent-roles-and-capabilities` for role routing and missing-specialist fallback.

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

Do not write, delete, move, or generate files outside the project root unless the user explicitly
approves the exact path and purpose. Read-only global toolchain diagnostics are allowed when
needed to distinguish project-local state from machine state.

## Global Toolchain and Out-of-Project Operation Boundary

Do not install, upgrade, downgrade, unlink, relink, configure, or otherwise mutate global
developer tooling without explicit user approval. This includes Homebrew or system packages,
Node.js, pnpm, npm, corepack, mise, Volta, global package managers, global Git configuration,
shell profiles such as `.zprofile`, `.zshrc`, or `.bashrc`, PATH configuration, and files outside
the project root.

Allowed read-only diagnostics include commands such as `node -v`, `which node`, `which -a node`,
`pnpm -v`, `mise current`, `mise doctor`, `brew info`, `brew list --versions`, and inspection of
logs, PATH, shell profiles, or Git configuration without editing them.

Commands or changes such as `brew install`, `brew upgrade`, `brew reinstall`, `brew link`,
`brew unlink`, `mise use -g`, non-project/global `mise install`, `pnpm env use`,
`corepack enable`, shell-profile edits, PATH changes, global Git configuration changes, or other
out-of-project writes require explicit approval.

If required tooling is missing or has the wrong version, stop and report the detected version,
required version, failing command, and whether the mismatch is global or project-local. Recommend
a manual fix, explain the risk of changing global tools, and wait for explicit approval before any
mutation. Never silently change global tooling to make validation pass.

## Working Style

Work professionally, efficiently, and concisely.

For meaningful changes, explain the reason, relevant tradeoffs, expected impact or risk, and validation.

Keep reports concise unless the task requires depth or the user asks for detail.

Prefer small, reviewable, reversible changes. Do not silently perform meaningful or risky actions.

## Agent Operating Contract

Detailed first-run, skill routing, Requirement Clarification, concise output, durable memory,
evidence-first research, and safety rules live in:

```txt
.codex/rules/agent-operating-contract.md
```

Do not guess through material ambiguity. Use the installed Requirement Clarification Gate when
scope, safety, files, architecture, data, Git/publish, external side effects, irreversible
actions, user intent, or acceptance criteria are unclear.

Use `grill-me` only when lightweight clarification is not enough, such as broad, branching,
decision-heavy, or systematic requirement discovery.

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

If Plan Mode or the active tool environment blocks file writes, do not claim that a plan was
saved. State that writing is blocked, show the exact intended path, and provide the complete plan
content or a clear save action. Tell the user to save it manually or switch to a write-capable
mode and ask the agent to save it.

Plan creation is not execution approval. The default next step is to review, revise, or save the
plan. Execution requires explicit user approval after review, even if the UI or tool offers an
execution action automatically.

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

Every task final report must also include:

```txt
External / global actions:
- None
```

If approved external or global actions occurred, list each command or change, approval, reason,
and result. If a possible out-of-project change is discovered, report it explicitly.

## Scope and Safety Rules

Prefer minimal, reversible changes.

Do not expand scope without calling it out.

Do not introduce new dependencies, tools, workflows, or architecture changes without checking project memory and explaining the impact.

Do not store secrets, tokens, private data, local databases, or environment-specific files in project memory or committed files.
