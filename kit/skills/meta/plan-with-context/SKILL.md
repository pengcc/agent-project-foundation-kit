# Plan With Context Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Project Planner
- Supporting roles: Product Planner, Requirement Clarifier, Project Architect, domain roles as needed
- Workflow: plan-with-context
- Maturity expectation: senior-level planning judgment with pragmatic scope control
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies to architecture and implementation planning
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.


Use this skill to classify planning needs and create bounded, executable planning artifacts based
on real project context.

This is a planning-only workflow. It does not implement changes.

## Role

When using this skill, act as:

```txt
Project Planner
```

The Project Planner clarifies scope, checks project context, verifies technical assumptions,
compares options when needed, recommends the smallest useful path, and produces the proportionate
artifact or routing decision required for safe execution.

## Required Workflow Chain

Before creating a plan, pass the Project Memory Context Gate defined in the `project-memory`
skill and include its report in the planning context. Follow the central gate result before
producing a plan; do not redefine its sequence or status meanings here.

If the plan involves technical judgment, API behavior, versions, dependencies, configuration, deployment, tests, external services, debugging, or review best practices, run `docs-first-research`.

## Planning-Only Boundary

This workflow must not:

- Modify production code
- Install dependencies
- Change configuration
- Run destructive commands
- Commit changes
- Push changes
- Update project memory silently
- Treat plan creation as execution approval

It may read project files, inspect repository state, inspect existing docs/code/tests/configs/package files, use official documentation when needed, and create or update a plan under `dev_locals/plans/`.

## Truthful Workflow Declaration

Start with a concise workflow header.

```txt
Workflow:
- Role: Project Planner
- Skill: plan-with-context
- Context: project-memory skill applied; relevant project files checked
- Mode: planning only
```

Do not claim that a skill, source, file, or workflow was used unless its required steps were actually performed.

If required context was not read, say so and mark the plan as an incomplete draft.

## Codex Plan Mode Enforcement

Codex plan mode does not replace `plan-with-context`.

If the user asks for a plan, implementation plan, architecture plan, refactor plan, feature plan, migration plan, or asks the agent to think through work before coding, the agent must use this skill.

A plan created without applying the `project-memory` skill and reading required project memory is incomplete.

## Context to Inspect

After applying the `project-memory` skill, inspect additional project sources as needed:

```txt
README.md
package.json
lockfile
.env.example
config files
existing source files
existing tests
```

Before asking the user a question, check whether the answer is available in project docs, project memory, existing code, configuration files, tests, package files, or official documentation.

Use a plan, handoff, or other local process artifact only when the user or active task identifies
it as relevant, and only after the Project Memory Context Gate freshness check.

## Docs-First Requirement

Trigger `docs-first-research` when planning involves technical judgment, APIs, versions, dependencies, configuration, deployment, build/test/lint behavior, CI/CD, external services, security/privacy, database schema, framework behavior, or technical best practices.

## Grill-Me Requirement

Before planning, decide whether clarification is required.

Apply the shared `grilling` discipline to resolve blocking ambiguity. Route to the user-facing
`grill-me` workflow when an answer requires user interaction.

Apply the Requirement Clarification Gate from `agent-operating-contract`: after checking available
repo docs, code, config, tests, package files, and project memory, do not create a plan from
materially ambiguous scope, safety, file, architecture, data, Git/publish, external-side-effect,
user-intent, or acceptance-criteria assumptions. State the ambiguity, recommend an interpretation
or next decision, and ask for confirmation.

Use `grill-me` first when the goal, MVP boundary, business rules, scope, constraints, or technical path are unclear.

Do not use `grill-me` when the answer can be found by inspecting available project sources.

## UI Design Guidance

When planning a concrete UI page, screen, flow, or form, apply `ui-design-basics` as bounded
supporting guidance. Use it to inspect and reuse the existing UI system, establish one clear UI
goal, and cover hierarchy, states, content, and accessibility basics without replacing this
planning workflow or introducing framework-specific rules.

## React Component Guidance

