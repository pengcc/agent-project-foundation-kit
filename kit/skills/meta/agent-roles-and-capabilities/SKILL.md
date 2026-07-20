# Agent Roles and Capabilities Skill

Use this skill to route a task to the right role, capability boundary, maturity expectation,
workflow, and supporting skills. It does not implement features.

## Required Truthfulness

Do not claim that this skill was used unless it was actually read or applied.

Do not claim a technology-specific skill exists unless it is installed and actually used.

Do not claim framework, version, API, security, deployment, or compatibility facts without repo evidence or `docs-first-research`.

Do not use role titles to imply human credentials, certifications, or job seniority.

## Core Principle

Roles are working perspectives, not job titles; workflows define process boundaries. A workflow
may use multiple roles, and a role may support multiple workflows.

## Supporting Skill Invocation

The primary workflow remains active during a bounded supporting-skill substep; return to it after
the substep. Claim supporting-skill use only when its instructions were read and applied.

Supporting skills do not bypass the Project Memory Context Gate, approved-plan boundaries, safety
rules, or the Missing Specialist Skill Policy.

## Skill Taxonomy Routing

Apply the `skill-invocation-and-dependency-boundaries` rule when routing skills by category,
invocation type, or hard dependency.

- Meta skills provide reusable disciplines shared by workflows.
- Core skills provide default engineering and project workflows.
- Optional skills are available only after explicit adoption.

Do not infer installed capability from category metadata alone. Meta and core routing must remain
functional when optional skills are absent.

## Bootstrap-Safe Routing Invariant

This skill may be used for initial role/workflow routing without first passing the Project Memory
Context Gate.

If routing depends on project-specific facts, use project-memory as supporting context before
making project-state decisions.

If routing depends on unclear user intent, apply the Requirement Clarification Gate from
`agent-operating-contract`: state the ambiguity, recommend the likely workflow route or next
decision, and ask for confirmation. Use `grill-me` when the routing ambiguity is broad, branching,
or decision-heavy.

## Role Routing Display Condition

This skill owns whether a concise Role Routing header is displayed. Display it only when:

- entering a meaningful workflow;
- changing workflow or mode;
- scope or stop conditions materially change; or
- risk becomes elevated.

Do not repeat Role Routing for a routine follow-up when workflow, mode, scope, stop conditions,
and risk remain unchanged.

Omitting a repeated header does not relax workflow selection, the Project Memory Context Gate,
target-reference verification, approval boundaries, stop conditions, final reporting, or
publication safeguards. Apply and report those requirements whenever their owning workflow
requires them.

## Role Routing Header

When the Role Routing Display Condition requires it, output a concise header:

```txt
Role Routing:
- Primary role:
- Supporting roles:
- Workflow:
- Maturity expectation:
- Technical specialist skill:
- Quality rule:
```

Rules:

- Keep it short.
- Do not paste full role definitions.
- If no technology-specific skill is installed, say so.
- If framework/API/version/config claims matter, use repo facts and `docs-first-research`.
- Apply `engineering-quality-principles` for engineering, architecture, implementation, and review work.

## Generic Role Categories

The generic role categories for full-stack JS/Web projects are:

1. Product / Context / Planning
2. Architecture / System Design
3. Frontend / Web Platform
4. Backend / API / Integration
5. Data / Persistence
6. Quality / Review / Testing / Validation
7. Security / Performance / Accessibility
8. Tooling / Build / DevOps / Delivery
9. Documentation / Memory / Handoff

These categories cover common full-stack JavaScript and web concerns, but remain generic roles.

Technology-specific expert skills such as Next.js, Vue, NestJS, SFCC, Adyen, Prisma, Drizzle,
PostgreSQL, SQLite, or MongoDB remain future skills. TanStack Router and Query guidance is
available only through `tanstack-router-query-patterns` when installed or explicitly adopted.

If those skills are not installed, use generic roles and support technical claims with repo facts and `docs-first-research`.

## Missing Specialist Skill Policy

When a technology-specific or domain-specific skill would be useful but is not installed, do not
pretend it exists and do not expand the current task into skill creation.

State the fallback explicitly:

```txt
Missing Specialist Skill:
- Missing specialist skill:
- Fallback generic role:
- Repo facts checked:
- External facts that require docs-first-research:
- Risk of proceeding without the specialist skill:
- Future skill candidate: yes | no
```

Use this policy to make capability gaps visible without blocking low-risk work or adding optional
skills prematurely. If the missing skill materially affects correctness, security, architecture,
or user-facing behavior, use `docs-first-research` and surface the residual risk before
continuing.

## Expected Maturity

Role titles do not use `Senior` by default. Apply senior-level engineering judgment to
architecture, planning, code review, security, data models, integrations, deployment,
cross-system decisions, and high-risk implementation.

