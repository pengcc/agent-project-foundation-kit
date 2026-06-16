# Project Architecture Plan Skill

Use this skill to create a project-level architecture and roadmap plan after project initialization and before feature-level planning.

This is a Project Lifecycle Skill. It is reusable across projects, but in one project it is normally used at lifecycle points:

- after `initialize-project-context`
- before feature-level `plan-with-context`
- when a project enters a major new phase
- when architecture, module boundaries, or roadmap need to be reset

This skill is planning-only. It does not implement changes.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Project Architect
- Supporting roles: Product Planner, Project Planner, Requirement Clarifier, Technical Researcher, Data Model Reviewer, Frontend Architect, Backend Architect as needed
- Workflow: project-architecture-plan
- Maturity expectation: senior-level architecture planning judgment with pragmatic v0.1 scope control
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies to architecture, roadmap, and technical decision planning
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Role

When using this skill, act as:

```txt
Project Architect
```

The Project Architect plans system structure, module boundaries, MVP and phase boundaries, feature roadmap, data flow, integration flow, technology decision points, risks, and validation strategy.

## Required Workflow Chain

Before creating an architecture plan, pass the Project Memory Context Gate defined in the
`project-memory` skill and include its report in the architecture context. Follow the central
gate result before planning; do not redefine its sequence or status meanings here.

If the architecture plan involves technical judgment, versions, APIs, dependencies, configuration, deployment, tests, external services, security/privacy, database/ORM behavior, or long-term technical maintenance risk, run `docs-first-research`.

## Project Lifecycle Boundary

This workflow is normally used once per project or at major project lifecycle points.

It is not a daily feature planning workflow.

This workflow must not:

- Implement features
- Modify source code
- Install dependencies
- Change configuration
- Create migrations
- Run destructive commands
- Commit changes
- Push changes
- Release or deploy
- Merge PRs
- Directly update project memory
- Replace feature-level `plan-with-context`
- Replace `initialize-project-context`
- Replace `code-review`

It may read project files, inspect repository state, inspect existing docs/code/tests/configs/package files, use official documentation when needed, and create or update a plan under `dev_locals/plans/`.

## Truthful Workflow Declaration

Start with a concise workflow header.

```txt
Workflow:
- Role: Project Architect
- Skill: project-architecture-plan
- Context: project-memory skill applied; product/project blueprint and repo reality checked
- Mode: project lifecycle architecture planning only
```

Do not claim that a skill, source, file, or workflow was used unless its required steps were actually performed.

If required context was not read, say so and mark the plan as incomplete or provisional.

## Inputs to Inspect

After applying project memory, inspect project sources as needed:

```txt
product brief
project development plan
README.md
docs/
package.json
lockfile
.env.example
configuration files
source directory structure
existing tests
initialization reports in dev_locals/research-notes/
```

Use a plan, handoff, initialization report, or other local process artifact only when the user or
active task identifies it as relevant, and only after the Project Memory Context Gate freshness
check.

## Product / Project Blueprint Requirement

A formal Project Architecture Plan requires a product/project blueprint.

A valid blueprint may be:

- product brief
- project development plan
- README product description
- docs requirement file
- user-provided project/product description
- initialization report that includes product goals and MVP direction

If no product/project blueprint is available, do not produce a formal architecture plan.

Instead, pause and output a Missing Product Blueprint Notice.

### Missing Product Blueprint Notice

When the blueprint is missing, output:

```txt
Missing Product Blueprint Notice
- Locations checked:
- Missing:
- Why this blocks a formal architecture plan:
- Minimum information needed:
- Recommendation:
- User choice needed:
```

Offer this minimum blueprint template:

```txt
Project / Product Blueprint Minimum

1. Product name / working name
2. Target users
3. Problem / need
4. Core use cases
5. MVP features
6. Non-goals for MVP
7. Important constraints
8. Preferred tech stack, if any
9. Data/entities expected
10. Success criteria
```

If the user explicitly confirms continuing without a blueprint, create only a provisional architecture draft and mark it as incomplete.

## Initialization Report

An `initialize-project-context` report is recommended but not absolutely required.

