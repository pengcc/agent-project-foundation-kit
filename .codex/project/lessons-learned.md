# Lessons Learned

This file records reusable lessons from developing the `agent-project-foundation-kit` repository itself.

Do not copy these lessons into `kit/project-templates/lessons-learned.md`.

## Lesson: Migration zips cannot delete old files or directories

### Context

During the project memory rename migration, the generated zip added new `project-memory` and `update-project-memory` skill directories.

However, the old directories still had to be deleted separately:

```txt
kit/skills/core/project-guideline
kit/skills/core/update-project-guideline
```

### Lesson

Zip-based theme delivery can add or overwrite files, but it does not express deletions.

For rename or migration themes, include an explicit deletion step before applying the migration zip.

### Reuse guidance

For future migration themes:

1. Identify old files and directories that must be removed.
2. Delete them before applying the migration zip.
3. Let `apply-theme-zip.sh` include deletions and additions in the same commit via `git add -A`.
4. Verify with `find` or `git status`.

## Lesson: Rename migrations must check rules as well as skills and prompts

### Context

After renaming `update-project-guideline` to `update-project-memory`, a stale reference remained in:

```txt
kit/rules/docs-first-policy.md
```

The initial migration check focused on skills, prompts, templates, and docs.

### Lesson

Rename migrations must check every installable content area, including:

```txt
kit/skills/
kit/prompts/
kit/project-templates/
kit/rules/
docs/
```

### Reuse guidance

Run a repository-wide search before and after migration:

```bash
rg "old-name|another-old-name" .
```

Then classify remaining matches as:

- valid file/path references
- historical design-log references
- stale workflow/skill references that must be fixed

## Lesson: Keep foundation-kit development lessons out of reusable templates

### Context

The foundation-kit repo has its own development lessons, but `kit/project-templates/lessons-learned.md` is installed into downstream projects.

### Lesson

Do not write this repo's development history into reusable project templates.

This repo's own durable lessons belong in:

```txt
.codex/project/lessons-learned.md
```

Reusable downstream template content belongs in:

```txt
kit/project-templates/lessons-learned.md
```

### Reuse guidance

When updating memory in a template/foundation repository, first decide whether the update belongs to:

- the repository's own project memory, or
- the reusable template shipped to future projects
