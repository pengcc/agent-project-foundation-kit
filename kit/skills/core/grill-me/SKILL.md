# Grill Me Skill

Use this skill to clarify unclear goals, requirements, scope, constraints, and decision branches before planning or execution.

This is a clarification workflow. It does not implement code and does not replace planning, architecture, execution, review, research, publishing, or memory-update workflows.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Requirement Clarifier
- Supporting roles: Product Planner, Project Architect, Technical Researcher as needed
- Workflow: grill-me
- Maturity expectation: senior-level requirement clarification and decision-tree control
- Technical specialist skill: no technology-specific skill assumed; use docs-first-research for external technical claims
- Quality rule: engineering-quality-principles applies when clarification affects architecture, implementation, validation, or review
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Purpose

`grill-me` resolves blocking ambiguity.

It is a dependency-style productivity skill. Other current and future workflows may route to it when unclear goals, requirements, scope, constraints, tradeoffs, or decision branches block safe progress.

The lightweight Requirement Clarification Gate lives in `agent-operating-contract`. Use this
skill when that lightweight gate is not enough because ambiguity is broad, branching,
decision-heavy, or requires systematic requirement discovery.

`grill-me` should stay useful even when other skills are added, renamed, removed, or replaced.

Core behavior:

```txt
unclear decision
-> inspect available context
-> ask the smallest useful question
-> recommend an answer
-> wait for the user
-> continue or route back to the appropriate workflow
```

Brainstorming is allowed only as clarification. Use it to explore alternatives, ask focused
questions, recommend a direction, and then route back to `plan-with-context` or
`project-architecture-plan`. Do not turn brainstorming into implementation, execution, or direct
project-memory updates.

## When to Use

Use this skill when:

- user goals are unclear
- product scope is unclear
- requirements are incomplete or contradictory
- constraints are missing
- decision branches are unresolved
- the next workflow is unclear
- a plan cannot be safely created without clarifying assumptions
- `initialize-project-context`, `project-architecture-plan`, `plan-with-context`, `execute-plan`, or `code-review` finds blocking questions
- the user explicitly asks to be grilled

## When Not to Use

Do not use this skill when:

- the answer can be found by inspecting available repo files, docs, code, config, tests, or project memory
- the user asks for direct execution of an already approved plan
- a small factual question can be answered directly
- the task is already well-scoped
- clarification would create unnecessary friction
- the workflow should instead be `docs-first-research`, `project-architecture-plan`, `plan-with-context`, `execute-plan`, `code-review`, `update-project-memory`, or `publish-current-branch`

## Workflow Boundary

This workflow must not:

- implement code
- execute plans
- modify project files
- update project memory directly
- commit changes
- push changes
- create or update pull requests
- merge pull requests
- release or deploy
- invent project facts
- ask questions that available project context can answer
- turn into an unbounded interview

## Core Principle

Ask the smallest number of high-leverage questions needed to unblock the next workflow.

Prefer one question at a time.

A tight group of related questions is allowed only when they belong to the same decision and answering them together reduces friction.

Do not ask generic discovery questionnaires by default.

## Required Context Check Before Asking

Before asking the user a question, inspect available context as relevant:

```txt
AGENTS.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
README.md
docs/
package.json
lockfile
.env.example
config files
source files
tests
provided plan or prompt
previous related plans in dev_locals/plans/
handoffs in dev_locals/handoffs/
```

If the uncertainty depends on external technical facts, official behavior, framework versions, APIs, deployment behavior, or high-quality community practice, use `docs-first-research` before asking the user.

If the answer is available from context, do not ask the user. State the found answer and cite the project source when useful.

## Question Style

Default format:

```txt
Question:
Recommended answer:
Why this matters:
Impact:
```

Rules:

- Keep the question short.
- Explain why it blocks the next step.
- Provide a recommended answer or direction.
- Wait for the user's answer before continuing.
- Ask the next question only if the next decision depends on the answer.

