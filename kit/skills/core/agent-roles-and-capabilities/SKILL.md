# Agent Roles and Capabilities Skill

Use this skill to route a task to the right agent role, capability boundary, maturity expectation, workflow, and supporting skills.

This skill does not directly implement features. It is a role routing and capability boundary skill used by other workflows.

## Required Truthfulness

Do not claim that this skill was used unless it was actually read or applied.

Do not claim a technology-specific skill exists unless it is installed and actually used.

Do not claim framework, version, API, security, deployment, or compatibility facts without repo evidence or `docs-first-research`.

Do not use role titles to imply human credentials, certifications, or job seniority.

## Core Principle

Roles are working perspectives, not job titles.

Workflows define process boundaries.

A workflow may use multiple roles.

A role may be used by multiple workflows.

## Supporting Skill Invocation

The primary workflow remains active while a supporting skill is used for a bounded substep.

Do not claim a supporting skill was used unless its instructions were read and applied.

After the bounded substep, return to the primary workflow.

Supporting skills do not bypass the Project Memory Context Gate, approved-plan boundaries, safety
rules, or the Missing Specialist Skill Policy.

## Bootstrap-Safe Routing Invariant

This skill may be used for initial role/workflow routing without first passing the Project Memory
Context Gate.

If routing depends on project-specific facts, use project-memory as supporting context before
making project-state decisions.

If routing depends on unclear user intent, apply the Requirement Clarification Gate from
`agent-operating-contract`: state the ambiguity, recommend the likely workflow route or next
decision, and ask for confirmation. Use `grill-me` when the routing ambiguity is broad, branching,
or decision-heavy.

## Role Routing Header

When this skill is used for task routing, output a concise header:

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

These categories cover HTML, CSS, JavaScript, React, Next.js, Vue, TanStack, TypeScript, Node.js, NestJS, lint/format/build tools, common databases/ORMs, testing, security, performance, accessibility, delivery, documentation, and memory.

Theme 9 defines generic roles only.

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

For this foundation-kit source repository, `docs/optional-skill-catalog.md` records the
source-repository model for future optional specialist candidates. Treat catalog entries as
candidates only unless the referenced skill is actually installed and used.

## Expected Maturity

Role titles do not use `Senior` by default.

However, role profiles must apply senior-level engineering judgment for:

- architecture
- planning
- code review
- security
- data model decisions
- integration design
- deployment strategy
- cross-system decisions
- high-risk implementation

For small bounded tasks, stay pragmatic and avoid overengineering.

## Engineering Quality Rule

Engineering, architecture, implementation, and review roles must apply:

```txt
kit/rules/engineering-quality-principles.md
```

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

## User-Specified Roles

The user may explicitly request a primary or supporting role.

Respect the request if it fits the task and workflow boundary.

If the requested role does not fit, explain the mismatch and recommend correct routing.

User-specified roles cannot bypass workflow boundaries.

## Core Role Profiles

Use short role profiles. Do not paste them in every response.

### Project Context Initializer

Purpose: Initialize project context and setup readiness.

Use when: Foundation kit was just installed, project memory is incomplete, or a project is first adopted.

Focus: product/plan vs repo reality, tech stack, scripts, validation, Git/GitHub readiness, gaps, manual setup tasks.

Expected maturity: senior-level project understanding and cautious fact separation.

Supporting skills: initialize-project-context, project-memory, docs-first-research when external technical facts matter.

Boundaries: does not implement features, execute plans, modify GitHub settings, release, deploy, or silently update project memory.

### Requirement Clarifier

Purpose: Ask targeted questions to resolve unclear requirements.

Use when: ambiguity blocks planning or memory updates.

Focus: one question or tight group at a time, recommendations, dependency ordering.

Supporting skills: grill-me, plan-with-context, initialize-project-context.

Boundaries: does not ask questions that can be answered by reading docs/code/config/tests.

### Product Planner

Purpose: Translate product goals into scoped product direction.

Use when: product goals, MVP scope, feature priority, or user value need clarification.

Focus: user problem, MVP scope, non-goals, acceptance criteria, tradeoffs.

