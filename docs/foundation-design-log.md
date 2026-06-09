# Foundation Design Log

## Project Name

agent-project-foundation-kit

## Purpose

Create a reusable foundation kit for initializing new software projects with agent-ready skills, rules, prompts, and project context templates.

The kit should support a minimal usable starter workflow first, while leaving room for future expansion.

## Confirmed Decisions

### Core directory decisions

Installed agent files use `.codex/`.

v0.1 targets empty new projects.

Installable source files live under `kit/`.

Project templates live under `kit/project-templates/`.

The installer copies from `kit/` into the target project `.codex/`.

### Project memory files

Project memory files remain:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

`project-guideline.md` remains the current project source of truth.

`project-decisions.md` stores durable decisions and rationale.

`lessons-learned.md` stores reusable mistakes, debugging findings, and lessons.

### Local-only workspace

The installer creates:

```txt
dev_locals/plans/
dev_locals/handoffs/
dev_locals/scratch/
dev_locals/research-notes/
dev_locals/theme-zips/
```

The installer ensures `.gitignore` contains `dev_locals/`.

## v0.1 Core Skills

Core Required:

1. project-memory
2. docs-first-research
3. plan-with-context
4. execute-plan
5. update-project-memory
6. code-review
7. publish-current-branch

Core Productivity:

8. grill-me
9. handoff
10. write-a-skill

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
3. `project-memory` is the canonical skill for reading and applying project memory.
4. `update-project-memory` is the canonical skill for updating durable project memory.
5. Do not rename memory files in v0.1:
   - `project-guideline.md`
   - `project-decisions.md`
   - `lessons-learned.md`
6. Do not perform blind global string replacement.
7. Update affected templates, skills, prompts, metadata, rules, and this design log semantically.
8. Delete old skill directories before applying the migration zip.
9. Do not keep legacy alias skills in v0.1.
10. Old skill names may appear only in this historical design log or as part of the `project-guideline.md` filename.

## Theme 6: Foundation Kit Self Project Memory

Accepted decisions:

1. `agent-project-foundation-kit` needs its own project memory.
2. This repo's own durable project memory lives under:

```txt
.codex/project/
```

3. It records foundation-kit development facts, decisions, and lessons.
4. It is not part of the installable `kit/` payload.
5. The installer should copy only `kit/` content into downstream projects.
6. This repo's `.codex/project/` can reuse the same project-memory concepts and skills.
7. `.codex/project/` should be committed for this repo.
8. `dev_locals/` remains local-only and must not be committed.
9. Theme 6 does not create or commit `.codex/skills/` to avoid duplicating `kit/skills/`.
10. Theme 6 does not modify `kit/project-templates/AGENTS.md` or `kit/project-templates/lessons-learned.md`.

Resulting files:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
docs/foundation-design-log.md
```

## Future Ideas

- safe update for non-empty projects
- backup before overwrite
- diff before overwrite
- project-specific file protection
- skill version migration
- optional technology-specific skills
- GitHub PR creation workflow
- support for agent directories beyond `.codex/`
- optional teach workflow for learning-oriented projects
- GitHub ruleset / branch protection setup checklist
- release workflow
- deployment workflow