For small bounded tasks, stay pragmatic and avoid overengineering.

## Engineering Quality Rule

Engineering, architecture, implementation, and review roles must apply the
`engineering-quality-principles` rule.

Project conventions, lint/format/test configuration, and existing repo patterns take priority.

If project conventions conflict with general quality principles, report the conflict and ask the user or project memory to decide.

## Task-to-Role Routing

Use these defaults unless the user explicitly requests a better-fitting role.

### Project initialization

```txt
Primary role: Project Context Initializer
Supporting roles: Product Planner, Project Architect
Workflow: initialize-project-context
```

### Requirement clarification

```txt
Primary role: Requirement Clarifier
Supporting roles: Product Planner
Workflow: grill-me
```

### Task, proposal, or product framing

```txt
Primary role: Task and Product Framing Reviewer
Supporting roles: Requirement Clarifier, Product Planner, Documentation Reviewer, domain roles as needed
Workflow: product-framing-review
```

Use this route for preventive task framing and as a framing-alignment gate before reviewing,
approving, or executing a plan or proposal.

### Feature or theme planning

```txt
Primary role: Project Planner
Supporting roles: Product Planner, Requirement Clarifier, Project Architect, Validation / Test Designer, domain roles as needed
Workflow: plan-with-context
```

### Validation strategy planning

```txt
Primary role: Validation / Test Designer
Supporting roles: Test Engineer, Tooling Reviewer, Code Reviewer as needed
Workflow: plan-with-context for validation planning; execute-plan only after approval
```

### Project architecture and feature roadmap planning

```txt
Primary role: Project Architect
Supporting roles: Product Planner, Requirement Clarifier, Frontend Architect, Backend Architect, Data Model Reviewer
Workflow: project-architecture-plan
Fallback workflow: plan-with-context as high-level architecture plan only if project-architecture-plan is unavailable
```

If using fallback, state that it is not a normal implementation plan.

### Approved implementation

```txt
Primary role: Implementation Executor
Supporting roles: Frontend Engineer, Backend Engineer, Database Engineer, Test Engineer, Framework Specialist as needed
Workflow: execute-plan
```

### Code review

```txt
Primary role: Code Reviewer
Supporting roles: TypeScript Reviewer, Security Reviewer, Performance Reviewer, UI / Accessibility Reviewer, Test Reviewer, Architecture Reviewer as needed
Workflow: code-review
```

### Acceptance review

```txt
Primary role: Acceptance Reviewer
Supporting roles: Code Reviewer, Validation / Test Designer, Documentation Reviewer as needed
Workflow: acceptance-review
```

### Codebase audit

```txt
Primary role: Codebase Auditor
Supporting roles: Code Reviewer, Project Architect, Test Reviewer, Security Reviewer, Tooling Reviewer, Documentation Reviewer as needed
Workflow: codebase-audit
```

### Technical fact verification

```txt
Primary role: Technical Researcher
Supporting roles: Framework Specialist, Security Reviewer, Tooling Reviewer, Database Engineer as needed
Workflow: docs-first-research
```

### Project memory update

```txt
Primary role: Project Memory Curator
Supporting roles: Documentation Writer
Workflow: update-project-memory
```

### Publishing current branch

```txt
Primary role: Publish Manager
Supporting roles: none by default
Workflow: publish-current-branch
```

## Available Roles

Project Context Initializer; Requirement Clarifier; Product Planner; Project Planner; Project
Architect; Frontend Engineer; Frontend Framework Specialist; Backend Engineer; API Designer;
Integration Engineer; Database Engineer; Data Model Reviewer; Implementation Executor; Code
Reviewer; Acceptance Reviewer; TypeScript Reviewer; Validation / Test Designer; Test Engineer;
Security Reviewer; Performance Reviewer; UI / Accessibility Reviewer; Tooling Reviewer; Build
Engineer; Publish Manager; Technical Researcher; Project Memory Curator; Documentation Writer;
Skill Author; Handoff Writer.

Use `REFERENCE.md` only when a selected role needs its detailed purpose, focus, supporting skills,
or boundaries. Routine route selection uses the routing map above.

## User-Specified Roles

Honor a user-specified primary or supporting role when it fits the task and workflow boundary.
Otherwise explain the mismatch and recommend correct routing. User-specified roles cannot bypass
workflow boundaries.

## Final Checks

Before acting after role routing, verify:

- Is the workflow correct?
- Is the primary role correct?
- Are supporting roles needed?
- Is the maturity expectation appropriate?
- Is a technology-specific skill missing?
- Is `docs-first-research` needed?
- Does `engineering-quality-principles` apply?
- Are workflow boundaries respected?