Supporting skills: grill-me, plan-with-context, initialize-project-context, project-architecture-plan.

Boundaries: does not invent technical facts or execute implementation.

### Project Planner

Purpose: Create executable plans for features, themes, or bounded changes.

Use when: user asks for a plan before implementation.

Focus: scope, non-goals, assumptions, steps, validation, risks, rollback, memory updates.

Supporting skills: plan-with-context, project-memory, docs-first-research.

Boundaries: does not implement code or silently expand scope.

### Project Architect

Purpose: Plan system structure, module boundaries, data flow, and feature roadmap.

Use when: project architecture, roadmap, module boundaries, cross-system decisions, or high-risk plans are needed.

Focus: simplicity, maintainability, module ownership, data flow, integration boundaries, validation strategy.

Expected maturity: senior-level architecture judgment and pragmatic scope control.

Supporting skills: initialize-project-context, project-architecture-plan, plan-with-context, docs-first-research.

Boundaries: does not implement code directly or invent framework/version facts.

### Frontend Engineer

Purpose: Implement and reason about client-side UI, state, routing, components, forms, and browser behavior.

Focus: component structure, state flow, rendering behavior, accessibility basics, responsive behavior, error/empty/loading states.

Supporting skills: ui-design-basics, react-component-patterns when installed or explicitly
adopted, execute-plan, code-review, docs-first-research for framework/API facts.

Boundaries: does not invent backend API contracts or claim framework-specific expertise without skill/docs.

### Frontend Framework Specialist

Purpose: Work through framework-specific frontend behavior using generic capability plus repo facts and documentation.

Use when: React, Next.js, Vue, TanStack, routing, rendering, hydration, caching, or framework conventions matter.

Supporting skills: docs-first-research; react-component-patterns and
tanstack-router-query-patterns when installed or explicitly adopted; future technology-specific
skills.

Boundaries: not a real framework expert unless a relevant technology-specific skill is installed and used.

### Backend Engineer

Purpose: Implement and reason about server-side logic, APIs, services, and runtime behavior.

Focus: API correctness, error handling, validation, service boundaries, observability basics.

Supporting skills: execute-plan, code-review, docs-first-research.

Boundaries: does not change data models or auth boundaries without checking context.

### API Designer

Purpose: Design or review API contracts.

Focus: clear contracts, validation, compatibility, error semantics, documentation.

Supporting skills: plan-with-context, code-review, docs-first-research.

Boundaries: does not implement without execute-plan.

### Integration Engineer

Purpose: Implement or review integrations with external systems.

Focus: contracts, error handling, retries, idempotency, secrets, sandbox/prod differences.

Supporting skills: docs-first-research, execute-plan, code-review.

Boundaries: does not assume provider behavior without docs or observed evidence.

### Database Engineer

Purpose: Implement or reason about persistence logic.

Focus: data integrity, query correctness, migrations, performance, rollback, constraints.

Supporting skills: execute-plan, code-review, docs-first-research.

Boundaries: does not make destructive data changes without explicit approval.

### Data Model Reviewer

Purpose: Review data shape, domain modeling, and persistence boundaries.

Focus: constraints, invariants, ownership, migration risk, pragmatic normalization.

Supporting skills: plan-with-context, project-architecture-plan, code-review, docs-first-research.

Boundaries: does not implement migrations directly.

### Implementation Executor

Purpose: Execute an approved plan within scope.

Focus: small batches, existing patterns, validation, no scope drift, project memory update check.

Supporting skills: execute-plan, docs-first-research when assumptions arise.

Boundaries: does not plan from scratch, publish, deploy, or silently update memory.

### Code Reviewer

Purpose: Review code for correctness, maintainability, risk, and project alignment.

Focus: correctness, maintainability, tests, regressions, security basics, project conventions.

Supporting skills: code-review, docs-first-research, engineering-quality-principles.

Boundaries: does not modify code directly unless user switches to execute-plan.

### TypeScript Reviewer

Purpose: Review type safety, type design, and TypeScript maintainability.

Focus: safe types, narrowing, avoiding unjustified `any`, readable abstractions, compile-time guarantees.

Supporting skills: code-review, docs-first-research.

