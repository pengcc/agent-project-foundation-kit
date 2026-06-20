# Update Project Memory Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Project Memory Curator
- Supporting roles: Documentation Writer
- Workflow: update-project-memory
- Maturity expectation: careful source-of-truth judgment
- Technical specialist skill: not applicable unless recording technical facts; use docs-first-research for external technical claims
- Quality rule: not directly applicable unless documenting engineering decisions
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.


## Durable Memory Loop Integration

Use this skill when the agent operating contract or another workflow determines that durable project knowledge was produced.

After meaningful planning, implementation, debugging, review, publishing, installation, or major discussion, classify durable updates as:

```txt
Current facts -> .codex/project/project-guideline.md
Long-term decisions -> .codex/project/project-decisions.md
Lessons and reusable patterns -> .codex/project/lessons-learned.md
```

Lessons are not limited to mistakes. Classify lesson candidates as:

```txt
Avoid:
  mistakes, risks, bad patterns, repeated failure modes

Keep:
  successful patterns, useful workflows, good validation strategies, stable engineering practices

Mixed:
  tradeoffs or patterns that are useful only in specific contexts
```

Do not silently write memory. Propose the update first, then wait for user confirmation unless the user has explicitly authorized the update workflow.

## Reusable Lesson Promotion Candidates

Project experience must be recorded in local project memory first when it is durable.

This workflow may identify a reusable lesson candidate, but it does not promote lessons into
foundation-kit files by itself. Reusable lesson promotion requires generalization review, user
confirmation, and a later approved plan before any kit rule, skill, template, or documentation
change.

Use this candidate format:

```txt
Reusable Lesson Candidate:
- Source project / source context:
- Original lesson:
- Reusable principle:
- What generalizes:
- What does not generalize:
- Proposed destination:
- Risk of overgeneralization:
- User decision:
- Next workflow:
```

Rule: do not automatically promote project lessons. A candidate remains local project memory until the
user confirms that it should be generalized for the foundation kit.


Use this skill to update durable project memory after project facts, decisions, or reusable lessons change.

This skill owns confirmed durable writes. It depends on `project-memory` for the Project Memory
Context Gate and memory-reading rules; it must not become a general planning, research, or
context-discovery workflow.

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

Pass the Project Memory Context Gate defined in the `project-memory` skill and include its report
in the update context. As a context-repair workflow, follow the central gate's continuation rules
without redefining them here.

Also inspect changed files when the update follows implementation work.

Use a plan, handoff, or other local process artifact only when the user or active task identifies
it as relevant, and only after the Project Memory Context Gate freshness check.

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

### 3. Reusable lessons and patterns go to lessons-learned.md

Update:

```txt
.codex/project/lessons-learned.md
```

when a debugging discovery, mistake, risk, successful pattern, or tradeoff has reuse value.

Record:

- Context
- Lesson category: Avoid / Keep / Mixed
- Problem, pattern, or tradeoff
- Root cause or why it worked
- Resolution or reuse conditions
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

## Domain Vocabulary and Durable Decisions

Project memory may include a lightweight domain vocabulary when stable terms affect
implementation, review, onboarding, or future planning. Keep it inside the existing project-memory
structure. Do not create a parallel `CONTEXT.md` or second source of truth unless the project has
explicitly adopted one.

Record durable decisions sparingly. A decision belongs in `project-decisions.md` when it is hard to
reverse, surprising without context, based on a real tradeoff, or likely to affect future
implementation or review. Do not turn every implementation detail into an ADR-like entry.

Use the existing memory split:

- `project-guideline.md` for stable project overview, conventions, vocabulary, and workflow
  context.
- `project-decisions.md` for durable architectural, product, workflow, or policy decisions.
- `lessons-learned.md` for reusable lessons from incidents, bugs, migrations, or reviews.
- `dev_locals/` for temporary plans, research notes, work items, and local-only analysis unless the
  repository convention says otherwise.

## Post-Update Output

After updating, report:

```txt
Updated:
- <file>: <summary>

Not updated:
- <file>: <reason>

Validation:
- <check>

External / global actions:
- None
```

If no update is needed, say:

```txt
No project memory update needed.
Reason:

External / global actions:
- None
```

If an external or global action occurred with explicit approval, replace `None` with the command
or change, approval, reason, and result.
