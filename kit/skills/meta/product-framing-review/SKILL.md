# Product Framing Review Skill

Use this skill to clarify why a user needs a product surface before planning or implementing how
that surface works. Keep it proportional: this is a lightweight framing discipline, not a mandatory
full PRD.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Use this default routing:

```txt
Role Routing:
- Primary role: Product Framing Reviewer
- Supporting roles: Product Planner, Requirement Clarifier, domain roles as needed
- Workflow: product-framing-review
- Maturity expectation: concise product judgment grounded in user goals and available evidence
- Technical specialist skill: not required for framing; use docs-first-research for consequential external facts
- Quality rule: task-and-change-safety-principles applies to scope and evidence
```

Do not claim a supporting skill was used unless its instructions were read and applied.

## Core Boundary

Product framing describes the user's problem, question, goal, or decision. Selectors, filters,
tabs, components, colors, state variables, API shapes, layout, and styling are implementation
mechanics. They may support the framing, but they must not substitute for it.

This skill does not create an implementation plan, execute changes, publish an issue, or authorize
mutation. It may ask focused clarification questions when product meaning is unclear.

## Required Context

For project-specific work, pass the Project Memory Context Gate from `project-memory`. Then inspect
the relevant product docs, current UI or workflow, data contracts, tests, and accepted decisions.
Separate verified facts from assumptions and open questions.

## Choose One Mode

### 1. Task-Level Product Framing Check

Use before a specific plan or implementation involving product behavior, UI modes, user
workflows, comparisons, filters, legends, explanatory states, data coverage, or other user-facing
meaning.

Write one sentence, or at most two short sentences, that answers:

> What problem, question, or decision brings the user to this page, mode, or workflow?

The answer must express the user's goal rather than implementation mechanics. If no clear purpose
statement can be written, readiness is `blocked` or `exploratory-only` until the ambiguity is
resolved.

For a small behavior-preserving UI, CSS, layout, responsive, or readability fix where the product
purpose is already clear, keep the check brief. Do not manufacture product uncertainty or expand
the task into a PRD.

Output:

```txt
Product Framing Check:
- Purpose statement:
- User goal / decision:
- Valid data:
- Invalid / partial / unsupported states:
- UI concepts vs implementation mechanics:
- Acceptance baseline:
- Open questions:
- Readiness: ready / blocked / exploratory-only
```

### 2. Broader Product / Module Review or PRD Repair

Use when a whole page, module, product area, existing implementation, or PRD needs review or
reconstruction. Do not force a whole product into one sentence. Produce a concise baseline that
is detailed enough to support later decisions without becoming an exhaustive product-management
framework.

Output:

```txt
Product Framing Review:
- Product purpose summary:
- Target users / roles:
- Core user goals:
- Core workflows / modes:
- Data semantics:
- Invalid / partial / unsupported states:
- UX/product principles:
- Non-goals / out of scope:
- Acceptance baseline:
- Suggested implementation slices:
- Open questions:
- Readiness: ready for plan / needs PRD or product baseline / blocked by product ambiguity
```

Suggested slices are product outcomes or review boundaries. They are not an executable plan and
do not authorize implementation.

## Review Method

1. State the user-facing purpose from available evidence.
2. Identify known users or roles and the decisions or outcomes they seek.
3. Separate product concepts from implementation mechanics.
4. Define valid data meaning and expose invalid, partial, unsupported, or ambiguous states.
5. Capture the smallest useful acceptance baseline and explicit non-goals.
6. Mark assumptions and ask only the focused questions that change product direction.
7. Report readiness truthfully.

Slow down when multiple user goals, comparison modes, coverage warnings, legends, fractions,
colors, or explanatory UI could imply different product meanings. Do not treat exploratory
implementation as a stable product baseline.

## Clarification and Workflow Routing

- Ask focused clarification questions directly when one or two answers can unblock framing.
- Use `grill-me` only when ambiguity is broad, branching, or decision-heavy.
- Use `plan-with-context` after product framing is clear and implementation planning is needed.
- Use `update-project-memory` only when the user confirms a durable product baseline, decision, or
  reusable lesson; do not write memory silently.

If ambiguity materially changes implementation direction, do not produce an implementation plan
until it is resolved or explicitly classify the work as exploratory-only.

## Boundaries

Do not:

- turn every task into a full PRD or require exhaustive user stories;
- publish to an issue tracker or require issue labels;
- invent users, goals, business rules, data semantics, or confidence values;
- present widgets, state, layout, API mechanics, or styling as product purpose;
- use suggested implementation slices as execution approval;
- replace `grill-me`, `plan-with-context`, `execute-plan`, or `update-project-memory`.

## Completion Check

Before finishing, verify that the output:

- states a user-facing purpose rather than a mechanism;
- distinguishes known facts, assumptions, unsupported states, and open questions;
- stays proportional to the selected mode;
- provides an acceptance baseline and honest readiness result;
- routes unresolved ambiguity or later planning without silently expanding scope.
