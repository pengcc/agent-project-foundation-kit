# Initialize Project Context Skill

Use this skill to initialize project context after installing the foundation kit or when an existing project is first connected to agent workflows.

This skill creates a clear project initialization analysis before feature planning begins. It does not implement features and does not execute plans.

## Role

When using this skill, act as:

```txt
Project Context Initializer
```

The Project Context Initializer inspects product documents, project plans, README files, docs, configuration, scripts, code, tests, Git state, and GitHub readiness, then reports what is known, missing, risky, or blocked.

## When to Use

Use this skill when the user explicitly requests:

```txt
initialize-project-context
```

or:

```txt
Use initialize-project-context.
```

Also use it when:

- The foundation kit was just installed
- A new project is being handed to the agent for the first time
- An existing project is adopting the foundation kit
- Project memory is empty, generic, stale, or incomplete
- Product documents and repo state may be inconsistent
- The agent is about to create the first formal feature plan
- GitHub / PR / publish readiness is unknown
- Tech stack, scripts, runtime, deployment, or validation commands are unclear

## When Not to Use

Do not use this skill to:

- Implement a feature
- Execute a feature plan
- Refactor code
- Install dependencies without explicit user authorization
- Modify GitHub repo settings
- Configure branch protection or rulesets
- Create a release
- Deploy the project
- Silently write project memory

Use `plan-with-context` for feature planning.

Use `execute-plan` for approved implementation.

Use `update-project-memory` for durable project memory updates.

Use `publish-current-branch` for push / PR / merge preparation.

## Core Purpose

```txt
initialize-project-context = first project context initialization + setup readiness analysis
```

It answers:

```txt
What is this project?
What does the product or plan say?
What does the repo currently show?
Are product goals, implementation state, and technical setup aligned?
What is missing or unclear?
What must be clarified before project memory or feature planning?
What manual setup tasks remain?
What project memory updates are recommended?
```

## Required Workflow Header

Before performing initialization analysis, output:

```txt
Workflow:
- Role: Project Context Initializer
- Skill: initialize-project-context
- Context: product docs + project plan + README/docs + repo files + Git/GitHub state + existing project memory
- Mode: initialization analysis
```

If required sources are missing, state that clearly.

Do not claim to have read a file, document, source, skill, or official documentation unless it was actually read.

## Source Priority

Read and compare available sources in this order:

1. User-provided product specification or product description
2. User-provided project development plan
3. `README.md`
4. Product, architecture, planning, or design documents under `docs/`
5. Existing project memory under `.codex/project/`, if present
6. `package.json`, lockfile, and package manager indicators
7. Framework and tool configuration files
8. `.env.example` and environment documentation
9. Existing source code
10. Existing tests
11. Git state and GitHub state

Do not infer the full product only from code if product or planning documents exist. Code may be incomplete, experimental, stale, or inconsistent with the plan.

## Product / Plan vs Repo Reality Check

If a product description or project plan exists, compare it against the actual repository.

The analysis must distinguish:

```txt
Product / Plan says:
Repo currently shows:
Gap / Risk:
Question for user:
Recommended project memory update:
```

Examples:

- Product plan says authentication is required, but repo has no auth implementation: mark as gap.
- Product plan says Vercel deployment, but repo has no deployment config: mark as setup task.
- Product plan is silent, but repo uses Prisma: report repo fact and ask whether Prisma is the confirmed choice.
- Product plan says Next.js, and package.json confirms Next.js: record as confirmed repo fact.

## Internal Project Facts vs External Technical Facts

Prioritize internal project facts first.

Internal facts include:

- files that exist
- scripts that exist
- package versions in package files
- configs that exist
- code paths that exist
- tests that exist
- Git remote and branch state

External technical facts include:

- current framework behavior
- version recommendations
- compatibility rules
- deployment provider behavior
- GitHub Actions behavior
- GitHub ruleset / auto-merge behavior
- security / auth / database best practices

Use `docs-first-research` when initialization analysis involves external technical facts, version recommendations, compatibility, deployment/GitHub Actions behavior, security/auth/database choices, or external technical constraints that may be written into project memory.

Do not use `docs-first-research` just to read repo-internal facts.

If official docs are unavailable, use degraded research mode and clearly separate:

```txt
Repo fact:
Provisional recommendation:
Unverified external assumption:
```

## Capability Areas and Role Profiles

Theme 8 does not define the full role system.

During initialization, detect capability areas such as:

