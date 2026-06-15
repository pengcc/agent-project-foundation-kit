# Agent Operating Contract

## Purpose

This rule defines the first-run and daily operating contract for agents working in a project that installed the foundation kit.

Keep this contract concise and operational. Use the relevant workflow skill for details.

## Startup Order

After installing the foundation kit, or when adopting an existing project for the first time, start in this order:

```txt
AGENTS.md
-> project-memory
-> agent-roles-and-capabilities
-> initialize-project-context
-> routed follow-up skill
```

Do not jump directly into feature planning or implementation before initialization unless the user explicitly accepts the risk.

`grill-me` is not the first startup step. Use it when goals, scope, requirements, constraints, or decision branches remain unclear after checking available project context.

## Project Memory Context Gate

Before a workflow produces project-state output or changes project state, pass the Project Memory
Context Gate defined in the installed `project-memory` skill. Use its source selection, sequence,
reporting interface, and continuation rules rather than redefining them in this contract or in
individual workflow skills.

## Project Root Boundary

The current project root is the default file-operation boundary.

Do not write, delete, move, or generate files outside the project root unless the user explicitly
approves the exact path and purpose. Read-only global toolchain diagnostics are allowed when
needed to distinguish project-local state from machine state.

Any exception must include:

1. exact path
2. reason
3. risk
4. cleanup or rollback option
5. user confirmation

Controlled exceptions must be documented by the active workflow. For example, the foundation-kit installer may copy from `repo_root/kit/` into an explicit `target_root/`.

## Global Toolchain and Out-of-Project Operation Boundary

Project-local runtime configuration and global machine configuration are separate trust
boundaries.

Without explicit user approval, agents must not install, upgrade, downgrade, unlink, relink,
configure, or otherwise mutate:

- Homebrew or other system package managers and packages
- Node.js, pnpm, npm, corepack, mise, Volta, or global package managers
- shell profiles such as `.zprofile`, `.zshrc`, or `.bashrc`
- PATH configuration
- global Git configuration
- files outside the current project root

Read-only diagnostics are allowed without approval. Examples include `node -v`, `which node`,
`which -a node`, `pnpm -v`, `mise current`, `mise doctor`, `brew info`,
`brew list --versions`, Homebrew log inspection, PATH inspection, shell-profile inspection without
editing, and Git configuration inspection without modification.

Mutating commands such as `brew install`, `brew upgrade`, `brew reinstall`, `brew link`,
`brew unlink`, `mise use -g`, non-project/global `mise install`, `pnpm env use`,
`corepack enable`, shell-profile edits, PATH changes, and global Git configuration changes require
explicit approval.

If required tooling is missing or wrong:

1. stop the affected workflow
2. report the detected version
3. report the required version
4. report the failing command
5. distinguish global runtime state from project-local runtime state
6. recommend a manual fix and explain global-change risk
7. wait for explicit approval before running a mutating command

Never silently change global tooling to make validation pass. If a possible global or
out-of-project change is discovered, report it instead of hiding it or assuming it is safe.

## Skill Routing Map

Use the matching skill instead of bypassing the workflow.

```txt
First project adoption / onboarding:
  initialize-project-context

Role and capability routing:
  agent-roles-and-capabilities

Unclear goals / requirements / decision branches:
  grill-me

External technical facts / framework behavior / community practice:
  docs-first-research

Architecture direction / module boundaries:
  project-architecture-plan

Feature or implementation planning:
  plan-with-context

Approved execution:
  execute-plan

Review / alignment / PR / diff:
  code-review

Cross-session / cross-agent continuation:
  handoff

Skill creation / skill refinement:
  write-a-skill

Durable memory update:
  update-project-memory

Push / PR / merge:
  publish-current-branch
```

If a referenced skill is not installed yet, state that clearly and use the closest installed workflow without pretending the missing skill exists.

## Concise Output Contract

Stay concise, but not incomplete.

Use the shortest format that preserves:

- correctness
- project terminology
- decisions
- risks
- validation status
- next actions

Do not produce long reports when a short answer is enough. Do not compress away important uncertainty, warnings, or decisions.

## Durable Project Memory Loop

After meaningful planning, implementation, debugging, review, publishing, installation, or major discussion, consider whether durable project memory should be updated.

Route durable knowledge as follows:

```txt
Current facts -> .codex/project/project-guideline.md
Long-term decisions -> .codex/project/project-decisions.md
Lessons and reusable patterns -> .codex/project/lessons-learned.md
```

Use `update-project-memory` for confirmed updates.

Do not silently update memory. Do not copy plans, handoffs, logs, or scratch notes into project memory. Summarize only durable facts, decisions, and reusable lessons.

## Lessons as Pattern Memory

`lessons-learned.md` is not only for mistakes.

Use it for:

```txt
Avoid:
  mistakes, risks, bad patterns, repeated failure modes

Keep:
  successful patterns, useful workflows, good validation strategies, stable engineering practices

Mixed:
  tradeoffs or patterns that are useful only in specific contexts
```

Do not record one-off noise or unverified assumptions.

## Evidence-First Research

Use `docs-first-research` when work depends on external technical facts, official behavior, tool behavior, framework/version behavior, security-sensitive guidance, deployment behavior, or high-quality community practice.

Project files and durable project memory are the source of truth for project-specific facts.

Official documentation and high-quality primary/community sources beat model memory.

Do not copy third-party skills or rules directly into the project. Extract patterns, rewrite them for this project, and keep runtime rules auditable.

## Scope and Safety Guardrails

- Do not expand scope without calling it out.
- Do not bypass matching installed skills.
- Do not perform destructive actions without explicit user approval.
- Do not publish, merge, release, or deploy unless the user explicitly requests the matching workflow.
- Do not introduce dependencies, tooling, architecture changes, or workflow changes without checking project memory and explaining impact.
- Prefer small, reversible changes.

## Final Report Boundary

Every task final report must explicitly include:

```txt
External / global actions:
- None
```

If any external or global action was performed with explicit approval, list the command or change,
approval, reason, and result.
