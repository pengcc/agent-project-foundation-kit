# To Work Items

Use this skill when the user asks to split an approved or sufficiently clear plan into small,
agent-ready execution steps, vertical slices, or work items for focused `execute-plan` runs.

This is a plan-slicing workflow. It does not implement the work, create GitHub Issues in v1, or
replace `plan-with-context`.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Delivery Planner
- Supporting roles: Project Planner, Project Architect, Test Engineer, domain roles as needed
- Workflow: to-work-items
- Maturity expectation: pragmatic vertical slicing with explicit dependencies and validation
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies to work-item boundaries
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Scope

Use `to-work-items` to:

- confirm the source plan and approved delivery boundary;
- identify the smallest meaningful end-to-end delivery path;
- split large work into independently understandable vertical slices;
- define dependencies, acceptance criteria, and validation commands;
- identify likely files or areas without pretending certainty; and
- save or present work items suitable for focused `execute-plan` runs.

## Non-Goals

This workflow must not:

- invent missing product requirements or architecture decisions;
- convert an incomplete or disputed plan into false certainty;
- split work into vague horizontal layers such as “implement backend” and “build frontend”;
- implement work items, modify product code, or validate unimplemented behavior;
- create GitHub Issues in v1;
- commit, push, publish, merge, release, deploy, or update project memory; or
- treat work-item creation as execution approval.

## Required Context

Before slicing, pass the Project Memory Context Gate defined in the `project-memory` skill and
include its report in the work-item context. Read the complete source plan and verify its status,
scope, non-goals, baseline, stop conditions, and validation strategy against current repository
evidence.

If requirements, acceptance criteria, or architecture choices are materially ambiguous, return to
`plan-with-context`. Use `docs-first-research` only when slicing depends on unverified external or
version-specific technical facts.

## Workflow

### 1. Confirm the Source Plan

Identify the exact approved plan or sufficiently clear user-provided plan. Confirm that it is not
blocked, superseded, or an incomplete draft.

If the source is too ambiguous for reliable slicing, stop and recommend:

```txt
Suggested workflow: plan-with-context
```

### 2. Identify the Delivery Path

Map the smallest meaningful path through the planned behavior. Depending on the feature, this may
cross data, domain behavior, API or UI, integration boundaries, documentation, and validation.

Preserve the source plan's accepted scope and non-goals. Do not add architecture, dependencies, or
adjacent cleanup merely to make slices look complete.

### 3. Slice Vertically

Prefer tracer-bullet slices that deliver or prove one coherent behavior end to end.

Good slices usually:

- produce an observable result or validated capability;
- cross only the minimum required layers;
- keep related changes local;
- expose integration risk early; and
- leave the repository in a valid state.

Avoid horizontal-only tasks such as “create all models,” “implement all endpoints,” or “build all
screens.” Use a horizontal prerequisite only when it is genuinely shared, independently
verifiable, and necessary before any vertical slice can proceed.

### 4. Define Each Work Item

Make each item understandable without hidden conversation context. Include:

- one concrete goal;
- the vertical path it covers;
- likely files or areas, marked as likely rather than guaranteed;
- dependencies and blocked conditions;
- observable acceptance criteria;
- exact validation commands taken from the source plan or current repository sources;
- suggested workflow; and
- relevant risks, assumptions, and stop conditions.

Keep each item small enough for one focused `execute-plan` run. Split an item further when it has
multiple independent outcomes, unrelated validation loops, or materially different risk profiles.

### 5. Check Dependencies and Risk

Order items by real dependency, not preferred implementation layer. Mark work that can proceed in
parallel and call out blocked items explicitly.

Check that no item silently absorbs another workflow, depends on an unapproved decision, or leaves
the project in a knowingly broken intermediate state.

### 6. Save or Present Output

Default to a local-first work-item document:

```txt
dev_locals/plans/YYYY-MM-DD-work-items.md
```

Use inline output only when the user requests it or the work is too small to justify a file. Do not
claim the document was saved unless the write succeeded. Work-item creation does not approve
execution.

## Work Item Format

```md
# Work Items: <Plan / Feature Name>

## Source Plan

## Slicing Strategy

## Work Item 1: <Title>

### Goal

### Vertical Slice

### Likely Files / Areas

### Dependencies

### Acceptance Criteria

### Validation Commands

### Suggested Workflow

### Notes / Risks
```

Repeat the work-item section for each slice. Include an overall dependency order when there is more
than one item.

## Workflow Relationships

Use `to-work-items` after `plan-with-context` when a plan is too large for one focused execution
pass. Each resulting work item should be suitable input for `execute-plan`. Route unclear or
disputed requirements back to `plan-with-context`. Use `code-review` after one or more work items
are implemented when review is warranted.

## Quality Checklist

Before finalizing, verify:

- the source plan is approved or sufficiently clear;
- every item preserves the source scope and non-goals;
- slices are vertical unless a horizontal prerequisite is justified;
- every item is independently understandable and focused;
- dependencies and blocked conditions are explicit;
- acceptance criteria are observable;
- validation commands come from current repository sources or the approved plan;
- likely files are not presented as certainty;
- no item implements work or creates GitHub Issues; and
- execution still requires an explicit `execute-plan` workflow.
