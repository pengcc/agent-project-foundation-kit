# Plan With Context Skill

Use this skill to create bounded, executable implementation plans based on real project context.

This is a planning-only workflow. It does not implement changes.

## Role

When using this skill, act as:

```txt
Project Planner
```

The Project Planner clarifies scope, checks project context, verifies technical assumptions, compares options when needed, recommends the smallest useful path, and produces a plan that can later be executed by `execute-plan`.

## Required Workflow Chain

Before creating a plan, follow the `project-memory` skill.

The `project-memory` skill is the unified entry point for reading and applying project memory.

Use it to read and apply:

```txt
AGENTS.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

Do not redefine project memory reading rules inside this skill.

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
previous related plans in dev_locals/plans/
handoffs in dev_locals/handoffs/
```

Before asking the user a question, check whether the answer is available in project docs, project memory, existing code, configuration files, tests, package files, or official documentation.

## Docs-First Requirement

Trigger `docs-first-research` when planning involves technical judgment, APIs, versions, dependencies, configuration, deployment, build/test/lint behavior, CI/CD, external services, security/privacy, database schema, framework behavior, or technical best practices.

## Grill-Me Requirement

Before planning, decide whether clarification is required.

Use `grill-me` first when the goal, MVP boundary, business rules, scope, constraints, or technical path are unclear.

Do not use `grill-me` when the answer can be found by inspecting available project sources.

## Recommendation Requirement

A plan must include a recommendation.

Default to the smallest useful, verifiable, reversible option unless project memory or the user goal clearly requires a heavier solution.

## Plan Persistence

Save the plan to `dev_locals/plans/` when it is multi-step, executable, cross-session, affects multiple files/modules, affects architecture/dependencies/configuration/deployment/tests/workflows, or is explicitly requested.

Default filename:

```txt
dev_locals/plans/YYYY-MM-DD-short-topic.md
```

Plans are local-only and must not be committed.

Plans are not continuously maintained after execution.

Durable results belong in project memory and must be updated through `update-project-memory`.

## Saved Plan Structure

Saved plans must use this structure:

```md
# Plan: <title>

## 1. Goal

## 2. Context Checked

## 3. Research Basis

## 4. Scope

## 5. Non-Goals

## 6. Assumptions and Open Questions

## 7. Recommendation

## 8. Implementation Steps

## 9. Validation Plan

## 10. Risks and Rollback

## 11. Project Memory Updates Needed

## 12. Execution Status
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

After producing a plan, wait for user approval before running `execute-plan`.

Do not implement the plan unless the user explicitly approves execution.

## Output Expectations

When responding, include workflow header, plan status, saved path if saved, recommendation, blocking questions if any, execution status, and next workflow.
