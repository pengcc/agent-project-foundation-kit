# Engineering Quality Principles

These principles are cross-technology engineering constraints for planning, implementation, and review.

They are not a standalone workflow skill.

They are applied by roles and workflows such as:

- agent-roles-and-capabilities
- plan-with-context
- execute-plan
- code-review
- future technology-specific skills

Project-specific conventions, lint/format/test configuration, and existing repo patterns take priority.

If project conventions conflict with these principles, report the conflict and ask the user or project memory to decide.

## 1. Keep It Simple

Prefer simple, readable, maintainable solutions.

Avoid clever or over-engineered code.

Use the smallest design that solves the current approved scope.

Do not add abstractions only because they might be useful later.

## 2. DRY, but Avoid Premature Abstraction

Avoid harmful duplication.

Extract shared logic when the same concept repeats and is likely to change together.

Do not create abstract helpers too early if they make code harder to read, test, or change.

A small amount of duplication can be acceptable when the concepts may evolve differently.

## 3. Single Responsibility

Functions, classes, components, modules, and services should have a clear responsibility.

Split code when responsibilities, reasons to change, or testing concerns diverge.

Do not split mechanically if it reduces readability.

## 4. Clear Naming

Use names that explain intent.

Avoid ambiguous abbreviations unless they are standard in the project or domain.

Prefer domain language from the project.

Names should make common code paths self-explanatory.

## 5. Testable Code

Prefer code that can be tested without excessive global state, hidden dependencies, or hard-coded side effects.

Use dependency boundaries, interfaces, fixtures, and mocks pragmatically.

Do not add complex test infrastructure for simple bounded work unless risk justifies it.

## 6. Early Return and Low Nesting

Use early returns for failure, guard, or edge cases when they make the main path clearer.

Keep branching understandable.

Avoid deeply nested conditionals.

## 7. Small Focused Changes

Prefer small, meaningful changes.

Avoid mixing refactors, feature work, formatting churn, and unrelated cleanup in one change.

When committing is in scope, prefer small focused commits with useful messages.

## 8. Comments Explain Why

Code should usually explain what it does.

Comments should explain why a decision was made, what tradeoff exists, what business rule applies, or what edge case is being handled.

Avoid comments that repeat obvious code.

## 9. Consistent Style

Follow the project's existing style, lint rules, formatter, naming patterns, and file organization.

Use tools such as ESLint, Prettier, Biome, TypeScript, or project-specific formatters when configured.

Do not introduce a new style or tooling without a plan and user approval.

## 10. Defensive Programming

Validate inputs at trust boundaries.

Handle null/undefined, missing data, invalid states, and external service failures where relevant.

Do not swallow errors silently.

Log or surface errors appropriately for the project context.

## 11. Complexity Control

Prefer small focused functions and components.

If a function grows beyond roughly 20-30 lines or accumulates high branching complexity, consider extraction.

Use cyclomatic complexity or similar metrics as guidance, not as a mechanical rule.

Do not split code into many tiny pieces if that harms readability.

## 12. Avoid Magic Values

Avoid unexplained hard-coded numbers, strings, statuses, durations, and config values.

Use named constants, enums, config, or domain-specific names when that improves readability and maintainability.

## 13. Follow Existing Patterns First

Before introducing a new pattern, inspect how the project already handles similar problems.

Prefer consistency unless the existing pattern is clearly harmful.

If changing a pattern, explain why and limit the change scope.

## 14. Make Tradeoffs Explicit

When there are multiple reasonable approaches, explain the tradeoff.

Prefer decisions that reduce long-term maintenance cost without overengineering.

State uncertainty clearly.

## 15. Validate the Change

For implementation work, run or recommend the smallest meaningful validation:

- typecheck
- lint
- unit tests
- integration tests
- e2e tests
- build
- manual verification

If validation is skipped, explain why.

## 16. UI Quality and Design-System Reuse

For user-facing UI work, existing project conventions, design systems, component libraries,
tokens, accessibility practices, and product context take priority.

Before custom UI, inspect and reuse existing components, variants, tokens, layout patterns, and
interaction states where they fit the approved scope.

Evaluate UI changes with this compact checklist:

- Scope / screen / flow: identify the exact user flow or surface being changed
- User goal: preserve the user's primary task and avoid distracting additions
- Existing design system or UI library: reuse established primitives before creating custom UI
- Layout / visual hierarchy: make primary actions, content groups, and navigation clear
- Responsive behavior: account for narrow, medium, and wide layouts when relevant
- Accessibility basics: preserve semantic structure, labels, keyboard paths, focus visibility, and
  reasonable contrast assumptions
- States: include loading, empty, error, disabled, and success states when the flow can reach them
- Interaction and feedback: make actions, progress, validation, and failure states visible
- Content clarity: keep labels, helper text, and error copy concise and specific
- Reuse / maintainability: avoid one-off styling, raw color overrides, and speculative abstractions
- Risks / tradeoffs: call out uncertainty, visual debt, or cases needing designer/user review
- Recommendation: state whether to proceed, simplify, defer, or route to another workflow
- Next workflow: use `plan-with-context` for concrete UI changes, `project-architecture-plan` for
  product-wide UI direction, `code-review` for UI diffs, or `codebase-audit` for broad UI
  opportunities

This guidance is not a component library, design system package, technology-specific UI skill, or
professional accessibility audit.

## 17. Reassess the Runtime as Automation Grows

Shell is appropriate for small, linear glue around existing commands. Reassess the runtime before
a script becomes a workflow engine with complex state, structured data, interactive prompts,
backups, path-boundary enforcement, recovery logic, or extensive branching.

When those signals appear:

- warn that the current runtime may be increasing correctness and testability risk
- compare the cost of continued shell growth with migration to a more testable runtime
- research and plan the migration before the script becomes harder to replace
- preserve a bounded archive or rollback reference only when it has a clear ownership and support
  status

Node.js is one suitable choice in this repository, but the general rule is to select the runtime
that best supports the workflow's state model, validation needs, and long-term maintenance.

## 18. Keep Project and Global Tooling Boundaries Explicit

Treat project-local runtime configuration and global machine tooling as separate state.

Use read-only diagnostics to identify which executable and version a project command actually
uses. Do not install, upgrade, downgrade, relink, reconfigure, or otherwise mutate global tools,
shell profiles, PATH, global Git configuration, or files outside the project root without explicit
user approval.

When a runtime mismatch blocks validation:

- report the detected and required versions
- report the failing command
- distinguish global state from project-local state
- recommend a manual correction and explain its machine-wide risk
- wait for explicit approval before any mutating command

Do not silently repair global tooling to make a project check pass.

## 19. Composable Boundaries and Extension Seams

Compose focused units through small, explicit inputs, outputs, and contracts. Keep dependency
direction visible by passing external services, state, and configuration through deliberate
boundaries instead of hidden globals or cross-layer reach-through.

Add extension points only for demonstrated variation or integration needs. Prefer a later small
refactor over speculative plugin systems or generalized interfaces. Separate domain decisions from
adapters or side effects when it improves testability and change isolation; do not impose layers
mechanically.

## 20. Configuration, Secrets, and Security Boundaries

Separate deploy-varying configuration from code and validate required configuration at an
appropriate startup or trust boundary. Use project-approved runtime configuration and secret
management; never hard-code, commit, log, or place real secrets in examples, tests, or project
memory.

Keep authorization, credential handling, cryptography, destructive operations, and other
security-sensitive behavior behind small auditable boundaries with consistent enforcement. Prefer
secure defaults, least privilege, established libraries or patterns, and docs-first verification
over custom security mechanisms.

## 21. Change Safety and Evidence

Prefer the simplest safe, reviewable update path. Preserve mature files and make targeted changes
unless a full replacement is explicitly justified by the approved scope and is easier to verify.

Treat large deletions, major line-count drops, and replacement of mature content with stubs as
destructive-risk signals. Stop and review the diff before continuing.

Choose the update method by review safety:

- isolated edits: direct patch
- coordinated changes within one file: full-file replacement only when it is safer to review
- coordinated multi-file changes: a bounded bundle with complete diff review

For rename or migration work, search repository-wide before and after the change. Classify
remaining references as current, historical, or stale rather than assuming every match should be
changed.

Verify external or remote state through authoritative evidence. Manual confirmation expresses
intent but does not prove external state. Place confirmations at meaningful safety boundaries;
do not add prompts to every mechanical step when one explicit, scope-visible authorization is
sufficient.
