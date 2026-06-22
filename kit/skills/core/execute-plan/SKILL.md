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


Use this skill to execute an approved plan or eligible Scoped Task Execution Brief safely, in
bounded steps, with validation.

This is an execution workflow. It does not create a new plan.

## Role

When using this skill, act as:

```txt
Implementation Executor
```

The Implementation Executor verifies an approved execution input, executes it in controlled
batches, validates changes, pauses on risk or scope drift, and reports the final result.

## Core Boundary

```txt
execute-plan = execute approved plan or eligible scoped task brief
plan-with-context = create plan
docs-first-research = verify technical assumptions
update-project-memory = update durable project memory
publish-current-branch = push / PR / merge workflow
```

`execute-plan` must not expand scope, silently update project memory, or treat generic Codex UI execution as a trusted project workflow boundary.

## Project Memory Context Gate

Before execution, pass the Project Memory Context Gate defined in the `project-memory` skill and
include its report in the execution context. Confirm that the approved execution input still
matches current project memory and repository evidence. If material drift invalidates it, stop and
return to `plan-with-context`; do not redefine the gate here.

## Required Approval

`execute-plan` requires one of two explicitly approved execution inputs:

1. an execution-complete saved plan or complete current-conversation plan; or
2. an eligible Scoped Task Execution Brief.

The default input for normal implementation work is a plan file path, usually:

```txt
dev_locals/plans/<plan-file>.md
```

A current-conversation plan may also be executed only if it is complete and explicitly approved.
Do not replace normal planning with a scoped brief merely because a proposed diff appears short.
Apply `task-execution-classification.md` for scoped-brief eligibility, hard exclusions, and
reclassification. Normal implementation continues to require a complete approved plan.

If neither approved input exists, stop and recommend:

```txt
Suggested workflow: plan-with-context
```

## Scoped Task Execution Brief

A Scoped Task Execution Brief is a lightweight planning artifact and strict execution contract,
not planless execution. Accept a saved brief or assemble one inline only when every gate in
`task-execution-classification.md` passes.

The brief must contain and expose before mutation:

- Goal;
- Authorization;
- Allowed Scope;
- Non-Goals;
- Validation;
- Risk and Rollback;
- STOP Conditions; and
- Execution Status.

The agent may assemble an inline brief only from explicit authorization for the exact task and
verified repository facts. A complete current request does not need duplicate confirmation, but
the brief must still be user-visible in the pre-execution status. Do not invent missing terms,
silently narrow or expand scope, split hidden work, or use examples or apparent diff size to bypass
the shared gate.

If any field or eligibility condition is false, ambiguous, unverified, or becomes invalid, stop and
route to clarification, `docs-first-research`, `plan-with-context`, or `to-work-items` as directed by
the shared rule. Do not reclassify and continue silently.

## Approved Execution Contract

Treat the approved plan or Scoped Task Execution Brief as the execution contract.

Every changed hunk must map to one of:

- an approved implementation step or allowed mutation
- an approved validation step
- an approved project memory or design-log update

If a needed change is outside the approved execution contract, pause and ask the user whether to
revise or create a plan with `plan-with-context`.

If an out-of-scope agent-made change was introduced during execution and can be isolated safely,
revert that agent-made change before continuing. Do not revert user or pre-existing changes without
explicit approval.

Material drift in scope, baseline, validation, architecture, dependencies, risk, file ownership, or
repository state returns to `plan-with-context`.

If execution reveals material ambiguity in contract interpretation, user intent, scope, safety,
files, architecture, data, Git/publish, external side effects, irreversible actions, or acceptance
criteria, stop instead of guessing. State the ambiguity, recommend the next interpretation or
decision, and return to clarification or `plan-with-context`. Use `grill-me` only when ambiguity is
broad, branching, or decision-heavy.

## Supporting Skill Activation

`execute-plan` remains the primary workflow during approved execution.

Before each step group, classify whether an installed supporting skill applies to a bounded
substep:

```txt
skill creation/refinement -> writing-great-skills
external technical facts -> docs-first-research
concrete UI screen/flow/form implementation -> ui-design-basics
React component/local-state implementation -> react-component-patterns when installed or explicitly adopted
TanStack Router/Query implementation -> tanstack-router-query-patterns when installed or explicitly adopted
durable memory write -> update-project-memory
concrete diff/PR/package review -> code-review
repo-wide audit -> codebase-audit
unclear requirements -> grill-me
publish readiness / publish handoff -> recommend code-review after execution; publish-current-branch only after review approval and explicit publication authorization
```

Read and apply the supporting skill only for that bounded substep, report the supporting skill
used, then return to `execute-plan`.

Do not run publish-current-branch as an internal execution substep. Push, PR, and merge require
an explicit workflow switch after execution.

Supporting skills must not expand, replace, or override the approved execution contract. If a
supporting skill reveals material drift in scope, steps, risk, validation, dependency,
configuration, architecture, or repository state, pause and return to `plan-with-context`.

## Generic Codex Mode Boundary

Generic Codex modes are not trusted workflow boundaries.

Codex plan mode does not replace `plan-with-context`.

Codex default execution confirmation does not replace `execute-plan`.

If the user only confirms a generic Codex plan, the agent must restate before changing files:

```txt
Workflow:
- Role: Implementation Executor
- Skill: execute-plan
- Approved execution input:
- Scope:
- Stop conditions:
```

## Execution Approval Modes

Default mode is:

```txt
strict
```

Use `autonomous-within-plan` only for an approved plan when the user explicitly authorizes it.
Scoped Task Execution Briefs always use strict mode.

In autonomous-within-plan mode, the agent may execute inside approved scope, run planned validation, and trigger `docs-first-research` for unverified technical assumptions inside approved scope.

The agent must still pause for scope, risk, step, dependency, configuration, architecture, or validation strategy changes.

## Pre-Execution Checklist

For an approved plan, check before changing files that it contains:

- Goal
- Scope
- Non-Goals
- Implementation Steps
- Validation Plan
- Risks and Rollback
- Execution Status

If any critical section is missing, stop and recommend `plan-with-context`.

Do not execute plans marked `incomplete draft` or `blocked`.

For a Scoped Task Execution Brief, verify every eligibility condition and emit every brief field
before mutation. Missing, ambiguous, or unverified content requires the safer route defined by
`task-execution-classification.md`.

## Reviewable Execution Readiness

Before mutation, verify that the approved execution input is reviewable and execution-ready:

- it identifies one focused execution pass or contains approved work items;
- the approved current slice is explicit;
- expected file/area scope is specific enough to detect drift;
- validation and acceptance criteria exist for the current slice; and
- the slice should remain understandable and reviewable as one change set.

If approved work items exist, execute only the approved current slice. Execute multiple slices in
one run only when the user explicitly approves those slices together after their combined scope
and reviewability are visible.

STOP and route to `plan-with-context` or `to-work-items` when a broad or review-hostile plan lacks
required work items, file/area boundaries, validation per slice, or an explicit approval covering
the proposed current scope. Do not invent work items, silently decompose the plan, or continue on
the basis that the user approved the broader goal.

For a clearly small plan created before reviewability decisions were required, state the focused
single-pass judgment in the pre-execution update. If reviewability is uncertain, stop rather than
assuming the plan is focused.

A Scoped Task Execution Brief must always be one focused execution pass. It cannot contain or
replace work items. If decomposition is needed, stop and route to `plan-with-context` or
`to-work-items`.

## Pre-Execution Status Update

After completing the applicable pre-execution checks, emit one concise user-visible status update
before creating a branch, changing files, or performing another execution mutation. Do not require
one fixed sentence. Cover:

- the approved execution input and authorization source;
- whether the plan is complete or the brief is eligible, current, and explicitly approved;
- the Project Memory Context Gate result and execution-input/memory alignment;
- the relevant repository state;
- the intended branch strategy;
- repository-level and current-branch PR state when relevant and checkable;
- runtime/tooling alignment when the plan or project workflow specifies it;
- the staged implementation groups derived from the approved input;
- the reviewability decision and approved current slice;
- the active stop conditions.

