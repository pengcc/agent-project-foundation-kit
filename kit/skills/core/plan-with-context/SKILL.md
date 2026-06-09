# Plan With Context Skill

Use this skill to create bounded, executable implementation plans based on real project context.

This is a planning-only workflow. It does not implement changes.

## Role

When using this skill, act as:

```txt
Project Planner
```

The Project Planner clarifies scope, checks project context, verifies technical assumptions, compares options when needed, recommends the smallest useful path, and produces a plan that can later be executed by `execute-plan`.

## When to Use

Use this skill when the user asks for:

- An implementation plan
- A feature plan
- A refactor plan
- A migration plan
- An architecture plan
- A debugging plan
- A rollout plan
- A plan before coding
- A bounded breakdown of work
- A plan that another agent should execute later

Also use this skill when the user asks Codex or another agent to “plan”, “think through”, “break down”, “prepare implementation”, or “create steps” for project work.

## When Not to Use

Do not use this skill for:

- Pure conversation unrelated to the project
- Small one-line answers
- Simple wording edits
- Direct execution of an already approved plan
- Publishing or pushing changes
- Updating project memory directly
- Writing code immediately

Use `execute-plan` for executing an approved plan.

Use `update-project-guideline` for updating durable project memory.

Use `docs-first-research` for technical verification.

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

It may:

- Read project files
- Inspect repository state
- Inspect existing code, docs, tests, configs, and package files
- Use official documentation when needed
- Create or update a plan under `dev_locals/plans/`
- Ask clarification questions when required
- Recommend the next workflow

## Required Workflow Chain

Before creating a plan, follow the `project-guideline` skill.

The `project-guideline` skill is the unified entry point for project memory.

Use it to read and apply:

```txt
AGENTS.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

Do not redefine project memory reading rules inside this skill.

If the plan involves technical judgment, API behavior, versions, dependencies, configuration, deployment, tests, external services, debugging, or review best practices, run `docs-first-research`.

## Truthful Workflow Declaration

Start with a concise workflow header.

For non-technical planning:

```txt
Workflow:
- Role: Project Planner
- Skill: plan-with-context
- Context: project-guideline skill applied; relevant project files checked
- Mode: planning only
```

For technical planning after docs-first research:

```txt
Workflow:
- Role: Project Planner
- Skill: plan-with-context
- Context: project-guideline skill applied; docs-first-research completed; relevant project files checked
- Mode: planning only
```

For degraded research mode:

```txt
Workflow:
- Role: Project Planner
- Skill: plan-with-context
- Context: project-guideline skill applied; docs-first-research degraded mode
- Mode: planning only
```

Do not claim that a skill, source, file, or workflow was used unless its required steps were actually performed.

If required context was not read, say so and mark the plan as an incomplete draft.

## Codex Plan Mode Enforcement

Codex plan mode does not replace `plan-with-context`.

If the user asks for a plan, implementation plan, architecture plan, refactor plan, feature plan, migration plan, or asks the agent to think through work before coding, the agent must use this skill.

A plan created without applying the `project-guideline` skill and reading required project memory is incomplete.

Mark it as:

```txt
Plan status: incomplete draft
Reason: required project context was not read.
```

## Context to Inspect

After applying the `project-guideline` skill, inspect additional project sources as needed:

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

Before asking the user a question, check whether the answer is available in:

- Project docs
- Project guideline
- Project decisions
- Lessons learned
- Existing code
- Configuration files
- Tests
- Package files
- Official documentation, when technical behavior is involved

Do not ask the user questions that can be answered by inspecting available sources first.

## Docs-First Requirement

Trigger `docs-first-research` when planning involves:

- APIs
- Versions
- Dependencies
- Configuration
- Deployment
- Build, test, lint, or format behavior
- CI/CD
- External services
- Security or privacy-sensitive behavior
- Database schema or migration behavior
- Framework or runtime behavior
- Technical best practices

Include the research result in the plan.

If official docs are unavailable, use degraded mode from `docs-first-research`.

High-impact technical plans must not be finalized without confirmation when official documentation cannot be checked.

## Grill-Me Requirement

Before planning, decide whether clarification is required.

Use `grill-me` first when:

- The goal is unclear
- MVP boundaries are unclear
- Business rules are unclear
- Scope is too broad
- Time, cost, or complexity constraints are unclear
- There are multiple reasonable technical paths with different impacts
- The plan may create substantial implementation work
- A decision would be hard to reverse

Do not use `grill-me` when the answer can be found by inspecting available project sources.

If clarification is required but not completed, mark the plan as:

```txt
Plan status: blocked
```

or:

```txt
Plan status: incomplete draft
```

## Recommendation Requirement

A plan must include a recommendation.

When enough information is available, give a clear recommendation:

```txt
Recommendation:
Use <option>.

