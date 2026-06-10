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
