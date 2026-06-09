# Project Decisions

This file records durable decisions for the `agent-project-foundation-kit` repository itself.

## Decision: Separate installable kit payload from repo development memory

### Status

Accepted

### Context

This repository develops reusable skills, templates, prompts, and rules for downstream projects. It also needs its own durable project memory while being developed.

The reusable templates under `kit/project-templates/` are intended for downstream projects and should not contain this repo's development history.

### Decision

Use two separate memory layers:

```txt
kit/
```

Installable reusable payload for downstream projects.

```txt
.codex/project/
```

Durable project memory for this repository itself.

The repo's own `.codex/project/` is committed to this repository but is not part of the installable kit payload.

### Impact

- Foundation-kit development lessons can be recorded without polluting reusable templates.
- Downstream projects receive generic templates, not this repo's history.
- Project memory skills can still be reused conceptually for this repo.

## Decision: Keep memory file names but rename memory skills

### Status

Accepted

### Context

The original skill names `project-guideline` and `update-project-guideline` were too narrow because the workflows cover guideline, decisions, and lessons.

### Decision

Rename skills:

```txt
project-guideline -> project-memory
update-project-guideline -> update-project-memory
```

Keep memory file names:

```txt
project-guideline.md
project-decisions.md
lessons-learned.md
```

### Impact

- Skill names describe workflow responsibility.
- Memory file names describe concrete content responsibility.
- Existing mental model remains clear.

## Decision: Do not commit `.codex/skills/` for this repo yet

### Status

Accepted

### Context

This repository's canonical skill source already lives under `kit/skills/`.

Committing another copy under `.codex/skills/` would create duplicate maintenance.

### Decision

Commit only:

```txt
.codex/project/
```

Do not commit:

```txt
.codex/skills/
```

for now.

### Impact

Agents should reference canonical skill sources under `kit/skills/` while developing this repo.

## Decision: Theme zips belong under `dev_locals/theme-zips/`

### Status

Accepted

### Context

Theme zip files are generated delivery artifacts used during development.

They should not clutter the repo root and should not be committed.

### Decision

Store theme zip files under:

```txt
dev_locals/theme-zips/
```

`dev_locals/` remains local-only and ignored by git.

### Impact

The helper script supports a configurable `THEME_ZIP_DIR` and can resolve either a full zip path or a filename under the default theme zip directory.
