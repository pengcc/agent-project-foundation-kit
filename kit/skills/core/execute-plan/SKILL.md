# Execute Plan Skill

Use this skill to execute an approved plan safely, in bounded steps, with validation.

This is an execution workflow. It does not create a new plan.

## Role

When using this skill, act as:

```txt
Implementation Executor
```

The Implementation Executor reads an approved plan, verifies that it is executable, executes it in controlled batches, validates changes, pauses on risk or scope drift, and reports the final result.

## When to Use

Use this skill when the user explicitly asks to execute an approved project plan.

Typical triggers:

```txt
Use execute-plan.
Execute this approved plan:
dev_locals/plans/<plan-file>.md
```

or:

```txt
Use execute-plan.
Execute the plan we just approved.
```

Use this skill only when there is a concrete approved plan.

## When Not to Use

Do not use this skill for:

- Creating a new plan
- Executing a vague task request
- Executing an incomplete draft
- Executing a blocked plan
- Publishing a branch
- Creating a PR
- Merging a PR
- Releasing
- Deploying
- Updating project memory directly

Use `plan-with-context` when a plan does not exist or is incomplete.

Use `docs-first-research` when technical assumptions are unverified.

Use `update-project-memory` for durable project memory updates.

Use `publish-current-branch` for push, PR, and merge workflows.

## Core Boundary

```txt
execute-plan = execute approved plan
plan-with-context = create plan
docs-first-research = verify technical assumptions
update-project-memory = update durable project memory
publish-current-branch = push / PR / merge workflow
```

`execute-plan` must not expand scope, silently update project memory, or treat generic Codex UI execution as a trusted project workflow boundary.

## Required Approval

`execute-plan` only executes an approved plan.

Default input should be a plan file path, usually:

```txt
dev_locals/plans/<plan-file>.md
```

A current-conversation plan may also be executed only if:

- The full plan is visible in the current conversation
- The plan has clear goal, scope, non-goals, steps, validation, and rollback
- The user explicitly approved that plan for execution

Do not accept vague input such as:

```txt
Do the thing we discussed.
```

or:

```txt
Just implement it.
```

If no approved plan exists, stop and recommend:

```txt
Suggested workflow: plan-with-context
```

## Generic Codex Mode Boundary

Generic Codex modes are not trusted workflow boundaries.

Codex plan mode does not replace `plan-with-context`.

Codex default execution confirmation does not replace `execute-plan`.

If the user only confirms a generic Codex plan, the agent must restate before changing files:

```txt
Workflow:
- Role: Implementation Executor
- Skill: execute-plan
- Approved plan:
- Scope:
- Stop conditions:
```

The agent must identify the approved plan file or approved plan content.

Do not rely only on the Codex UI state.

## Execution Approval Modes

There are two execution approval modes.

### strict

Default mode.

In strict mode, pause for user confirmation before:

- Workflow switch
- Risk change
- Scope change
- Step change
- Dependency change
- Configuration change
- Architecture change
- Validation strategy change
- Commit, when the plan or user requested manual confirmation

### autonomous-within-plan

Use only when the user explicitly authorizes it.

In autonomous-within-plan mode, the agent may automatically:

- Execute steps inside the approved plan scope
- Run planned validation
- Trigger `docs-first-research` for unverified technical assumptions inside the approved scope

The agent must still pause when there is:

- Scope change
- Risk change
- Step change
- Dependency change
- Configuration change
- Architecture change
- Validation strategy change
- Failed validation with unclear cause
- Any action not covered by the approved plan

Default mode:

```txt
strict
```

## Pre-Execution Checklist

Before changing files, read the approved plan and check whether it contains:

- Goal
- Scope
- Non-Goals
- Implementation Steps
- Validation Plan
- Risks and Rollback
- Execution Status

If any critical section is missing, stop.

Use this response:

```txt
Plan is not executable yet.
Suggested workflow: plan-with-context
Reason:
- <missing field>
```

Do not execute plans marked:

```txt
incomplete draft
blocked
```

unless the user explicitly sends the plan back through `plan-with-context` and approves the revised plan.

## Required Workflow Header

Before executing, output a concise truthful workflow header:

```txt
Workflow:
- Role: Implementation Executor
- Skill: execute-plan
- Approved plan: <path or current conversation plan>
- Execution mode: strict | autonomous-within-plan
```

Also restate:

```txt
Scope:
- <scope summary>

Stop conditions:
- scope drift
- failed validation
- missing credentials or permissions
- unverified technical assumption
- dependency/configuration/architecture change not covered by plan
- security/privacy/deployment risk not covered by plan
```

## Stepwise Execution

Execute the approved plan in stages.

Recommended rhythm:

1. Read approved plan
2. Restate workflow, scope, execution mode, and stop conditions
3. Execute the first small batch of steps
4. Run relevant validation
5. Report result
6. Continue only if still within approved scope
7. Stop on blockers, failed validation, scope drift, or risky unknowns

Do not execute a large multi-step plan as one unbroken change.

## Pause Conditions

Pause when any of these occur:

