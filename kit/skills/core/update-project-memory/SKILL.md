# Update Project Memory Skill

Use this skill to update durable project memory after project facts, decisions, or reusable lessons change.

This skill updates one or more of:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

It must not silently update project memory.

## Role

When using this skill, act as:

```txt
Project Memory Maintainer
```

The Project Memory Maintainer classifies durable updates into current facts, decision rationale, and reusable lessons.

## When to Use

Use this skill after changes involving:

- Project scope
- Non-goals
- Architecture
- Data flow
- Directory structure
- Dependencies
- Package manager
- Runtime or Node version
- Scripts and commands
- Environment variables
- Testing strategy
- Linting or formatting strategy
- Deployment setup
- Git or publishing workflow
- Agent workflow
- Major implementation status changes
- Important decision rationale
- Reusable debugging lessons or mistakes

## When Not to Use

Do not use this skill for:

- Small UI text changes
- Minor styling tweaks
- One-off scratch notes
- Temporary plans
- Local-only handoff notes
- Failed experiments with no future reuse value
- Purely internal refactors that do not affect durable project facts
- Changes already accurately reflected in project memory

## Required Context

Always read:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

When relevant, also read:

```txt
dev_locals/plans/
dev_locals/handoffs/
README.md
package.json
.env.example
```

Also inspect changed files when the update follows implementation work.

## Workflow Header

Use this header:

```txt
Workflow:
- Role: Project Memory Maintainer
- Skill: update-project-memory
- Context: project guideline + decisions + lessons
- Mode: project memory update
```

## Mandatory Pre-Update Summary

Before modifying project memory, output:

```txt
Project Memory Update Summary:
- Trigger:
- Files to update:
- Current facts changed:
- Major impacts:
- Decisions to record:
- Lessons learned:
- Risk of outdated information:
```

Do not update files silently.

The summary should help the user or future agent understand why durable project memory needs to change.

## Update Rules

### 1. Current facts go to project-guideline.md

Update:

```txt
.codex/project/project-guideline.md
```

when the current project state changes.

Examples:

- New package manager
- New Node version
- New framework convention
- New directory structure
- New build command
- New test command
- New environment variable
- New deployment target
- Changed architecture
- Changed workflow
- Changed implementation status

### 2. Reasons go to project-decisions.md

Update:

```txt
.codex/project/project-decisions.md
```

when a decision is important and future agents should not re-litigate it accidentally.

Record:

- Context
- Decision
- Reason
- Impact
- Related files

Do not record every small implementation choice.

### 3. Reusable mistakes go to lessons-learned.md

Update:

```txt
.codex/project/lessons-learned.md
```

when a debugging discovery, mistake, or risk has reuse value.

Record:

- Context
- Problem
- Root cause
- Resolution
- Reuse guidance
- Related files

Do not record one-off noise.

### 4. Prefer updating existing sections

When updating `project-guideline.md`, prefer existing fixed sections.

Do not create duplicate headings.

If adding a new section is truly necessary, mention it in the update summary.

### 5. Do not copy plans into project memory

Plans are process documents.

Do not copy large plan content into project memory.

Only summarize the resulting current facts, decisions, and reusable lessons.

### 6. Protect secrets and local-only content

Do not store:

- Secrets
- Tokens
- Credentials
- Real `.env` values
- Private user data
- Local database content
- Large logs
- `dev_locals/` scratch content without durable value

## Post-Update Output

After updating, report:

```txt
Updated:
- <file>: <summary>

Not updated:
- <file>: <reason>

Validation:
- <check>
```

If no update is needed, say:

```txt
No project memory update needed.
Reason:
```
