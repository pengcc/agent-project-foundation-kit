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

## Lesson: Preserve mature workflow files during theme updates

### Context

Theme 9 initially generated an update package that accidentally replaced existing mature core skill files with short stubs.

### Lesson

When a theme is intended to lightly patch existing files, preserve the original content and insert only the required section.

Large deletions or major line-count drops in existing files must be treated as high-risk destructive changes.

### Future Rule

Before applying or recommending a theme zip, compare line counts and flag large drops clearly for user review.

## Lesson: Prefer the simplest safe path

### Context

During Theme 9 recovery, bootstrapping a new apply workflow through a zip became more complex than directly replacing a single known script file.

### Lesson

If a manual operation is simpler, safer, and easier to audit than automation, prefer the manual operation.

Automation should reduce risk and mental load, not add process complexity.

### Future Rule

For isolated single-file changes, consider direct replacement plus git diff review.

Use theme zips for structured multi-file changes.

## Lesson: Prefer full-file replacement for multi-location document updates

### Context

During project memory and roadmap alignment cleanup after Theme 9, the update required several coordinated edits across documentation files.

Manual edits across multiple sections can introduce typos, missed replacements, or inconsistent wording.

### Lesson

For single-line or single-location edits, manual patching is usually simple and safe.

For multi-location documentation updates in one or more files, prefer generating the complete updated file and replacing the old file, then reviewing with `git diff`.

For structured multi-file changes, use a theme zip or full-file replacement bundle.

### Future Rule

Choose the update method based on review safety:

- single small edit: manual edit
- multiple coordinated edits in one file: full-file replacement
- multiple coordinated files: zip or full-file replacement bundle
- mature files: always verify line counts and diff before commit