Reason:
- <reason>
```

When information is incomplete, give a provisional recommendation:

```txt
Provisional recommendation:
Use <option>, assuming <assumption> is true.

Blocked by:
- <question>
```

When multiple options exist, compare:

- Scope
- Complexity
- Risk
- Validation cost
- Rollback cost
- Impact on project guideline
- Fit with current project constraints

Default to the smallest useful, verifiable, reversible option unless the project guideline or user goal clearly requires a heavier solution.

## Plan Persistence

Small conversational plans can stay in the response.

Save the plan to `dev_locals/plans/` when it is:

- Multi-step
- Executable
- Intended for `execute-plan`
- Cross-session
- Affecting multiple files or modules
- Affecting architecture, dependencies, configuration, deployment, tests, or workflows
- Explicitly requested by the user

Default filename:

```txt
dev_locals/plans/YYYY-MM-DD-short-topic.md
```

If multiple versions are needed:

```txt
dev_locals/plans/YYYY-MM-DD-short-topic-v2.md
```

Plans under `dev_locals/plans/` are local-only and must not be committed.

Plans are not continuously maintained after execution. Durable results belong in project memory.

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

### 1. Goal

State the goal in plain language.

### 2. Context Checked

List only context that was actually checked.

Examples:

```txt
- AGENTS.md
- project-guideline skill
- .codex/project/project-guideline.md
- package.json
- existing files under <path>
```

Do not list files or skills that were not actually read or applied.

### 3. Research Basis

State whether docs-first research was required.

If it was not required:

```txt
Docs-first research: not required
Reason: <reason>
```

If it was completed:

```txt
Docs-first research: completed
Sources:
- <source>
Conclusion:
- <conclusion>
```

If degraded mode was used:

```txt
Docs-first research: degraded mode
Reason:
Risk:
```

### 4. Scope

List what this plan includes.

### 5. Non-Goals

List what this plan explicitly excludes.

Use this section to prevent scope expansion.

### 6. Assumptions and Open Questions

List assumptions and open questions.

If an open question blocks safe planning, mark the plan as blocked or incomplete.

### 7. Recommendation

Give the recommended path.

Use a provisional recommendation when needed.

### 8. Implementation Steps

Use clear, small, executable steps.

Prefer checkboxes:

```md
- [ ] Step one
- [ ] Step two
```

Each step should be small enough for `execute-plan` to follow.

### 9. Validation Plan

Explain how the implementation should be checked.

Include likely commands, tests, manual checks, or review checks.

Do not invent commands. Use project files such as `package.json` where possible.

### 10. Risks and Rollback

List risks and rollback options.

For risky steps, explain how to stop or revert.

### 11. Project Memory Updates Needed

State whether execution may require `update-project-guideline`.

Examples:

```txt
Project memory update needed: yes
Reason: the plan changes scripts and workflow rules.
Suggested next workflow: update-project-guideline after execution.
```

or:

```txt
Project memory update needed: no
Reason: the plan only changes local documentation wording.
```

### 12. Execution Status

Default:

```txt
Execution:
- Status: waiting for user approval
- Next workflow: execute-plan
```

If blocked:

```txt
Execution:
- Status: blocked
- Reason:
- Required confirmation:
```

If incomplete:

```txt
Execution:
- Status: incomplete draft
- Reason:
```

## Execution Approval Boundary

Creating a plan is not execution approval.

After producing a plan, wait for user approval before running `execute-plan`.

Do not implement the plan unless the user explicitly approves execution.

## Output Expectations

When responding, include:

- Workflow header
- Plan status
- Path to saved plan, if saved
- Recommendation
- Blocking questions, if any
- Execution status
- Next workflow

Keep the response proportional to the task.
