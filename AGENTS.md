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

- `kit/skills/meta/*/SKILL.md`
- `kit/skills/meta/*/metadata.yml`
- `kit/skills/core/*/SKILL.md`
- `kit/skills/core/*/metadata.yml`
- `kit/rules/*`
- `kit/prompts/*`
- `kit/project-templates/*`

Core workflow boundaries live in the kit source skills: `project-memory` reads/applies durable
memory and owns the context gate, `update-project-memory` owns confirmed durable writes,
`docs-first-research` owns external fact verification, and `agent-roles-and-capabilities` owns
role routing and missing-specialist fallback.

Before relying on a concrete repository path, apply the Explicit Target Reference Guardrail in
`kit/rules/agent-operating-contract.md`.

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
- `writing-great-skills`
- `handoff`
- `update-project-memory`

## Planning and Execution Boundary

Multi-step plans normally belong under `dev_locals/plans/`.

If Plan Mode or the active tool environment blocks file writes, do not claim that a plan was
saved. State that writing is blocked, show the exact intended path, provide the complete plan
content or a clear save action, and tell the user to save it manually or switch to a write-capable
mode and ask the agent to save it.

Plan creation is not execution approval. After producing a plan, default to review, revision, or
saving the plan. Execute it only after the user explicitly approves execution.

## Global Toolchain and Out-of-Project Operation Boundary

Do not install, upgrade, downgrade, unlink, relink, configure, or otherwise mutate global
developer tooling without explicit user approval. This includes Homebrew or system packages,
Node.js, pnpm, npm, corepack, mise, Volta, global package managers, global Git configuration,
shell profiles such as `.zprofile`, `.zshrc`, or `.bashrc`, PATH configuration, and files outside
the repository.

Read-only diagnostics are allowed without approval, including version and path checks, `mise`
status or doctor commands, package-manager information, logs, shell PATH/profile inspection, and
Git configuration inspection.

If required tooling is missing or has the wrong version, stop and report the detected version,
required version, failing command, and whether the mismatch is global or project-local. Recommend
a manual fix, explain the risk of changing global tools, and wait for explicit approval before any
mutation. Never silently change global tooling to make validation pass.

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
pnpm publish:changes "Commit message"
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

Every task final report must include:

```txt
External / global actions:
- None
```

If approved external or global actions occurred, list each command or change, approval, reason,
and result. If a possible out-of-project change is discovered, report it explicitly.

## Project Memory

Use `.codex/project/` as this repository's durable development memory.

Before project-state planning, implementation, review, documentation, or publishing, pass the
Project Memory Context Gate defined in `kit/skills/meta/project-memory/SKILL.md`. Use the
source-repository path defined there and report the gate result before context-dependent output or
mutation.

Update project memory when durable facts, long-term decisions, or reusable lessons change. Do not write foundation-kit-specific development history into installable downstream templates unless it has been deliberately distilled into generic reusable guidance.
