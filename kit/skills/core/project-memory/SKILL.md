# Project Memory Skill

Use this skill when a task depends on project-specific facts, constraints, architecture, workflow, decisions, lessons, or current implementation status.

This skill is the unified entry point for reading and applying durable project memory.

It owns the Project Memory Context Gate and durable memory reading/applying. It does not write
durable memory directly; confirmed writes belong to `update-project-memory`.

It covers:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

The memory file names stay specific:

- `project-guideline.md` stores current project facts.
- `project-decisions.md` stores durable decision rationale.
- `lessons-learned.md` stores reusable lessons, mistakes, and debugging findings.

## Role

When using this skill, act as:

```txt
Project Memory Reader
```

The Project Memory Reader loads relevant project memory before planning, executing, reviewing, debugging, documenting, or publishing project work.

## When to Use

Use this skill before:

- Planning project work
- Executing an implementation plan
- Reviewing code
- Debugging or refactoring
- Changing architecture
- Changing dependencies
- Changing scripts or tooling
- Changing deployment behavior
- Changing environment variables
- Updating project memory
- Publishing or preparing project changes
- Making any decision that depends on current project state

## When Not to Use

Do not use this skill for:

- Purely conversational questions unrelated to the project
- One-off explanations that do not depend on project state
- Temporary scratch notes that will not affect the project
- Generic knowledge questions that do not require project context

## Project Memory Context Gate

Use this gate before producing context-dependent output or modifying project state.

### Source Selection

For a downstream project, use:

```txt
.codex/skills/core/project-memory/SKILL.md
.codex/project/project-decisions.md
.codex/project/project-guideline.md
.codex/project/lessons-learned.md
```

For the foundation-kit source repository, use:

```txt
root AGENTS.md
kit/skills/core/project-memory/SKILL.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

Do not assume the source repository has the kit installed under `.codex/skills/`.

### Gate Sequence

1. Read and apply the applicable `AGENTS.md` instructions.
2. Read and apply this `project-memory` skill from the applicable source above.
3. Read `.codex/project/project-guideline.md` when available.
4. Read `.codex/project/project-decisions.md` when the task touches architecture, dependencies,
   workflow, conventions, product direction, or prior tradeoffs.
5. Read `.codex/project/lessons-learned.md` when the task touches implementation, debugging,
   recurring mistakes, review, refactoring, tooling, publishing, or skill evolution.
6. If the user or active task identifies a plan, handoff, report, or research note, verify its
   date, status, and alignment with current sources before using it. Do not scan local process
   artifacts by default or treat them as durable truth.
7. Inspect the task-specific repository evidence needed to confirm current behavior, such as:

```txt
README.md
package.json
lockfile
.env.example
config files
source files
tests
```

8. Report the gate result before context-dependent output or mutation.

### Reporting Interface

```txt
Project Memory Context:
- Gate: passed | partial | blocked
- Files checked:
- Memory status: sufficient | missing | stale | update recommended
```

Gate status meanings:

- `passed`: required context was checked and is sufficient for the task.
- `partial`: context is incomplete or stale, but the active workflow can safely diagnose or
  repair it, or the gap is explicitly non-blocking.
- `blocked`: missing or conflicting context prevents safe continuation. Stop before
  context-dependent output or mutation.

Memory status meanings:

- `sufficient`: the checked memory supports the task without a durable update.
- `missing`: an expected memory source is absent.
- `stale`: memory conflicts with verified current project sources.
- `update recommended`: verified durable facts, decisions, or lessons should be recorded after
  the active workflow.

`initialize-project-context` and `update-project-memory` may continue from `partial` to diagnose
or repair context. They must still stop on `blocked`.

## Workflow Header

Start with a short workflow header for explicit project workflows:

```txt
Workflow:
- Role: Project Memory Reader
- Skill: project-memory
- Context: .codex/project/project-guideline.md
- Mode: context check
```

If project memory is missing, say so:

```txt
Context: .codex/project/project-guideline.md missing
```

## Core Rules

### 1. Project guideline is the current source of truth

Treat `.codex/project/project-guideline.md` as the current project fact source.

Use it for:

- Current scope
- Non-goals
- Tech stack
- Runtime
- Directory structure
- Scripts
- Environment variables
- Architecture
- Testing
- Deployment
- Current implementation status
- Known constraints
- Agent-specific project notes

### 2. Decisions explain why

Treat `.codex/project/project-decisions.md` as the source for durable decision rationale.

Use it to avoid re-litigating settled decisions.

### 3. Lessons prevent repeated mistakes

Treat `.codex/project/lessons-learned.md` as the source for reusable execution, debugging, and workflow lessons.

Use it to avoid repeating previous mistakes.

### 4. Plans are not durable truth

Plans are execution and process documents.

A plan may become outdated after execution.

Do not treat an old plan as the current state of the project.

Use the plan only as the execution source for the current task.

After execution, update project memory if the resulting current facts, decisions, or lessons changed.

### 5. Separate facts, decisions, and lessons

Use the right memory file:

```txt
.codex/project/project-guideline.md
```

For current project facts.

```txt
.codex/project/project-decisions.md
```

For important decision rationale.

```txt
.codex/project/lessons-learned.md
```

For reusable mistakes, debugging discoveries, or lessons future agents should avoid.

### 6. Do not store secrets

Never store secrets, private tokens, credentials, production data, private customer data, or local-only environment values in project memory.

Reference `.env.example` for variable names and purposes.

### 7. Keep project memory useful

Project memory should be concise and durable.

Do not add:

- Temporary debug notes
- One-off scratch findings
- Failed experiments with no reuse value
- Unverified assumptions
- Large copied logs
- Old plan content that is no longer current

## Output Expectations

When using this skill, briefly state:

- Which memory files were read
- The Project Memory Context report
- Whether a project memory update may be needed

If no update is needed, say why.
