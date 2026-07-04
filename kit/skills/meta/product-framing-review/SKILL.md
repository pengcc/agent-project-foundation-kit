# Task and Product Framing Skill

Use this skill to clarify what a task or change is solving before planning, implementation, or
proposal review, then apply deeper Product Framing only when the work affects end-user product
behavior. Keep it proportional: this is a lightweight framing discipline, not a mandatory full PRD
or project-management framework.

## Visible Name and Stable Identifier

```txt
Visible skill name: Task and Product Framing Skill
Stable workflow and package identifier: product-framing-review
Installed package path: .codex/skills/meta/product-framing-review/
```

The broader visible name reflects both framing modes. Keep the existing identifier and installed
path for routing and installation compatibility. A physical rename is a separate migration that
must account for existing installed paths, payload grouping, references, manifests, and obsolete
package cleanup; this skill wording update does not authorize that migration.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Use this default routing:

```txt
Role Routing:
- Primary role: Task and Product Framing Reviewer
- Supporting roles: Requirement Clarifier, Product Planner, Documentation Reviewer, domain roles as needed
- Workflow: product-framing-review
- Maturity expectation: concise task and product judgment grounded in affected-party goals and available evidence
- Technical specialist skill: not required for framing; use docs-first-research for consequential external facts
- Quality rule: task-and-change-safety-principles applies to scope and evidence
```

Do not claim a supporting skill was used unless its instructions were read and applied.

## Core Boundary

Task / Change Framing describes the intended capability, current problem, affected party, smallest
sufficient solution, reason it works, non-goals, and readiness. The affected party may be an end
user, agent, maintainer, reviewer, operator, system, or downstream project.

Product Framing is the deeper mode for end-user product behavior. It describes the user's problem,
question, goal, workflow, or decision. Selectors, filters, tabs, components, colors, state variables,
API shapes, layout, and styling are implementation mechanics. They may support framing, but they
must not substitute for it.

This skill does not create an implementation plan, execute changes, publish an issue, or authorize
mutation. It may ask focused clarification questions when task or product meaning is unclear.

## Required Context

For project-specific work, pass the Project Memory Context Gate from `project-memory`. Then inspect
the relevant request, rules, skills, prompts, docs, product surfaces, workflows, data contracts,
tests, and accepted decisions. Separate verified facts from assumptions and open questions.

## Task / Change Framing First

Use this preventive check before planning or implementation when scope is unclear or drift-prone,
or when the task concerns workflows, rules, skills, prompts, documentation, maintenance,
source-of-truth decisions, synchronization, or product behavior. Keep it brief when the request and
repository evidence already answer the questions.

Do not force end-user Product Framing onto non-product work. Identify the agent, maintainer,
reviewer, operator, system, or downstream project that uses or depends on the change.

```txt
Task / Change Framing Check:
- Intended capability:
  What should the user, agent, system, or product be able to do after this?

- Current problem:
  What exact gap, ambiguity, instability, conflict, or maintenance risk is this task solving?

- Primary actor / affected party:
  Who uses, executes, maintains, reviews, or depends on this change?

- Proposed solution:
  What is the smallest change or decision that addresses the current problem?

- Why this works:
  Why does this solve the current problem without expanding scope?

- Not doing now:
  What related changes, workflows, files, behaviors, or decisions are explicitly out of scope?

- Readiness:
  ready / blocked / exploratory-only
```

If Task / Change Framing is ready and the work is non-product, route to the appropriate planning,
review, documentation, or maintenance workflow. If it affects end-user behavior, continue with the
proportional Product Framing mode below.

## Framing Review Gate

Before reviewing, approving, or executing a plan or proposal, compare it with the established:

- intended capability;
- current problem;
- proposed solution;
- not doing now; and
- readiness.

Check framing alignment before reviewing implementation details. If the proposal solves a broader
or different problem than the stated current problem, stop and reframe the task before continuing
review, approval, or execution.

Treat migration, cleanup, compatibility, installer behavior, publishing, deployment,
cross-project behavior, and other high-impact work as scope-expansion triggers when they were not
explicitly included in the framing. Do not absorb them as implementation details or approve them
under a narrower task statement.

## Product Framing for End-User Behavior

Use Product Framing for pages, UI, user flows, modes, filters, legends, data-display semantics,
invalid, partial, or unsupported states, and product acceptance baselines. Product Framing is not
required merely because a non-product task changes agent-facing or maintainer-facing behavior.

### 1. Focused Product Framing Check

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

## Framing Method

1. State the intended capability and current problem from available evidence.
2. Identify the primary actor or affected party and the smallest sufficient solution.
3. Record why the solution works, explicit non-goals, assumptions, and readiness.
4. For end-user product behavior, state the user-facing purpose and desired outcome.
5. Separate product concepts from implementation mechanics.
6. Define valid data meaning and expose invalid, partial, unsupported, or ambiguous states.
7. Capture the smallest useful acceptance baseline and ask only questions that change direction.
8. Report readiness truthfully.

Slow down when multiple user goals, comparison modes, coverage warnings, legends, fractions,
colors, or explanatory UI could imply different product meanings. Do not treat exploratory
implementation as a stable product baseline.

## Clarification and Workflow Routing

- Ask focused clarification questions directly when one or two answers can unblock framing.
- Use `grill-me` only when ambiguity is broad, branching, or decision-heavy.
- Use `plan-with-context` after task and any required product framing are clear and implementation
  planning is needed.
- Use `update-project-memory` only when the user confirms a durable task convention, product
  baseline, decision, or reusable lesson; do not write memory silently.

If ambiguity materially changes implementation direction, do not produce an implementation plan
until it is resolved or explicitly classify the work as exploratory-only.

## Boundaries

Do not:

- turn every task into a full PRD or require exhaustive user stories;
- force end-user Product Framing onto workflow, rule, skill, prompt, documentation, maintenance,
  source-of-truth, or synchronization work;
- publish to an issue tracker or require issue labels;
- invent actors, users, goals, business rules, data semantics, or confidence values;
- present widgets, state, layout, API mechanics, or styling as product purpose;
- use suggested implementation slices as execution approval;
- replace `grill-me`, `plan-with-context`, `execute-plan`, or `update-project-memory`.

## Completion Check

Before finishing, verify that the output:

- states the intended capability, current problem, affected party, smallest sufficient solution,
  non-goals, and readiness;
- uses deeper Product Framing only when end-user behavior is affected;
- states a user-facing purpose rather than a mechanism when Product Framing applies;
- distinguishes known facts, assumptions, unsupported states, and open questions;
- stays proportional to the selected mode;
- provides a product acceptance baseline when applicable and an honest readiness result;
- rejects or reframes plans and proposals that solve a broader or different problem than the
  established current problem;
- routes unresolved ambiguity or later planning without silently expanding scope.