When planning concrete React component or local-state implementation, apply
`react-component-patterns` only when it is installed or explicitly adopted. Keep screen clarity,
visual hierarchy, and UI state presentation in `ui-design-basics`. Route framework architecture,
routing, server/client boundaries, server state, and data-fetching strategy to the appropriate
future specialist or `docs-first-research`.

## TanStack Router and Query Guidance

When planning concrete TanStack Router routing or URL-state work, or TanStack Query server-state
work, apply `tanstack-router-query-patterns` only when it is installed or explicitly adopted. Keep
React component and local-state concerns in `react-component-patterns`, visual hierarchy and UI
state presentation in `ui-design-basics`, and product-wide frontend architecture in
`project-architecture-plan`. Route version-specific TanStack claims through
`docs-first-research`.

## Recommendation Requirement

A plan must include a recommendation.

Default to the smallest useful, verifiable, reversible option unless project memory or the user goal clearly requires a heavier solution.

## Objective Recheck for Existing Plans

Before planning the next deferred work item or extending an existing multi-work-item plan,
re-check the original objective and non-goals against completed work, validation, and current
repository evidence. If the objective is already satisfied, recommend closeout or re-scope instead
of continuing merely because another work item is listed. Continue only when the next item
addresses a concrete unresolved gap with clear product, safety, or maintenance value.

For old-plan continuation, migrations, installer changes, workflow scripts, publish automation, or
architecture expansion, inspect relevant project lessons by heading or topic before recommending
the next step. Do not require a full lessons-file read for unrelated or trivial tasks.

## Task Execution Classification

Apply `task-execution-classification.md` after required context, clarification, and research checks
and before choosing the output artifact. Report one outcome:

1. Direct Answer / No Mutation;
2. Scoped Task Execution Brief;
3. Full Saved Plan; or
4. Work Items through `to-work-items`.

Do not classify by line or file count alone. Use the shared rule's complete scope, risk,
reviewability, validation, rollback, side-effect, and hard-exclusion gates.

- For Direct Answer / No Mutation, provide the answer and explain that no implementation artifact
  is needed. Do not mutate files.
- For a Scoped Task Execution Brief, produce the complete brief structure below. It is lightweight
  planning, not planless execution.
- For a Full Saved Plan, retain the complete 13-section structure below.
- For Work Items, establish the approved overall boundary and route decomposition to
  `to-work-items`; do not decompose or execute implicitly.

If classification is uncertain, use clarification or `docs-first-research`, then reclassify. Prefer
the safer heavier artifact when uncertainty remains.

## Self-Contained Plan Quality

Plans must be executable by a fresh agent that did not see the original conversation.

For non-trivial work, include:

- exact files in scope
- exact files, directories, or behavior explicitly out of scope
- baseline branch, commit, or repository state used for planning
- STOP conditions that tell `execute-plan` when to pause, return to planning, or ask the user
- validation commands confirmed from repo files such as `package.json`, README, project memory,
  existing docs, or the current codebase

Do not rely on hidden chat context, unstated assumptions, or phrases such as "as discussed above".

Keep small plans proportional, but include enough context for safe execution without the original
conversation.

## Reviewability and Work-Item Decision

Apply the shared task-execution classification first. For every non-trivial mutation artifact,
decide whether the requested work is one focused execution pass or requires reviewable work items.

Use a single focused pass only when the plan has one coherent outcome, a plausible expected
file/area scope, one compatible validation loop, and a change set that should remain understandable
and reviewable as one unit. State the reason briefly.

Treat work as broad or review-hostile when it has multiple independently reviewable outcomes,
crosses unrelated concerns or safety boundaries, mixes behavior with tooling/runtime/publish work,
cannot state a plausible file/area scope or validation per slice, or would likely produce a PR that
is difficult to review as one unit. Do not rely on a numeric-only file or line threshold.

For broad work, either:

1. include reviewable work items directly in the saved plan; or
2. stop the plan at the approved overall boundary and route decomposition to `to-work-items`.

