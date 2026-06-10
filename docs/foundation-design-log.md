# Foundation Design Log

## Project Name

agent-project-foundation-kit

## Purpose

Create a reusable foundation kit for initializing new software projects with agent-ready skills, rules, prompts, and project context templates.

The kit should support a minimal usable starter workflow first, while leaving room for future expansion.

## v0.1 Core Skills

Core Required:

1. project-memory
2. docs-first-research
3. plan-with-context
4. execute-plan
5. update-project-memory
6. code-review
7. publish-current-branch
8. initialize-project-context

Core Productivity:

9. grill-me
10. handoff
11. write-a-skill

`teach` and `caveman` are optional / future.

## Theme 1: Project Guideline Foundation

Theme 1 created the original project guideline foundation.

Later Theme 5 renamed the skills but kept the memory files.

## Theme 2: Docs-First Research

Accepted decisions:

1. `docs-first-research` triggers for technical judgment, versions, APIs, dependencies, configuration, deployment, testing, external services, debugging, and best practices.
2. Official documentation and project files are primary sources.
3. Model memory must not override official documentation or project reality.
4. Degraded mode can continue for low-impact local documentation work, but high-impact technical decisions require confirmation.
5. `docs-first-research` does not directly update project memory.
6. Durable findings should suggest `update-project-memory`.

## Theme 3: Plan With Context

Accepted decisions:

1. `plan-with-context` is planning-only.
2. It must apply `project-memory` first.
3. Technical plans require `docs-first-research`.
4. Skill declarations must be truthful.
5. Executable plans default to `dev_locals/plans/YYYY-MM-DD-topic.md`.
6. Saved plans use fixed sections.
7. Requirements unclear after checking available project/docs/code/config/tests/official docs require `grill-me`.
8. Plans must include a recommendation.
9. Plans wait for user approval before execution.
10. `force-plan-with-context.md` exists as a workflow trigger prompt.

## Theme 4: Execute Plan

Accepted decisions:

1. `execute-plan` only executes approved plans.
2. Generic Codex execution does not replace `execute-plan`.
3. Default input is a plan file path under `dev_locals/plans/`.
4. Execution is stepwise with validation.
5. Unverified technical assumptions trigger `docs-first-research`.
6. Execution modes are `strict` and `autonomous-within-plan`.
7. It must not silently update project memory.
8. It classifies project memory update targets.
9. It may create local commits only when included in the approved plan or explicitly requested.
10. It must not push, create PR, merge, release, or deploy.
11. Publishing must use `publish-current-branch`.
12. Execution ends or pauses with a fixed Execution Summary.
13. `force-execute-plan.md` exists as a workflow trigger prompt.

## Theme 5: Project Memory Rename Migration

Accepted decisions:

1. Rename `project-guideline` skill to `project-memory`.
2. Rename `update-project-guideline` skill to `update-project-memory`.
3. Do not rename memory files in v0.1.
4. Do not perform blind global string replacement.
5. Do not keep legacy alias skills in v0.1.

## Theme 6: Foundation Kit Self Project Memory

Accepted decisions:

1. `agent-project-foundation-kit` needs its own project memory.
2. This repo's own durable project memory lives under `.codex/project/`.
3. It records foundation-kit development facts, decisions, and lessons.
4. It is not part of the installable `kit/` payload.
5. `.codex/project/` should be committed for this repo.
6. `dev_locals/` remains local-only and must not be committed.
7. Theme 6 does not create or commit `.codex/skills/` to avoid duplicating `kit/skills/`.

## Theme 7: Publish Current Branch

Accepted decisions:

1. `publish-current-branch` publishes the current completed and validated branch into the GitHub workflow.
2. It can push the current branch, create/update PR, and prepare merge or auto-merge when supported and authorized.
3. It does not implement features, execute plans, release, or deploy.
4. It supports short trigger commands.
5. It performs lightweight runtime preflight checks.
6. If the current branch is `main` or `master`, it pauses by default.
7. If the working tree is dirty or there is no local commit, it pauses.
8. Auto-merge requires explicit authorization or known project convention, and known repo support.
9. Repo-level GitHub settings readiness belongs to `initialize-project-context` / setup check, not every publish run.
10. It does not immediately merge by default.
11. It must not bypass branch protection, rulesets, checks, or reviews.
12. It ends or pauses with a fixed Publish Summary.

## Theme 8: Initialize Project Context

Accepted decisions:

1. `initialize-project-context` is the foundation-kit installation / first project adoption workflow.
2. It runs before formal feature planning.
3. It combines product descriptions, project development plans, README, docs, configuration, code, tests, Git/GitHub state, and existing project memory.
4. It compares product/plan documents against repo reality.
5. It must identify product goals, current implementation state, tech stack, key versions, scripts, validation, deployment, GitHub readiness, missing information, and manual setup tasks.
6. It does not implement features, execute plans, refactor code, modify GitHub settings, release, or deploy.
7. Durable memory updates must be performed through `update-project-memory`.
8. Its report must distinguish:
   - Product / Plan says
   - Repo currently shows
   - Gap / Risk
   - Question for user
   - Recommended project memory update
9. It must output a fixed Project Initialization Report.
10. The report includes Project Identity, Product / Plan Summary, Repo Reality Check, Tech Stack and Version Check, Scripts and Validation Check, Environment and Secrets Check, Git and GitHub Readiness, Deployment Readiness, Capability Areas Detected, Gaps/Risks/Open Questions, Manual Setup Tasks, Recommended Project Memory Updates, and Recommended Next Workflow.
11. If `agent-roles-and-capabilities` exists, it may be used for Agent Role Profile Suggestions.
12. If that skill does not exist, role suggestions must be provisional and only capability areas are detected.
13. Full role taxonomy, capability boundaries, and task-to-role routing belong to later `agent-roles-and-capabilities`.
14. Full reports default to `dev_locals/research-notes/YYYY-MM-DD-project-initialization-report.md`.
15. Initialization reports are local-only analysis artifacts, not long-term source of truth.
16. Missing information must be classified as Blocking before project memory update, Needed before first feature planning, or Nice to clarify later.
17. It must ask high-priority blocking questions first, one tight group at a time, with a recommendation or direction.
18. It must not silently write project memory.
19. It outputs recommended project memory updates grouped by `project-guideline.md`, `project-decisions.md`, and `lessons-learned.md`.
20. It uses `docs-first-research` for external technical facts, version recommendations, compatibility, deployment/GitHub Actions behavior, security/auth/database choices, or external constraints that may be written into project memory.
21. It does not need `docs-first-research` for reading repo-internal facts.
22. `force-initialize-project-context.md` exists as a workflow trigger prompt.

Resulting files:

```txt
kit/skills/core/initialize-project-context/SKILL.md
kit/skills/core/initialize-project-context/metadata.yml
kit/prompts/force-initialize-project-context.md
docs/foundation-design-log.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
```

## Future Ideas

- safe update for non-empty projects
- backup before overwrite
- diff before overwrite
- project-specific file protection
- skill version migration
- optional technology-specific skills
- support for agent directories beyond `.codex/`
- optional teach workflow for learning-oriented projects
- GitHub ruleset / branch protection setup checklist
- agent-roles-and-capabilities
- code-review
- release workflow
- deployment workflow
