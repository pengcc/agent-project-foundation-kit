# Project Memory Skill

Use this skill when a task depends on project-specific facts, constraints, architecture, workflow, decisions, lessons, or current implementation status.

This skill is the unified entry point for reading and applying durable project memory.

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

## Required Context

Always read:

```txt
.codex/project/project-guideline.md
```

When relevant, also read:

```txt
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

If the task refers to a plan or handoff, also read the referenced file under:

```txt
dev_locals/plans/
dev_locals/handoffs/
```

If the task depends on project implementation details, inspect relevant:

```txt
README.md
package.json
lockfile
.env.example
config files
source files
tests
```

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
- Whether the memory was sufficient
- Whether a project memory update may be needed

If no update is needed, say why.