State briefly when a check is not applicable or not checkable, including any material impact. Do
not claim a check passed when it was not performed. This reporting requirement does not make clean
synchronized `main`, PR checks, or runtime checks universal; apply them only when required by the
approved execution input or project workflow.

Local branch creation may be part of local execution setup. It does not authorize push, PR
creation, merge, release, deployment, or any publish workflow. Push, PR, and merge remain behind
an explicit switch to `publish-current-branch` after execution.

## Stepwise Execution

Execute the approved contract in stages.

After each reasonable step group, run relevant validation and report the result.

Pause on blockers, failed validation, scope drift, or risky unknowns.

## Output Noise Control

Apply the `skill-and-output-efficiency` rule without replacing this skill's execution, validation,
STOP, memory, or publish boundaries.

- **Boundary output:** Keep the pre-execution status update, warnings, blockers, skipped checks,
  validation failures, scope drift, permission or publish boundaries, and final report complete
  but concise. When relevant, include reason, evidence, impact, and next action.
- **Routine success progress:** Prefer terse checkpoints such as `Group 1/3: done`,
  `Validation: running`, or `Scope check: passed`. Explain successful mechanics only when they
  affect a user decision, residual risk, or the next execution step.
- **Warnings, blockers, and errors:** Do not compress away evidence or recovery guidance. Use at
  least:

  ```txt
  BLOCKED: <reason>
  Evidence: <file, command, or observed result>
  Impact: <why safe continuation is not possible>
  Next: <recommended action or workflow>
  ```

- **Final report:** Retain the approved execution input, completed scope, changed-file summary, validation,
  risks or blockers, memory/docs status, Git/publish status, external/global actions, and next
  workflow when applicable. When Git or the UI already exposes exact paths, prefer a file count
  and category summary; list exact paths when they are needed for review, ambiguity resolution, or
  safe follow-up. Apply the Publishable Change Handoff from `agent-operating-contract` for
  publishable changes, including its local-only boundary and publish authorization limits.

Concision never authorizes omitting failed validation, skipped checks, uncertainty, scope drift,
or an execution boundary.

## Technical Assumptions

Do not rely on model memory for technical decisions during execution.

Pause and use `docs-first-research` when uncertain about APIs, versions, dependencies, configuration, CLI flags, framework behavior, build/test/lint tooling, CI/CD, database behavior, auth/security/privacy, or external service behavior.

If research changes scope, steps, risk, validation, dependency, configuration, or architecture, return to `plan-with-context`.

For a Scoped Task Execution Brief, discovering that external technical research is needed
invalidates eligibility. Stop and route to `docs-first-research`, then require reclassification and
approval through `plan-with-context` before execution resumes. Do not research opportunistically
and continue under the original brief.

## Validation

Run validation specified by the approved execution contract.

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

`execute-plan` may create a local commit only when the approved plan explicitly includes a commit
step or the user explicitly requested commit as part of the approved execution contract.

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
- Execution input:
- Execution mode:
- Completed:
- Changed files:
- Validation:
- Commit:
- Deviations:
- Blockers:
- Supporting Skills Used:
- Quality / Constraints Followed:
- Project memory update check:
- External / global actions:
- Publish changes recommendation: <shared-contract value when applicable>
- Recommended next workflow: <code-review when the shared handoff applies; otherwise the applicable workflow>
- Fast PR after review approval: <shared-contract value; include only when Publish changes recommendation is present>
- Publication guardrail: <shared-contract value; include only when Publish changes recommendation is present>
```

If a local commit was created, report the commit hash.

Include the four publish handoff fields only when required by the shared contract. Otherwise use
its local-only report when applicable. Publishing requires completed review, explicit user
authorization, and the matching `publish-current-branch` workflow.

If project memory updates are needed, recommend `update-project-memory`.
