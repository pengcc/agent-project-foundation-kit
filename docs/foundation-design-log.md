# Foundation Design Log

## Project Name

agent-project-foundation-kit

## Purpose

Create a reusable foundation kit for initializing new software projects with agent-ready skills, rules, prompts, and project context templates.

The kit should support a minimal usable starter workflow first, while leaving room for future expansion.

## Confirmed Decisions

### Decision 1: Target directory

Installed agent files use:

```txt
.codex/
```

### Decision 2: Installer overwrite strategy

v0.1 targets empty new projects.

If `.codex/` does not exist, install directly.

If `.codex/` already exists, warn about overwrite risk and ask the user to confirm before continuing.

v0.1 does not support backup, diff, merge, or safe migration for non-empty projects.

### Decision 3: Project guideline location

`project-guideline.md` is not stored inside `skills/`.

It is stored at:

```txt
.codex/project/project-guideline.md
```

All core skills must read it as required context.

A separate skill exists at:

```txt
.codex/skills/core/project-guideline/SKILL.md
```

This skill defines how to maintain and update the project guideline.

### Decision 4: Workflow declaration

For explicit tasks, the agent must briefly declare:

```txt
Workflow:
- Role:
- Skill:
- Context:
- Mode:
```

The declaration should stay short.

### Decision 5: v0.1 skills

Core Required:

1. project-guideline
2. docs-first-research
3. plan-with-context
4. execute-plan
5. update-project-guideline
6. code-review
7. publish-current-branch

Core Productivity:

8. grill-me
9. handoff
10. write-a-skill

`teach` and `caveman` are optional / future, not v0.1 core.

### Decision 6: Handoff location

Handoff files default to:

```txt
dev_locals/handoffs/
```

`dev_locals/` is not committed to the repo.

If a handoff contains durable decisions or lessons, summarize them into:

```txt
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

### Decision 7: Plan location and source of truth

Plans default to:

```txt
dev_locals/plans/
```

`docs/plans/` is not a default directory.

`project-guideline.md` is the current project source of truth.

Plans are not continuously maintained after execution.

After plan execution, only results and key changes are synchronized into project guideline, project decisions, or lessons learned.

`update-project-guideline` must provide an update summary before modifying project memory files.

### Decision 8: dev_locals structure

The installer creates:

```txt
dev_locals/plans/
dev_locals/handoffs/
dev_locals/scratch/
dev_locals/research-notes/
```

The installer ensures `.gitignore` contains:

```txt
dev_locals/
```

### Decision 9: Skill details

Detailed behavior of each skill will be designed one by one after the v0.1 skill list is frozen.

### Decision 10: Source repo structure

The repo name is:

```txt
agent-project-foundation-kit
```

Installable source files live under:

```txt
kit/
```

The installer copies from `kit/` into the target project `.codex/`.

Project templates live under:

```txt
kit/project-templates/
```

## Theme 1: Project Guideline Foundation

### Accepted decisions

1. `AGENTS.md` is the short, stable agent entry point.
2. `AGENTS.md` must not contain project-specific technology stack rules.
3. Project-specific facts belong in `.codex/project/project-guideline.md`.
4. `project-guideline.md` is the current project source of truth.
5. Plans are process documents and are not continuously maintained after execution.
6. Old plans must not be treated as current project facts.
7. `project-guideline.md` should use fixed sections.
8. Agents should update existing sections before adding new ones.
9. `project-decisions.md` should use a lightweight ADR-style format.
10. `lessons-learned.md` should record reusable lessons, not one-off scratch notes.
11. `update-project-guideline` must output an update summary before changing project memory files.
12. The update summary must mention files to update, reason, major changes, impact, decisions to record, and lessons learned.

### Resulting files

```txt
kit/project-templates/AGENTS.md
kit/project-templates/project-guideline.md
kit/project-templates/project-decisions.md
kit/project-templates/lessons-learned.md

kit/skills/core/project-guideline/SKILL.md
kit/skills/core/project-guideline/metadata.yml

kit/skills/core/update-project-guideline/SKILL.md
kit/skills/core/update-project-guideline/metadata.yml
```

### Boundary

This theme does not define:

- installer implementation
- docs-first-research
- plan-with-context
- execute-plan
- code-review
- publish-current-branch
- technology-specific skills

These will be handled in later themes.

## Theme 2: Docs-First Research

### Accepted decisions

1. `docs-first-research` must trigger when a task involves technical judgment, versions, APIs, dependencies, configuration, deployment, testing, external services, debugging, or review best practices.
2. Pure wording changes, small README copy edits, and low-impact non-technical changes do not require docs-first research.
3. Sources are prioritized in four levels:
   - Level 1: official sources
   - Level 2: project sources
   - Level 3: high-quality secondary sources
   - Level 4: model knowledge
4. Official documentation and project files are the primary sources of truth.
5. Model memory must not override official documentation or project reality.
6. If official documentation conflicts with project files, the agent must report the conflict and recommend a resolution.
7. Research depth has three levels:
   - Quick Check
   - Standard Research
   - Deep Research
8. The agent should choose the smallest useful research depth.
9. Outputs must list sources, but source detail should match the research depth.
10. If official documentation is unavailable, the agent may use degraded research mode.
11. Degraded mode does not block all work. It blocks unconfirmed high-impact technical decisions.
12. For local low-impact documentation or workflow cleanup, the agent may recommend continuing after explaining that the impact is limited.
13. Project memory updates must still use the `update-project-guideline` workflow and its required summary.
14. `docs-first-research` does not directly update project memory.
15. At the end of research, the agent must state whether project memory should be updated.
16. `docs-first-research` can be used independently or as a pre-check for `plan-with-context`, `execute-plan`, `code-review`, `publish-current-branch`, and `update-project-guideline`.

### Resulting files

```txt
kit/skills/core/docs-first-research/SKILL.md
kit/skills/core/docs-first-research/metadata.yml
kit/rules/docs-first-policy.md
```

### Boundary

This theme does not define:

- plan creation structure
- execution plan tracking
- code review checklist
- publish-current-branch behavior
- installer behavior
- technology-specific official documentation lists

These will be handled in later themes.

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