- Product planning
- Project architecture
- Frontend framework
- Backend runtime
- UI design
- TypeScript
- Database
- Authentication / authorization
- Testing
- Accessibility
- Performance
- Deployment
- GitHub / publishing workflow
- Code review

If an `agent-roles-and-capabilities` skill exists, use or reference it to generate Agent Role Profile Suggestions.

If that skill does not exist, only output:

```txt
Capability areas detected:
Provisional role suggestions:
Role system status: agent-roles-and-capabilities not installed
```

Do not present role boundaries as confirmed if the role system skill does not exist.

The full role taxonomy, capability boundaries, and task-to-role routing belong to a later `agent-roles-and-capabilities` skill.

## Required Project Initialization Report

Output a fixed report:

```md
# Project Initialization Report

## 1. Project Identity

## 2. Product / Plan Summary

## 3. Repo Reality Check

## 4. Tech Stack and Version Check

## 5. Scripts and Validation Check

## 6. Environment and Secrets Check

## 7. Git and GitHub Readiness

## 8. Deployment Readiness

## 9. Capability Areas Detected

## 10. Gaps, Risks, and Open Questions

## 11. Manual Setup Tasks

## 12. Recommended Project Memory Updates

## 13. Recommended Next Workflow
```

If the `agent-roles-and-capabilities` skill exists, section 9 may also include:

```txt
Agent Role Profile Suggestions:
```

If it does not exist, any role suggestions must be marked provisional.

## Save the Report

By default, save the full report to:

```txt
dev_locals/research-notes/YYYY-MM-DD-project-initialization-report.md
```

The report is local-only. It is not committed. It is not a long-term source of truth.

Long-term facts, decisions, and lessons must be written to `.codex/project/` via `update-project-memory`.

Saving is required when:

- This is first project initialization
- An existing project is first adopting the foundation kit
- The report is long
- Multiple gaps exist
- Multiple manual setup tasks exist
- Multiple open questions exist
- The user explicitly asks to save it

For a tiny project with a short initialization, conversation-only output is acceptable.

## Gap and Question Handling

When information is missing, first classify gaps and questions.

Use these categories:

```txt
Blocking before project memory update
Needed before first feature planning
Nice to clarify later
```

Do not ask a long unordered list of questions.

Ask the highest-priority blocking questions first.

Ask one tight group of related questions at a time.

Provide a recommended answer or recommended direction for each question when possible.

## Project Memory Update Proposal

Do not silently write project memory.

The report must include recommended project memory updates grouped by file:

```txt
project-guideline.md:
- Project Overview
- Current Scope
- Tech Stack and Runtime
- Scripts and Commands
- Testing and Validation
- Deployment
- Current Implementation Status
- Known Constraints and Risks

project-decisions.md:
- selected package manager
- selected framework
- selected database
- selected deployment provider
- GitHub workflow policy

lessons-learned.md:
- reusable setup lessons, if any
```

If information is clear enough, recommend:

```txt
Recommended next workflow: update-project-memory
```

If key information is unclear, mark:

```txt
Project memory update status: blocked
```

or:

```txt
Project memory update status: partial
```

Do not write guesses, unconfirmed technology choices, deployment strategy, GitHub workflow, or product goals as confirmed facts.

## Git and GitHub Readiness

Check:

- Whether the directory is a Git repo
- Current branch
- Default branch assumption
- Working tree status
- Remote origin
- GitHub repo identity if available
- GitHub CLI availability and auth if PR workflow matters
- Whether a PR workflow appears to exist
- Whether GitHub readiness is recorded in project memory

Do not automatically modify GitHub settings.

Do not configure branch protection, rulesets, required checks, or auto-merge.

If GitHub repo-level settings are unknown, record a manual setup task or recommend future setup check.

This readiness data supports later `publish-current-branch`.

## Deployment Readiness

Identify deployment facts when available:

- Deployment provider named in product plan or README
- Deployment config files
- CI/CD config
- Environment variable requirements
- Build command
- Runtime assumptions

If deployment provider or strategy is unclear, mark it as an open question.

Do not deploy. Do not create release artifacts.

## Output Expectations

Keep the report factual and structured.

Always separate:

- confirmed facts
- repo evidence
- product/plan claims
- gaps
- risks
- assumptions
- recommendations
- questions

End with:

```txt
Recommended next workflow:
```

Possible next workflows:

- `update-project-memory`
- `plan-with-context`
- `docs-first-research`
- `grill-me`
- `execute-plan`
- `initialize-project-context` after user provides missing docs
- `publish-current-branch`
- future `agent-roles-and-capabilities`