- New issue not covered by the plan
- Scope drift
- New dependency needed
- Configuration change needed
- Architecture change needed
- Large delete, rename, or file movement not covered by the plan
- Test failure with unclear cause
- Build/lint/test behavior conflicts with plan assumptions
- Official documentation conflicts with plan assumptions
- Project files conflict with plan assumptions
- Missing credentials or permissions
- External service access is required but unclear
- Possible impact on deployment, CI, data, auth, privacy, or security
- User requested manual confirmation before continuing

When pausing, report:

```txt
Execution paused.

Completed:
- <completed work>

Pause reason:
- <reason>

Risk:
- <risk>

Recommended next step:
- <next workflow or user confirmation needed>
```

## Technical Assumptions

Do not rely on model memory for technical decisions during execution.

Pause and use `docs-first-research` when uncertain about:

- APIs
- Versions
- Dependencies
- Configuration
- CLI flags
- Framework behavior
- Build tooling
- Test tooling
- Lint or formatting behavior
- CI/CD
- GitHub Actions
- Database schema or migration behavior
- Auth/security/privacy behavior
- External service behavior

If user authorized `autonomous-within-plan`, the agent may switch to `docs-first-research` without asking again.

If not authorized, the agent must first declare the pause reason and planned workflow switch, then wait for confirmation.

After research:

- Continue `execute-plan` if the research confirms the original plan
- Return to `plan-with-context` if research changes scope, steps, risk, validation, dependency, configuration, or architecture

## Validation

Run validation specified by the approved plan.

If the plan references project commands, verify them against project files such as:

```txt
package.json
README.md
project guideline
```

Do not invent validation commands.

If validation is skipped, explain why.

Validation results must be reported as:

```txt
Validation:
- <command or check>: passed | failed | skipped
  Reason:
```

## Local Commit Policy

`execute-plan` may create a local commit only when the approved plan explicitly includes a commit step or the user explicitly requested commit as part of execution.

Before committing:

- Planned implementation steps must be complete
- Required validation must pass, or skipped validation must be explicitly justified
- Changes must remain inside approved scope

If the user requested cautious execution, manual verification, or confirmation before commit, pause before committing.

`execute-plan` must not:

- Push
- Create PR
- Merge
- Release
- Deploy

Push, PR, and merge require explicit `publish-current-branch`.

Release and deploy are outside v0.1 execute-plan and publish-current-branch default responsibilities unless a future release/deployment skill is defined.

## Publish Boundary

If publishing is recommended, do not push directly.

Recommend:

```txt
Suggested next workflow: publish-current-branch
```

The short command must be supported by the publish workflow:

```txt
publish-current-branch
```

Safer prompt example:

```txt
Use publish-current-branch.

Push current branch, create PR, and prepare for merge according to project workflow.
Do not release or deploy.
```

## Execution Log

Always report progress in the conversation.

v0.1 does not require an execution log file for every run.

For multi-step, cross-session, interruption-prone, or user-requested execution, create a local execution log next to the plan:

```txt
dev_locals/plans/<plan-name>.execution.md
```

Execution logs are local-only and must not be committed.

Execution logs are not project truth.

Durable facts must be synchronized through `update-project-memory`.

Suggested execution log structure:

```md
# Execution Log: <plan title>

## Approved Plan

dev_locals/plans/YYYY-MM-DD-topic.md

## Execution Mode

strict | autonomous-within-plan

## Progress

- [x] Step 1
- [ ] Step 2

## Validation

- [x] npm test
- [ ] npm run build

## Pauses / Deviations

## Final Result

## Project Memory Update Check
```

## Project Memory Update Check

`execute-plan` must not silently update project memory.

At the end of execution, or when pausing, classify whether durable project memory needs updates.

Use this structure:

```txt
Project memory update check:
- project-guideline.md: yes | no
  Reason:
- project-decisions.md: yes | no
  Reason:
- lessons-learned.md: yes | no
  Reason:
Suggested next workflow: update-project-memory | none
```

Use these rules:

- Current project facts, status, commands, directory structure, tech stack, runtime, environment variables, validation, deployment, or workflow changes -> `project-guideline.md`
- Long-term choices and their reasons -> `project-decisions.md`
- Reusable execution lessons, mistakes, test discoveries, debugging patterns, or fix patterns -> `lessons-learned.md`

Actual project memory updates must be performed by `update-project-memory`.

## Completion Summary

When execution finishes or pauses, output:

```txt
Execution Summary:
- Plan:
- Execution mode:
- Completed:
- Changed files:
- Validation:
- Commit:
- Deviations:
- Blockers:
- Project memory update check:
- Recommended next workflow:
```

Rules:

- Validation skipped or failed must include a reason
- If a local commit was created, report the commit hash
- If publish is recommended, recommend `publish-current-branch`
- Do not directly push
- If project memory updates are needed, recommend `update-project-memory`

## Output Expectations

During execution, keep updates practical and scoped.

At minimum, every execution response should make clear:

- What was done
- What was validated
- Whether the plan is still being followed
- Whether execution is continuing, paused, completed, or blocked
- Whether project memory updates are needed
- What the next workflow should be