If the user provides an initialization report path, read it.

If a recent initialization report exists under:

```txt
dev_locals/research-notes/
```

prefer reading it.

If no initialization report exists, continue only if project memory, product blueprint, and repo reality provide enough context. Mark the input as incomplete when appropriate.

## Repo Reality Check

Do not design only from a product blueprint while ignoring repo reality.

For a new or empty repo:

- check README, docs, package/config, and directory structure
- lack of source code does not block a target architecture plan
- output proposed target architecture

For an existing or non-empty repo:

- inspect current directory structure
- inspect major modules
- inspect package/scripts/config
- inspect tests
- distinguish:
  - Current architecture / repo reality
  - Target architecture / recommended direction
  - Gap / migration path

## Docs-First Requirement for Technical Choices

Use `docs-first-research` for technology choices or technical claims involving:

- framework/library/API behavior
- version-specific behavior
- dependency choices
- deployment or runtime constraints
- database/ORM compatibility
- external service integration
- security/privacy/compliance constraints
- long-term maintenance risk tied to technology choices

Official documentation and project files win over model memory.

If a technology choice is already confirmed by project memory, repo, or user decision, record it as Current / Accepted Tech Stack.

If a technology choice is not confirmed, record it only as Options / Recommendation / Decision Needed and ask the user to confirm.

## Technology Options Comparison

When multiple technology options exist, compare them.

Do not treat all comparison dimensions as equal-weight for every project.

Select relevant dimensions based on:

- product blueprint
- repo reality
- MVP scope
- constraints
- risk profile

Required baseline dimensions:

- Fit to product goal / MVP scope
- Fit to current repo reality
- Development time cost
- Long-term maintenance cost
- Operational / hosting cost
- Stability and maturity
- Official documentation quality
- Community ecosystem and long-term viability
- Integration complexity
- Security / privacy / compliance impact
- Migration / lock-in risk
- Team familiarity / learning cost
- Recommendation
- Decision needed from user

Conditional dimensions may include:

- Performance
- Scalability / expected growth
- Large user volume readiness
- Deployment platform fit
- Observability / debugging support
- Data consistency requirements
- Real-time requirements
- Accessibility / SEO impact
- Internationalization / localization impact
- Offline / low-resource environment fit

## UI Architecture Direction

When UI direction affects product-wide flow, design-system reuse, component strategy,
accessibility/SEO posture, or phase boundaries, handle it at architecture-plan level.

Apply `engineering-quality-principles` for UI quality and design-system reuse. Prefer existing
project UI conventions, components, tokens, and layout patterns before recommending custom UI
direction.

Do not turn an architecture plan into UI wireframes, detailed component tickets, a component
library, a design system package, or technology-specific UI guidance. Route concrete UI changes to
`plan-with-context`.

## Architecture Review Relationship

This skill creates or updates project-level architecture direction.

Use `code-review` Plan Alignment Review to review an existing architecture plan, PR, branch,
implementation direction, or proposed structural change against accepted project memory, roadmap,
module boundaries, dependency direction, data flow, migration/rollback risk, and validation
strategy.

Do not turn `project-architecture-plan` into a review workflow. If review finds that project-level
architecture direction changed, route the next decision back to this skill.

## Architecture and Roadmap Granularity

This skill outputs project-level architecture and roadmap only.

It must not output ticket-level or feature-level implementation steps.

Feature roadmap should be phase-level:

```txt
Phase 0: Foundation / Setup
Phase 1: MVP
Phase 2: Post-MVP
Later / Optional
```

For each feature or capability, include:

```txt
- purpose
- users affected
- main modules touched
- depends on
- risk level
- suggested next workflow: plan-with-context
```

Do not include exact components, endpoints, schema migrations, tests, or code changes. Those belong to `plan-with-context` and `execute-plan`.

## Architecture Diagrams

Include a text architecture diagram or Mermaid diagram when useful.

Allowed diagrams:

- high-level architecture
- module boundary map
- data flow / state flow
- integration flow
- dependency direction

Do not create:

- detailed class diagrams
- function call graphs
- component-level diagrams
- full database ERD
- exact sequence diagrams
- UI wireframes

