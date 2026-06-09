# Project Guideline Skill

Use this skill when a task depends on project-specific facts, constraints, architecture, workflow, or current implementation status.

This skill defines how agents must use and maintain:

```txt
.codex/project/project-guideline.md
```

The project guideline is the current source of truth for project facts.

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

## Workflow Header

Start with a short workflow header for explicit project workflows:

```txt
Workflow:
- Role: Project Context Reader
- Skill: project-guideline
- Context: .codex/project/project-guideline.md
- Mode: context check
```

If the guideline is missing, say so:

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

### 2. Plans are not durable truth

Plans are execution and process documents.

A plan may become outdated after execution. Do not treat an old plan as the current state of the project.

Use the plan only as the execution source for the current task.

After execution, update the project guideline if the resulting current facts changed.

### 3. Prefer existing sections

When updating `project-guideline.md`, prefer updating existing sections.

Do not create duplicate sections.

Only add a new section if the existing fixed structure cannot reasonably hold the information. If a new section is added, explain why in the update summary.

### 4. Separate facts, decisions, and lessons

Use the right project memory file:

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

### 5. Do not store secrets

Never store secrets, private tokens, credentials, production data, private customer data, or local-only environment values in project memory.

Reference `.env.example` for variable names and purposes.

### 6. Keep project memory useful

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

- Which context files were read
- Whether the guideline was sufficient
- Whether a project memory update may be needed

If no update is needed, say why.