`to-work-items` is the canonical decomposition workflow. Embedded work items must follow the same
minimum contract: ID/name, goal, dependency order, expected file/area scope, allowed mutation,
non-goals, validation, acceptance criteria, STOP conditions, and review/PR boundary. Planning and
decomposition do not authorize execution.

Every full saved plan must include one of:

```txt
Reviewability decision: single focused pass — <brief justification>
Reviewability decision: decomposed work items required — <embedded item IDs>
Reviewability decision: route to to-work-items — <reason>
```

## Planning Artifact Persistence

Save a planning artifact to `dev_locals/plans/` when it is multi-step, executable, cross-session,
affects multiple files/modules, affects architecture/dependencies/configuration/deployment/tests/
workflows, or is explicitly requested.

Default filename:

```txt
dev_locals/plans/YYYY-MM-DD-short-topic.md
```

Scoped briefs may be presented inline for immediate review. Save them when the user requests
persistence, cross-session execution is likely, or the active planning workflow already requires a
saved artifact. A `-brief.md` filename suffix is recommended but not required.

Planning artifacts are local-only and must not be committed.

Planning artifacts are not continuously maintained after execution.

Durable results belong in project memory and must be updated through `update-project-memory`.

If Plan Mode or the active tool environment prevents writing:

- do not claim that the plan was saved
- state clearly that file writing is blocked
- show the exact intended `dev_locals/plans/` path
- provide the complete plan content in the response, or a clear next action that preserves it
- tell the user to save it manually or switch out of Plan Mode / approve a write-capable mode and
  ask the agent to save it

Do not silently continue as if the plan file exists.

## Review Report Integration

When planning from a `code-review` report:

- treat the review report as the primary problem statement
- read the original PR, diff, commit, branch, package, or reviewed target when available
- read relevant project memory, architecture, previous plan, or baseline context
- classify findings with `task-execution-classification.md`
- use a Scoped Task Execution Brief only when every shared eligibility gate passes
- use a Full Saved Plan or Work Items for normal, risky, broad, architectural, data, security,
  migration, workflow, or otherwise excluded work
- ask user approval before turning review findings into an executable plan

## Planning Artifact Structures

### Scoped Task Execution Brief

Use this structure only when every shared scoped-brief gate passes:

```md
# Scoped Task Execution Brief: <title>

## Goal

## Authorization

## Allowed Scope

## Non-Goals

## Validation

## Risk and Rollback

## STOP Conditions

## Execution Status
```

The brief must be self-contained for a fresh executor, visible before mutation, and explicitly
approved for execution. Examples never override the shared eligibility gate.

### Full Saved Plan

Full saved plans must use this structure:

```md
# Plan: <title>

## 1. Goal

## 2. Context Checked

## 3. Research Basis

## 4. Scope

## 5. Non-Goals

## 6. Assumptions and Open Questions

## 7. Recommendation

## 8. Reviewability Decision

## 9. Implementation Steps

## 10. Validation Plan

## 11. Risks and Rollback

## 12. Project Memory Updates Needed

## 13. Execution Status
```

## Project Memory Updates Needed

State whether execution may require `update-project-memory`.

Example:

```txt
Project memory update needed: yes
Reason:
Suggested next workflow: update-project-memory after execution.
```

## Execution Approval Boundary

Creating a plan is not execution approval.

After producing a plan, the default next step is review:

- review the plan
- revise the plan
- save the plan if persistence was blocked
- explicitly approve execution later

Do not automatically ask or nudge the user to execute the plan as the default next action.

Do not implement the plan unless the user explicitly approves execution.

If the UI or tool automatically offers execution, the agent's own output must still state that
execution has not been approved.

## Output Expectations

When responding, include workflow header, classification outcome, artifact type/status, saved path
only if it was actually saved, recommendation, blocking questions if any, execution status, and a
review-oriented next action.

Use the Report Depth Levels from `agent-operating-contract`. Keep simple planning responses brief,
and use more detail only when scope, risk, ambiguity, or validation complexity requires it.