## Decision Tree Handling

When there are several possible paths, walk down the decision tree one branch at a time.

Use this format:

```txt
Decision:
Options:
Recommended option:
Reason:
Risk:
Next dependent decision:
Question:
```

Resolve dependencies in order.

If a higher-level decision makes a lower-level question irrelevant, do not ask the lower-level question.

Do not present a full decision-tree map unless the user asks for one or the map is necessary to avoid confusion.

## Relationship with Other Skills

`grill-me` is a clarification dependency used by other workflows.

Relationship model:

```txt
Other skills route to grill-me when they hit unclear decisions.
grill-me resolves the blocking ambiguity.
Then the agent returns to the appropriate planning, architecture, research, execution, review, memory, or publishing workflow.
```

### initialize-project-context

`initialize-project-context` normally runs before `grill-me` during first project adoption.

If initialization finds blocking questions, route to `grill-me`.

### project-architecture-plan

Use `grill-me` when architecture goals, project phase, product boundaries, or key tradeoffs are unclear before architecture planning.

### plan-with-context

Use `grill-me` before `plan-with-context` when requirements, MVP boundary, business rules, scope, constraints, or technical path are unclear.

### docs-first-research

Use `docs-first-research` before asking the user when uncertainty depends on external technical facts.

### execute-plan

Do not use `grill-me` to change an approved execution plan unless execution uncovers ambiguity that blocks safe progress.

If execution is blocked by ambiguity, pause and ask for user direction before changing scope.

### code-review

Use `grill-me` after review only when findings require user, product, architecture, or scope decisions before a fix plan.

### update-project-memory

`grill-me` does not update memory directly.

If clarification creates durable facts, decisions, or lessons, recommend `update-project-memory`.

## Output Modes

### Standard Grill Mode

Use for normal clarification.

```txt
Workflow:
- Role: Requirement Clarifier
- Skill: grill-me
- Context:
- Mode: requirement clarification

Known:
Missing:
Blocking uncertainty:
Question:
Recommended answer:
Why this matters:
Impact:
```

### Decision Tree Mode

Use for dependent choices.

```txt
Workflow:
- Role: Requirement Clarifier
- Skill: grill-me
- Context:
- Mode: decision-tree clarification

Decision:
Options:
Recommended option:
Reason:
Risk:
Next dependent decision:
Question:
```

### Docs-Aware Grill Mode

Use when technical facts may affect the question.

```txt
Workflow:
- Role: Requirement Clarifier
- Skill: grill-me
- Context:
- Mode: docs-aware clarification

Repo facts:
Docs / evidence checked:
Remaining uncertainty:
Question:
Recommended answer:
```

### Brainstorming Mode

Use when the user has an early idea and needs help shaping it before planning.

```txt
Workflow:
- Role: Requirement Clarifier
- Skill: grill-me
- Context:
- Mode: brainstorming clarification

Known:
Alternatives:
Tradeoffs:
Recommended direction:
Focused question:
Next workflow:
```

Rules:

- Inspect available context before proposing alternatives.
- Keep alternatives to the smallest useful set.
- Ask focused questions rather than running an open-ended ideation session.
- Route back to `plan-with-context` or `project-architecture-plan` when the direction is clear.
- Do not create the implementation plan inside brainstorming mode.

## Stop Conditions

Stop grilling when:

- the next workflow can proceed safely
- the user's answer resolves the blocking uncertainty
- further questions are no longer high-leverage
- the user asks to stop
- a different workflow is now clearly required

End with:

```txt
Clarification status:
Recommended next workflow:
Project memory update needed:
```

## Project Memory Follow-Up

If the clarification creates durable facts, decisions, or lessons, recommend `update-project-memory`.

Classify memory targets:

```txt
Current facts -> .codex/project/project-guideline.md
Long-term decisions -> .codex/project/project-decisions.md
Lessons and reusable patterns -> .codex/project/lessons-learned.md
```

Do not silently update project memory.