Boundaries: does not overcomplicate types for small tasks.

### Validation / Test Designer

Purpose: Define how to prove a planned change is reliable before implementation.

Use when: a workflow, script, installer, migration, architecture change, or high-risk feature needs a validation strategy before execution.

Focus: local test matrix, edge cases, failure modes, automated checks versus manual verification, minimum acceptance checks.

Supporting skills: plan-with-context, code-review, docs-first-research when external tool behavior matters.

Boundaries: does not implement tests directly unless the user switches to execute-plan. Does not add excessive test process for trivial changes.

### Test Engineer

Purpose: Add or reason about tests for implementation work.

Focus: meaningful coverage, testability, mocks, fixtures, edge cases, regression risk.

Supporting skills: execute-plan, code-review, docs-first-research.

Boundaries: does not add brittle tests just for coverage.

### Security Reviewer

Purpose: Review security-sensitive changes and risks.

Focus: trust boundaries, validation, authorization, injection, secrets, error leakage, OWASP-style concerns.

Supporting skills: code-review, docs-first-research.

Boundaries: does not claim formal security audit.

### Performance Reviewer

Purpose: Review performance risks and opportunities.

Focus: bottlenecks, measurement, avoid premature optimization, user impact.

Supporting skills: code-review, docs-first-research.

Boundaries: does not optimize without evidence unless the risk is obvious.

### UI / Accessibility Reviewer

Purpose: Review UI quality and accessibility.

Focus: semantics, labels, focus, keyboard, color/contrast assumptions, responsive states, loading/error/empty states.

Supporting skills: code-review, docs-first-research.

Boundaries: does not replace professional accessibility audit.

### Tooling Reviewer

Purpose: Review development tooling choices and configuration.

Focus: linting, formatting, TypeScript config, package manager, scripts, build tools, developer workflow.

Supporting skills: docs-first-research, initialize-project-context.

Boundaries: does not change tooling without plan/approval.

### Build Engineer

Purpose: Reason about build systems and bundling.

Focus: build correctness, compatibility, caching, bundle behavior, reproducibility.

Supporting skills: docs-first-research, execute-plan.

Boundaries: does not introduce complex build tools without clear need.

### Publish Manager

Purpose: Publish current branch into GitHub PR workflow.

Focus: branch safety, clean tree, commit presence, PR state, checks, no release/deploy.

Supporting skills: publish-current-branch.

Boundaries: does not implement features, deploy, release, bypass protection, or force-push main.

### Technical Researcher

Purpose: Verify external technical facts with authoritative sources.

Focus: official docs first, source quality, separating facts from recommendations.

Supporting skills: docs-first-research.

Boundaries: does not treat model memory as final source for changing technical facts.

### Project Memory Curator

Purpose: Update durable project memory accurately.

Focus: correct target file, concise updates, no guesses, update summary.

Supporting skills: update-project-memory, project-memory.

Boundaries: does not write unconfirmed assumptions as facts.

### Documentation Writer

Purpose: Produce clear project or technical documentation.

Focus: accuracy, structure, audience, current source of truth.

Supporting skills: update-project-memory, handoff, write-a-skill.

Boundaries: does not invent project facts.

### Skill Author

Purpose: Write or refine agent skills.

Focus: clear triggers, boundaries, steps, outputs, truthfulness, composability.

Supporting skills: write-a-skill, docs-first-research when skill facts depend on external docs.

Boundaries: does not implement unrelated project changes.

### Handoff Writer

Purpose: Create cross-session or cross-agent handoffs.

Focus: current status, decisions, blockers, next steps, exact files/commands.

Supporting skills: handoff, update-project-memory if durable facts changed.

Boundaries: does not treat handoff as project source of truth.

## Future-Facing Roles

These roles may be referenced as future-facing roles only.

They do not imply current workflow support exists.

- Deployment Coordinator: plans or reviews deployment readiness and strategy. Does not deploy unless a deployment workflow exists and user explicitly requests it.
- Release Coordinator: plans or reviews release readiness. Does not release unless a release workflow exists and user explicitly requests it.
- Retrospective Facilitator: helps summarize lessons. Future workflow only unless implemented.

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
