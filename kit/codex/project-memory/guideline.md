# Project Guideline

This file is the current source of truth for project-specific facts.

Plans, handoffs, and scratch notes are process documents. They may become outdated after execution. Keep this file updated with the resulting current project state.

## 1. Project Overview

Describe the project in a few sentences:

- What this project is
- Who it is for
- What problem it solves
- What the current phase is

## 2. Current Scope

Describe what is currently in scope.

Include only the current phase or MVP scope. Keep future ideas separate unless they directly affect current decisions.

## 3. Non-Goals

List what is intentionally out of scope for the current phase.

Use this section to prevent unnecessary expansion.

## 4. Tech Stack and Runtime

Record the current technical choices, for example:

- Framework
- Language
- Package manager
- Runtime / Node version
- Database
- Styling
- Testing tools
- Lint / format tools
- Deployment platform

Do not record guesses. If unknown, write `TBD`.

## 5. Directory Structure

Document important directories and their responsibilities.

Focus on directories that agents must understand before modifying the project.

## 6. Scripts and Commands

Record the current commands for:

- Install
- Development
- Build
- Test
- Lint
- Format
- Type check
- Data import / generation
- Deployment, if applicable

Prefer exact commands from `package.json` or project scripts.

## 7. Environment Variables

List required environment variables and their purpose.

Do not include real secrets.

Reference `.env.example` if available.

## 8. Architecture and Data Flow

Describe the current architecture and main data flows.

Include:

- Important modules
- Data sources
- API boundaries
- Storage model
- Build-time vs runtime behavior
- External services, if any

## 9. Testing and Validation

Describe how changes should be validated.

Include:

- Required tests
- Manual checks
- Build checks
- Lint / format checks
- Known limitations in the test setup

## 10. Development Workflow

Record project-specific development workflow rules.

Include:

- How plans are created
- Where temporary plans are stored
- When project memory should be updated
- Branching rules, if any
- Review expectations

Default local-only plan path:

```txt
dev_locals/plans/
```

Default local-only handoff path:

```txt
dev_locals/handoffs/
```

## 11. Deployment

Describe the current deployment setup.

Include:

- Hosting provider
- Build command
- Output directory
- Release process
- Required environment variables
- Known deployment risks

If deployment is not configured yet, write `Not configured yet`.

## 12. Current Implementation Status

Record what is currently implemented.

This section should help a future agent understand project progress without reading every old plan.

## 13. Known Constraints and Risks

List current constraints, risks, or sharp edges.

Examples:

- Cost constraints
- External API limits
- Browser support limits
- Data quality risks
- Security or privacy concerns
- Technical debt

## 14. Shared Language / Project Terms

Record project-specific terms that help agents communicate concisely and accurately.

Examples:

```txt
<term>:
<domain concept>:
<project-specific abbreviation>:
```

## 15. Project Boundaries

Record project-specific boundaries.

Examples:

```txt
Project root:
Allowed local-only paths:
External paths allowed only with approval:
```

## 16. Agent Notes

Add concise notes for future agents.

Use this section for project-specific reminders that do not fit elsewhere.

Avoid duplicating information from other sections.