Simple projects may use a plain text boundary diagram.

Complex data or integration flows should prefer Mermaid.

## Architecture Decisions

Output Architecture Decisions in three groups:

```txt
Accepted:
Proposed:
Deferred:
```

Accepted decisions are already confirmed by the user, project memory, repo reality, or existing decisions.

Proposed decisions are recommendations based on blueprint, repo reality, docs-first-research, and architecture reasoning. They require user confirmation before becoming project decisions.

Deferred decisions are not needed now, lack enough information, or should be decided during future feature-level planning.

## Risks and Open Questions

Output risks and open questions grouped by:

```txt
Blocking:
High:
Medium:
Low:
```

Each item should include:

```txt
- Impact:
- Recommendation:
- Decision needed now? yes/no
```

Blocking items must be resolved before a formal feature-level plan, unless the user explicitly confirms a provisional path.

## Plan Status

Every output must declare a plan status.

Use:

```txt
Plan Status: Final / Ready for Feature Planning
```

only when:

- product/project blueprint exists
- MVP scope is clear enough
- repo reality was checked
- key technology choices are confirmed, or deferred without blocking MVP
- blocking risks are resolved

Use:

```txt
Plan Status: Provisional / Incomplete
```

when:

- product/project blueprint is missing
- MVP scope is unclear
- initialization report is missing and repo/project memory is insufficient
- key architecture-impacting technology choices are not confirmed
- blocking risks remain

If provisional, include this warning:

```txt
This architecture plan is provisional and must not be treated as the final development baseline until the blocking items are resolved and project memory is updated.
```

## Plan Persistence

Save project architecture plans to `dev_locals/plans/` when they are multi-step, cross-session, affect architecture/roadmap/modules/data flow/integration/validation, or are explicitly requested.

Default filename:

```txt
dev_locals/plans/YYYY-MM-DD-project-architecture-plan.md
```

Plans are local-only and must not be committed.

Plans are not continuously maintained after execution.

Durable results belong in project memory and must be updated through `update-project-memory`.

If Plan Mode or the active tool environment prevents writing:

- do not claim that the architecture plan was saved
- state clearly that file writing is blocked
- show the exact intended `dev_locals/plans/` path
- provide the complete plan content in the response, or a clear next action that preserves it
- tell the user to save it manually or switch out of Plan Mode / approve a write-capable mode and
  ask the agent to save it

Do not silently continue as if the plan file exists.

## Saved Plan Structure

Saved Project Architecture Plans must use this structure:

```md
# Project Architecture Plan: <project-name-or-topic>

## 1. Role Routing

## 2. Plan Status

## 3. Inputs Reviewed

## 4. Product / Project Goal Summary

## 5. Current Repo Reality

## 6. Architecture Overview

## 7. Module / Boundary Map

## 8. Data Flow / State Flow

## 9. Integration Flow

## 10. Technology Options and Decisions

## 11. Architecture Decisions

## 12. MVP Scope and Phase Boundaries

## 13. Feature Roadmap

## 14. Risks and Open Questions

## 15. Validation Strategy

## 16. Documentation / Memory Impact

## 17. Recommended Project Memory Updates

## 18. Recommended Next Feature Plans

## 19. Execution Boundary
```

Simple projects may keep sections short or mark subsections as Not applicable, but core sections must not drift.

## Recommended Project Memory Updates

This skill must not directly update project memory.

At the end, output:

```txt
Project memory update needed: yes | no
Reason:
Suggested next workflow: update-project-memory
```

When memory updates are needed, group recommended updates by:

```txt
project-guideline.md:
project-decisions.md:
lessons-learned.md:
```

Do not write unconfirmed assumptions as facts.

## Execution Boundary

Creating a Project Architecture Plan is not execution approval.

After producing a plan, default to review, revision, and saving if persistence was blocked. Do not
automatically ask or nudge the user to begin feature planning or implementation.

Feature planning and implementation require explicit user approval after review. If the UI or
tool automatically offers execution, the agent's own output must still state that execution has
not been approved.

The next feature/theme should use `plan-with-context`.
