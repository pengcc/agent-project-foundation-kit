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

## Lesson: Prefer function-based shell scripts for maintainability

### Context

While improving `apply-theme-zip.sh` and `publish-local-change.sh`, later fixes could be limited to individual functions instead of rewriting the entire script.

For example, the `apply-theme-zip.sh` refresh behavior could be improved by replacing only `maybe_refresh_default_branch_after_merge()`.

### Lesson

For non-trivial shell scripts, prefer small focused functions with clear names over one long procedural script.

This makes future fixes safer because a change can often be isolated, reviewed, and tested at function level.

### Future Rule

When creating or extending project workflow scripts:

- split major steps into named functions
- keep each function focused on one responsibility
- make risky operations explicit and easy to review
- prefer replacing one function over rewriting the whole script
- keep user-facing prompts close to the function that performs the action

## Lesson: Balance automation confirmations with workflow purpose

### Context

`publish-local-change.sh` was created to handle small local changes without using a theme zip.

The first version used separate confirmation prompts for commit, push, PR creation, merge confirmation, and main refresh.

Too many prompts can make a helper script feel heavy and reduce the benefit of automation.

### Lesson

A workflow script should require confirmation at safety boundaries, not at every mechanical step.

For small local-change publishing, committing, pushing, and creating a PR can be grouped under one explicit confirmation after showing the diff.

Manual PR review and merge should remain outside the script unless explicitly authorized.

Destructive recovery actions, such as resetting local `main`, must always require a separate confirmation and backup branch.

### Future Rule

Use fewer confirmations for reversible or expected workflow steps.

Keep separate confirmations for:

- creating a branch from `main`
- committing/publishing all local changes
- post-merge verification / refresh
- any destructive or history-changing operation

Do not auto-merge PRs by default.

## Lesson: Verify remote PR state instead of trusting manual confirmation

### Context

After creating multiple PRs for helper script and theme updates, the user manually confirmed that PRs had been merged, but two PRs were still open.

The scripts treated the manual confirmation as enough to refresh local `main`.

### Lesson

Manual confirmation expresses user intent, not remote repository fact.

Before refreshing or resetting the local default branch after a PR workflow, a script must verify the PR state with GitHub CLI or GitHub API.

Only a verified `merged=true` result for the expected base branch should allow automatic default-branch refresh.

### Future Rule

Post-merge refresh flows should:

- ask for a PR number or derive it from the current branch
- call `gh pr view` or the GitHub API
- require `merged == true`
- require `baseRefName == DEFAULT_BRANCH`
- skip refresh when verification fails
- keep destructive reset behind a separate confirmation and backup branch

Do not use a plain yes/no prompt as the only source of truth for remote PR state.


## Lesson: PR workflow scripts should guide verification, not just ask yes/no

### Context

After adding PR merge verification, the first implementation still required a manually entered PR number and exited after one failed read.

This was safe but not flexible enough:

- users may type `#10`
- users may paste a PR URL
- users may mistype a PR number
- the PR may be open because the user forgot to merge it
- for very small PRs, the user may want to explicitly authorize the script to merge it

### Lesson

Post-PR workflow scripts should act as a safe PR state navigator.

They should separate:

```txt
user intent
```

from:

```txt
remote repository fact
```

and should guide the user through safe next steps instead of exiting after one failed check.

### Future Rule

A post-PR refresh flow should:

- first try to auto-detect the PR for the current branch
- fall back to manual PR number / `#number` / PR URL input
- allow a small number of retries
- display PR title, state, base branch, merged status, mergeability, and URL
- refresh the default branch only after verifying `merged=true` and `baseRefName == DEFAULT_BRANCH`
- if the PR is open, offer to re-check, open the PR in browser, skip, or explicitly merge with strong confirmation
- require a typed token such as `MERGE_PR_<number>` before any scripted merge
- avoid deleting remote branches automatically unless separately confirmed


## Lesson: Verify CLI schemas before scripting against JSON fields

### Context

A helper script used `gh pr view --json merged`, assuming that `merged` was a valid GitHub CLI JSON field.

The actual GitHub CLI field is `mergedAt`. The invalid field caused PR verification to fail even for successfully merged PRs.

The first implementation also hid the real `gh` error output, making the failure harder to diagnose.

### Lesson

Do not assume CLI JSON schemas.

Before scripting against CLI JSON output, verify available fields with official documentation, `--help`, or a direct command.

External tool errors must be surfaced during workflow automation. Do not hide stderr unless the error is expected and a clearer replacement message is printed.

### Future Rule

When using `gh pr view --json`:
- verify the requested fields first
- use `mergedAt` to detect merged PRs
- prefer explicit `--repo owner/repo` when the script already knows the repository
- print useful `gh` errors when PR lookup fails

## Lesson: File operations must stay inside explicit project boundaries

### Context

While designing the installer workflow, a local test script used a system temporary directory on macOS.

That behavior was not appropriate for this project because the foundation kit should teach and enforce safe file-operation boundaries.

### Lesson

Agents, scripts, tests, installers, and workflow helpers should operate only inside their active project root by default.

Temporary files, test runs, debug snapshots, and review artifacts should be written under project-local paths such as:

```txt
dev_locals/test-runs/
dev_locals/debug-snapshots/
dev_locals/research-notes/
dev_locals/theme-zips/
```

Do not create files in system temp directories, user home directories, other projects, or arbitrary external paths by default.

### Future Rule

Any operation outside the active project root requires:

1. exact path disclosure
2. reason
3. risk analysis
4. cleanup or rollback plan
5. user review and confirmation

The installer is a controlled exception only for copying from `repo_root/kit/` into an explicit target project root, with both source and target boundary validation.

## Lesson: Workflow scripts need local validation scripts

### Context

Several helper scripts for branch publishing, PR refresh, and GitHub CLI state checks only exposed mistakes during real usage.

Examples included unsafe assumptions about remote PR state and an incorrect `gh pr view --json` field.

Theme 12 turns that lesson into a concrete requirement for the new installer script.

### Lesson

Workflow and installer scripts should include local validation scripts for common failure modes.

Manual review is still needed, but a script that changes project files should have automated local checks for its basic safety boundaries.

Tests should not hard-code assumptions that are not guaranteed by current repo files. For example, installer tests should dynamically choose sample files from `kit/skills`, `kit/prompts`, and `kit/rules` instead of assuming a specific prompt filename exists.

### Future Rule

When adding or materially changing workflow scripts, add or update local validation scripts that cover:

- dry-run behavior
- apply behavior
- argument parsing
- expected source and target mapping
- source and target boundary checks
- conflict detection
- no silent overwrite
- backup-before-replace
- expected failure behavior
- project-local test artifact location
