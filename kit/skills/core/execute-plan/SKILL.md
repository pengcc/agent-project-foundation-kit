# Execute Plan Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Implementation Executor
- Supporting roles: Frontend Engineer, Backend Engineer, Database Engineer, Test Engineer, Framework Specialist as needed
- Workflow: execute-plan
- Maturity expectation: pragmatic implementation; senior-level judgment for risky changes
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies to implementation work
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.


Use this skill to execute an approved plan safely, in bounded steps, with validation.

This is an execution workflow. It does not create a new plan.

## Role

When using this skill, act as:

```txt
Implementation Executor
```

The Implementation Executor reads an approved plan, verifies that it is executable, executes it in controlled batches, validates changes, pauses on risk or scope drift, and reports the final result.

## Core Boundary

```txt
execute-plan = execute approved plan
plan-with-context = create plan
docs-first-research = verify technical assumptions
update-project-memory = update durable project memory
publish-current-branch = push / PR / merge workflow
```

`execute-plan` must not expand scope, silently update project memory, or treat generic Codex UI execution as a trusted project workflow boundary.

## Project Memory Context Gate

Before execution, pass the Project Memory Context Gate defined in the `project-memory` skill and
include its report in the execution context. Confirm that the approved plan still matches current
project memory and repository evidence. If material drift invalidates the plan, stop and return to
`plan-with-context`; do not redefine the gate here.

## Required Approval

`execute-plan` only executes an approved plan.

Default input should be a plan file path, usually:

```txt
dev_locals/plans/<plan-file>.md
```

A current-conversation plan may also be executed only if it is complete and explicitly approved.

If no approved plan exists, stop and recommend:

```txt
Suggested workflow: plan-with-context
```

## Approved Plan Contract

Treat the approved plan as the execution contract.

Every changed hunk must map to one of:

- a plan implementation step
- a plan validation step
- an approved project memory or design-log update

If a needed change is outside the approved plan, pause and ask the user whether to revise the plan
with `plan-with-context`.

If an out-of-scope agent-made change was introduced during execution and can be isolated safely,
revert that agent-made change before continuing. Do not revert user or pre-existing changes without
explicit approval.

Material drift in scope, baseline, validation, architecture, dependencies, risk, file ownership, or
repository state returns to `plan-with-context`.

If execution reveals material ambiguity in plan interpretation, user intent, scope, safety, files,
architecture, data, Git/publish, external side effects, irreversible actions, or acceptance
criteria, stop instead of guessing. State the ambiguity, recommend the next interpretation or
decision, and return to clarification or `plan-with-context`. Use `grill-me` only when ambiguity is
broad, branching, or decision-heavy.

## Supporting Skill Activation

`execute-plan` remains the primary workflow during approved-plan execution.

Before each step group, classify whether an installed supporting skill applies to a bounded
substep:

```txt
skill creation/refinement -> write-a-skill
external technical facts -> docs-first-research
concrete UI screen/flow/form implementation -> ui-design-basics
React component/local-state implementation -> react-component-patterns when installed or explicitly adopted
TanStack Router/Query implementation -> tanstack-router-query-patterns when installed or explicitly adopted
durable memory write -> update-project-memory
concrete diff/PR/package review -> code-review
repo-wide audit -> codebase-audit
unclear requirements -> grill-me
publish readiness / publish handoff -> recommend publish-current-branch after execution
```

Read and apply the supporting skill only for that bounded substep, report the supporting skill
used, then return to `execute-plan`.

Do not run publish-current-branch as an internal execution substep. Push, PR, and merge require
an explicit workflow switch after execution.

Supporting skills must not expand, replace, or override the approved plan boundary. If a supporting
skill reveals material drift in scope, steps, risk, validation, dependency, configuration,
architecture, or repository state, pause and return to `plan-with-context`.

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

## Execution Approval Modes

Default mode is:

```txt
strict
```

Use `autonomous-within-plan` only when the user explicitly authorizes it.

In autonomous-within-plan mode, the agent may execute inside approved scope, run planned validation, and trigger `docs-first-research` for unverified technical assumptions inside approved scope.

The agent must still pause for scope, risk, step, dependency, configuration, architecture, or validation strategy changes.

## Pre-Execution Checklist

Before changing files, read the approved plan and check whether it contains:

- Goal
- Scope
- Non-Goals
- Implementation Steps
- Validation Plan
- Risks and Rollback
- Execution Status

If any critical section is missing, stop and recommend `plan-with-context`.

Do not execute plans marked `incomplete draft` or `blocked`.

## Stepwise Execution

Execute the approved plan in stages.

After each reasonable step group, run relevant validation and report the result.

Pause on blockers, failed validation, scope drift, or risky unknowns.

## Technical Assumptions

Do not rely on model memory for technical decisions during execution.

Pause and use `docs-first-research` when uncertain about APIs, versions, dependencies, configuration, CLI flags, framework behavior, build/test/lint tooling, CI/CD, database behavior, auth/security/privacy, or external service behavior.

If research changes scope, steps, risk, validation, dependency, configuration, or architecture, return to `plan-with-context`.

## Validation

Run validation specified by the approved plan.

Do not invent validation commands.

If validation is skipped, explain why.

If validation fails because a runtime or tool is missing or has the wrong version, stop and report:

- detected version and executable path when available
- required project version
- failing command
- global versus project-local runtime state
- a manual remediation recommendation and its machine-wide risk

Do not mutate global tooling, shell profiles, PATH, global Git configuration, or files outside the
project root without explicit user approval.

## Local Commit Policy

`execute-plan` may create a local commit only when the approved plan explicitly includes a commit step or the user explicitly requested commit as part of execution.

`execute-plan` must not push, create PR, merge, release, or deploy.

Push, PR, and merge require explicit `publish-current-branch`.

Release and deploy are outside v0.1 execute-plan and publish-current-branch default responsibilities unless a future release/deployment skill is defined.

## Execution Log

Always report progress in the conversation.

For multi-step, cross-session, interruption-prone, or user-requested execution, create a local execution log next to the plan:

```txt
dev_locals/plans/<plan-name>.execution.md
```

Execution logs are local-only and are not project truth.

Durable facts must be synchronized through `update-project-memory`.

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

Actual project memory updates must be performed by `update-project-memory`.

## Completion Summary

Use the Report Depth Levels from `agent-operating-contract`. Completion summaries default to
Standard; use Detailed only for high-risk, complex, blocked, or multi-step validation work.

When execution finishes or pauses, output:

```txt
Execution Summary:
- Plan:
- Execution mode:
- Completed:
- Recommended update type:
- Recommended commit message:
- Recommended PR title:
- Changed files:
- Validation:
- Commit:
- Deviations:
- Blockers:
- Supporting Skills Used:
- Quality / Constraints Followed:
- Project memory update check:
- External / global actions:
- Recommended next workflow:
```

If a local commit was created, report the commit hash.

If publish is recommended, recommend `publish-current-branch`.

If project memory updates are needed, recommend `update-project-memory`.
