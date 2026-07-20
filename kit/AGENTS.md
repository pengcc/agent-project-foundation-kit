# AGENTS.md

This is the stable, concise entry point for agents working in this project. Keep detailed project
facts in `.codex/project-memory/guideline.md`, durable decisions in
`.codex/project-memory/decisions.md`, and reusable lessons in
`.codex/project-memory/lessons-learned.md`.

## Required Context

Before project-related planning, implementation, review, debugging, documentation, or publishing,
pass and report the Project Memory Context Gate from the installed `project-memory` skill.

Use the project guideline as the current source of truth for the stack, scripts, testing,
deployment, environment-variable names, directory rules, and project-specific constraints.
Read and apply `.codex/project-specific/agent-guidance.md` when it exists. It supplements this
Kit-owned entrypoint with repository-specific guidance and must not duplicate the full operating
contract.
Use `agent-roles-and-capabilities` for role routing and missing-specialist fallback, and
`docs-first-research` when decisions depend on consequential external technical facts.

## First Project Adoption

After installing the Foundation Kit or first adopting this project, use:

```txt
AGENTS.md
-> project-memory
-> agent-roles-and-capabilities
-> initialize-project-context
-> routed follow-up skill
```

Do not use `initialize-project-context` for routine work once current project memory is sufficient.
Use `grill-me` only when available evidence cannot resolve material scope or decision ambiguity.

## Role Routing

`agent-roles-and-capabilities` owns when Role Routing is displayed. Apply its Role Routing
Display Condition rather than repeating a header for routine follow-ups whose workflow, mode,
scope, stop conditions, and risk are unchanged.

## Project and Global Boundaries

The repository root is the default file-operation boundary. Project-related external development
infrastructure is allowed only when explicitly pre-authorized by
`.codex/project-memory/guideline.md`; access must remain within the active task and approved
resource type. Other out-of-project writes, destructive operations, or resource access require
explicit user approval.

Do not mutate global developer tooling, package managers, shell profiles, PATH, or global Git
configuration without explicit user approval. Read-only diagnostics are allowed when needed.
If required tooling is missing or incompatible, report the detected and required versions, the
failing command, and the global or project-local distinction; do not change global tooling to make
validation pass.

## Workflow and Safety Contract

Apply `.codex/rules/agent-operating-contract.md` for target-reference verification, requirement
clarification, skill routing, project-root and global-tooling boundaries, Git preflight,
publishing, final reporting, and the Publishable Change Handoff. Use the relevant installed skill
rather than duplicating its workflow contract here.

Installed Foundation Kit workflows are under `.codex/skills/`, `.codex/rules/`, and
`.codex/prompts/`. Project-specific durable memory is maintained separately under
`.codex/project-memory/`.

When present and relevant, inspect project-specific capabilities under
`.codex/project-specific/skills/`, `.codex/project-specific/rules/`, and
`.codex/project-specific/prompts/`. They use the same formats, metadata, invocation, dependency,
routing, and authoring standards as Kit capabilities. Project-specific skills may depend on Kit
skills, but Kit skills must not depend on project-specific skills. Avoid duplicate skill
identities across the two ownership paths.

Use the matching workflow for planning, execution, review, handoff, durable-memory updates, and
publishing. Plans and handoffs are local process artifacts under `dev_locals/`; they are not
current project truth.

## Git and Publication

Before a Git-visible repository mutation, perform the contract's Git preflight and work on a
dedicated feature branch unless the user explicitly authorizes editing the default branch for that
task. Do not push directly to the default branch.

Commits require an approved execution plan that includes them or explicit user instruction. Push,
pull request, merge, release, deployment, and publication require separate explicit user intent
and the `publish-current-branch` workflow.

Apply the Publishable Change Handoff whenever `agent-operating-contract.md` identifies a
publishable change; do not infer that a clean worktree means there is nothing to hand off.

## Working Style

Use the smallest safe, reviewable change. Do not expand scope silently. Preserve secrets and
environment-specific data; do not place them in repository files or project memory.

For meaningful work, state the reason, material trade-offs, expected impact or risk, and relevant
validation. Keep final reporting concise while preserving the fields and authorization boundaries
owned by `agent-operating-contract.md`.
