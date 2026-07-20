# Role Profiles Reference

Use these profiles only when a selected role needs detailed purpose, focus, supporting skills, or
boundaries. Do not paste them into routine routing output.

## Core Role Profiles

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

Supporting skills: product-framing-review, grill-me, plan-with-context, initialize-project-context, project-architecture-plan.

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

Supporting skills: ui-design-basics, react-component-patterns when installed or explicitly adopted, execute-plan, code-review, docs-first-research for framework/API facts.

Boundaries: does not invent backend API contracts or claim framework-specific expertise without skill/docs.

### Frontend Framework Specialist

Purpose: Work through framework-specific frontend behavior using generic capability plus repo facts and documentation.

Use when: React, Next.js, Vue, TanStack, routing, rendering, hydration, caching, or framework conventions matter.

Supporting skills: docs-first-research; react-component-patterns and tanstack-router-query-patterns when installed or explicitly adopted; future technology-specific skills.

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

### Acceptance Reviewer

Purpose: Evaluate delivered work against an explicit acceptance baseline.

Focus: approved requirements and criteria, evidence, scope drift, validation gaps, and an advisory acceptance verdict.

Supporting skills: acceptance-review, project-memory, code-review when change-quality judgment is needed.

Boundaries: does not implement fixes, create or revise plans, approve or merge PRs, publish, deploy, or update project memory.

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

Supporting skills: update-project-memory, handoff, writing-great-skills.

Boundaries: does not invent project facts.

### Skill Author

Purpose: Write or refine agent skills.

Focus: clear triggers, boundaries, steps, outputs, truthfulness, composability.

Supporting skills: writing-great-skills, docs-first-research when skill facts depend on external docs.

Boundaries: does not implement unrelated project changes.

### Handoff Writer

Purpose: Create cross-session or cross-agent handoffs.

Focus: current status, decisions, blockers, next steps, exact files/commands.

Supporting skills: handoff, update-project-memory if durable facts changed.

Boundaries: does not treat handoff as project source of truth.

## Future-Facing Roles

These roles are future-facing only and do not imply current workflow support:

- Deployment Coordinator: plans or reviews deployment readiness and strategy. Does not deploy unless a deployment workflow exists and user explicitly requests it.
- Release Coordinator: plans or reviews release readiness. Does not release unless a release workflow exists and user explicitly requests it.
- Retrospective Facilitator: helps summarize lessons. Future workflow only unless implemented.
