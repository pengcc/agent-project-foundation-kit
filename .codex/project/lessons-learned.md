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

For small local-change publishing, committing, pushing, and creating a PR can be grouped under one
explicit confirmation after showing the complete staged, commit, or PR scope.

Manual PR review and merge should remain outside the script unless explicitly authorized.

Destructive recovery actions, such as resetting local `main`, must always require a separate confirmation and backup branch.

### Future Rule

Use fewer confirmations for reversible or expected workflow steps.

Keep separate confirmations for:

- creating a branch from `main`
- committing/publishing all local changes
- post-merge verification / refresh
- any destructive or history-changing operation

Do not auto-merge PRs by default. A narrowly classified `SMALL_SAFE` path may use classification as
explicit authorization only after complete scope visibility and confirmation. It must still merge
through a PR, preserve GitHub rule enforcement, verify the remote merged state, and refresh the
default branch only afterward.

Remote automation can complete after a local polling timeout. A rerun must inspect the existing PR
before declaring there is nothing to publish, and may refresh only after verifying `mergedAt` and
the expected default-branch base.

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

## Lesson: Avoid TSV parsing for optional CLI fields

### Context

The post-PR refresh flow used `gh pr view --json ... --jq ... | @tsv` and parsed the result with Bash `IFS=$'\t' read ...`.

When `mergedAt` was empty, Bash treated tabs as IFS whitespace and collapsed the empty field. That shifted later fields, causing the PR URL to be interpreted as the base branch.

### Lesson

Avoid TSV parsing in Bash when fields may be empty.

Use a delimiter that is not IFS whitespace, such as ASCII unit separator, or use a safer structured parser.

### Reuse guidance

For future workflow scripts:

- avoid `@tsv` when optional fields can be empty
- avoid tab as an IFS delimiter for data that may contain empty fields
- verify parsing behavior with open and merged PRs
- surface CLI stderr when automation fails

## Lesson: Shell traps should not depend on local variables after function return

### Context

`apply-theme-zip.sh` set an EXIT trap inside `main()` using local variable `tmp_dir`.

The trap ran after `main()` returned. Under `set -u`, the local variable was no longer available, causing:

```txt
tmp_dir: unbound variable
```

### Lesson

Do not rely on function-local variables inside EXIT traps that run after the function returns.

Use a global cleanup variable plus a cleanup function, or ensure the trapped variable remains in scope.

### Reuse guidance

For future shell scripts:

- use `cleanup()` functions for traps
- store cleanup paths in script-level variables
- guard cleanup variables with `${var:-}`
- test script self-update cases separately when a script updates files it has already sourced or executed

## Keep: Use smoke-test zips for workflow script verification

### Context

After fixing `apply-theme-zip.sh`, a small throwaway smoke-test zip was used to verify that the updated script could run the apply / skip commit / delete zip / skip PR refresh flow without repeating the previous cleanup error.

### Pattern

Use a tiny, low-risk zip package to validate workflow script behavior before applying a meaningful theme patch.

### Why it worked

It separated script validation from real repo content changes.

It also made cleanup simple and reduced the chance that a script bug would damage mature files.

### Reuse guidance

When a workflow script changes, test it with a small disposable package before trusting it with a real theme zip.

## Keep: Test Git and GitHub workflows with deterministic fake CLIs

### Context

Theme 16.1 needed coverage for branch creation, staging, pushing, PR creation, merge modes,
typed confirmations, and post-merge refresh without changing a real remote repository.

### Pattern

Use project-local fixtures with fake `git` and `gh` executables that record commands and
return controlled repository and PR states.

### Reuse guidance

Use deterministic fake CLIs for automated safety-path coverage, then keep a short disposable
manual smoke checklist for behavior that depends on the real GitHub CLI and repository settings.

## Keep: Put reusable workflow mechanics in the installable payload

### Context

The mature publish workflow originally lived only in the foundation-kit source repository. Keeping
a separate downstream implementation would create immediate behavior drift.

### Pattern

Use one canonical implementation under `kit/scripts/`, install it under `.codex/scripts/`, and keep
source-repository commands as thin wrappers that delegate to that implementation.

### Reuse guidance

- keep workflow strategy and authorization in skills
- keep repeatable Git and GitHub mechanics in installable scripts
- test both direct execution and source-wrapper delegation
- copy complete script trees through the installer
- do not silently modify downstream package-manager configuration

## Avoid: Claiming a plan was saved when writes were blocked

### Context

A planning response can render a complete plan while Plan Mode or the active tool environment
prevents the expected write under `dev_locals/plans/`.

### Lesson

Rendered plan content is not evidence that a plan file exists. Claiming persistence without a
successful write can mislead later workflows, especially `execute-plan`, into depending on a
nonexistent artifact.

### Reuse guidance

- report blocked file writing explicitly
- show the exact intended plan path
- provide the complete plan content or a clear save-later action
- verify persistence before reporting a saved path
- keep review and explicit execution approval as separate workflow steps

## Keep: Separate runtime migration from default workflow cutover

### Context

Theme 17.3 added a modular Node.js publish CLI, Theme 17.4 validated representative real usage,
and Theme 17.5 moved the source-repository default to Node while retaining Bash as a known
fallback.

### Lesson

Installing a replacement implementation is not sufficient evidence for switching the primary
command. Runtime packaging, parity tests, installer behavior, legacy regression coverage, and
human-readable CLI output all need independent validation. The default cutover and eventual
fallback removal should also remain separate decisions.

### Reuse guidance

- keep migration candidates callable through an explicit secondary command
- retain the current fallback until automated parity and manual output review are complete
- retain a tested explicit fallback after default cutover until removal is separately approved
- keep both implementations in the aggregate validation command during the overlap period
- require several successful real default-path updates after cutover before considering fallback
  removal
- do not make installed scripts depend on packages the installer does not provide
- use built-in conservative defaults when optional policy parsers are unavailable
- base post-merge recovery on verified repository state, not update classification
- treat external policy as configuration and enforce safety invariants in code
- confirm the staged index tree, then verify it is unchanged immediately before commit
- stage only paths observed during scope collection so new files cannot enter silently
- compare the confirmed index to the upstream comparison ref rather than `HEAD`, so prior unpushed
  commits remain visible in the complete publish scope

## Keep: Smoke-test scope drift by mutating the worktree after collection

### Context

Theme 17.4 manually exercised the Node publish candidate by changing the worktree after the CLI
collected its preliminary scope.

### Lesson

Scope-integrity safeguards are more credible when a smoke test deliberately creates the race they
must block. The Node CLI detected the changed worktree and stopped before publishing, confirming
that a stale scope confirmation cannot silently include later edits.

### Reuse guidance

- include one deliberate post-collection mutation in manual smoke tests for publish tooling
- verify the command aborts before commit, push, PR creation, or merge
- treat a successful smoke run as validation evidence, not automatic approval to replace the
  existing default workflow

## Keep: Separate output invariants from theme choices

### Context

The publish CLI supports configurable level colors and label-only versus full-line rendering, but
all level labels need consistent emphasis across themes.

### Lesson

Theme config should contain only genuine presentation choices. Bold level labels are an output
invariant, not a per-level preference, so exposing `boldLabel` would create unnecessary states and
allow themes to weaken a stable usability rule.

### Reuse guidance

- keep fixed semantic or accessibility behavior in rendering code
- keep theme schemas limited to intentional variation points
- validate external config strictly and fall back to matching built-in defaults
- preserve tested visual behavior when extracting hard-coded values into config
- keep the canonical table in one machine-readable source instead of duplicating it across docs

## Keep: Prepare installer writes completely before crossing the target boundary

### Context

Theme 18.1 adds a Node installer candidate that may replace many downstream files. Authorizing an
overwrite is insufficient if staging, backup collection, or the source/target plan can still fail
after destination writes begin.

### Lesson

Treat installer apply as a preparation phase followed by a distinct destination-write phase.
Before crossing the target boundary, verify authorization, every staged replacement, every
required backup snapshot, and the complete current plan. Revalidate again after materializing a
backup and before mapped payload writes.

Source-only tools may reuse installable helper modules at runtime without becoming part of the
installed payload. Ownership follows the entrypoint and mapping contract, not the location of
every imported helper.

### Reuse guidance

- keep dry-run free of temporary and destination writes
- stage replacements and backup snapshots outside the destination
- hash-verify preparation artifacts before destination writes
- accept exact destructive confirmation over both interactive and piped input
- record partial progress without claiming automatic rollback
- keep optional preview tools non-blocking
- test candidate and fallback implementations together before cutover
- exercise the candidate in a real downstream installation scenario before considering cutover
- treat a successful downstream smoke test as dogfooding evidence, not default-switch approval
- fix candidate defects in the candidate implementation when its architecture remains sound
- separate candidate introduction, default cutover, and fallback removal decisions

## Mixed: Reassess the runtime before shell glue becomes a workflow engine

### Context

The publish and installer workflows began as Bash automation and later accumulated structured
state, interactive decisions, path-boundary enforcement, backup preparation, recovery behavior,
and extensive deterministic tests. Node migrations ultimately provided clearer module boundaries
and more focused testability.

### Lesson

Bash remains effective for small, linear command glue such as the historical apply-theme workflow.
The source repository now treats that Bash helper as archived source-only history, while active
workflow tooling is Node-first. Once a script owns substantial state or safety-critical
orchestration, continuing to add shell branches can make correctness and local testing
disproportionately difficult.

Runtime reassessment should happen when complexity signals first appear, not only after a large
script becomes expensive to replace. Agents should surface the tradeoff, research an appropriate
runtime, and plan migration while retaining a clear rollback or archival boundary.

### Reuse guidance

- keep shell for bounded command composition where its model remains clear
- reassess when structured data, interactive prompts, backups, path security, recovery, or
  cross-step state become central
- warn the user when runtime complexity is becoming a maintenance risk
- migrate through candidate, validation, cutover, and archive stages rather than one irreversible
  replacement
- label archived implementations as unsupported and keep them outside installable payloads
- preserve active Bash exceptions only when their ownership and validation remain explicit

## Keep: Diagnose runtime boundaries without silently repairing global tooling

### Context

After Theme 18.2, the globally resolved Node version differed from the project runtime.
Investigation found duplicated or misordered shell profile configuration and PATH ordering. The
problem was local machine configuration, not a Codex operation or repository change.

### Lesson

The reusable lesson is boundary clarity, not blame. A project can correctly declare and provide a
runtime while the interactive shell resolves a different global executable.

Agents should use read-only diagnostics to distinguish those states, then report the mismatch.
They must not silently edit shell profiles, change PATH, relink package-manager tools, or install a
global runtime merely to make validation pass.

### Reuse guidance

- report detected and required versions together
- include the failing command and resolved executable path when available
- distinguish project-local runtime configuration from global shell resolution
- recommend manual remediation and explain machine-wide risk
- require explicit user approval before any global or out-of-project mutation
- record external/global actions explicitly in every final report
- state clearly when an observed machine issue was not caused by the agent

## Avoid: Treating stale process artifacts as execution authority

### Context

Local plans, handoffs, reports, research notes, and execution logs may describe workflows or files
that were valid when written but have since been replaced, removed, or archived.

### Lesson

Check a process artifact's status, date, and source-of-truth alignment before using it. Plans older
than one day must not be proactively treated as execution authority unless the user explicitly
names the plan and current project sources re-verify it.

If an artifact conflicts with the project guideline, project decisions, current repository state,
or current package scripts, stop and request user review rather than choosing the stale artifact.

### Reuse guidance

- prefer `AGENTS.md`, project memory, current repository files, and current package scripts
- verify that named targets still exist and remain maintained
- distinguish historical design records from present-tense operating guidance
- mark superseded artifacts as superseded, deprecated, or archived
- move obsolete artifacts to an archive path when relocation improves clarity without losing
  useful history

## Avoid: Continuing a plan after its objective is satisfied

### Context

The existing-project upgrade initiative reached its safety objective after WI-1/WI-2 and
downstream validation, but planning continued into optional runtime architecture because later
items remained in the original plan.

### Lesson

A multi-work-item plan is not a completion checklist. Before continuing a deferred item, compare
the original objective and non-goals with completed evidence. If the objective is already
satisfied, close out or re-scope. Continue only for a concrete unresolved gap with clear value.

### Reuse guidance

For old or multi-work-item plans:

- summarize completed evidence;
- classify remaining work as must-have, nice-to-have, or future;
- treat architecture, automation, and convenience work as optional unless evidence makes it
  necessary;
- use relevant lessons as stop conditions before planning the next slice.

## Avoid: Editing handoff wording before modeling workflow states

### Context

The publishable-change handoff needed successive corrections because PR creation for review was
initially conflated with the post-review merge or final publication action.

### Lesson

Before optimizing a handoff or reporting template, model its states, transitions, actors, and
authorization boundaries. Wording should follow that model; otherwise a small phrase can invert
the intended sequence or place approval at the wrong transition.

### Reuse guidance

- distinguish preparation, review, PR creation/update, merge, release, and deployment states;
- identify which transition each command performs;
- place explicit authorization at the transition that causes the external side effect;
- test state order and forbidden implications, not only the presence of preferred phrases.

## Keep: Deliberately distill generic lessons while retaining source history

### Context

PR #81 reviewed foundation-kit development lessons in this file and deliberately distilled the
generic change-safety subset into `kit/rules/engineering-quality-principles.md` section
`Change Safety and Evidence`, while retaining repository-specific history here.

### Pattern

Keep repository-specific context and history in this source-repository memory. Promote only the
general principles that are useful across downstream projects:

- prefer the simplest safe path;
- preserve mature files unless full replacement is explicitly justified;
- treat large deletions, line-count drops, and stub replacements as destructive-risk signals;
- search repository-wide before and after rename or migration work;
- choose the update method by review safety;
- verify remote or external facts through authoritative evidence;
- treat manual confirmation as intent, not proof of external fact;
- place confirmations at safety boundaries rather than every mechanical step.

`kit/project-templates/lessons-learned.md` remains a blank downstream template and was not
prefilled with this repository's history.

### Reuse guidance

Future generic lessons should be reviewed, generalized, and deliberately distilled into the
appropriate reusable rule, skill, or documentation. Do not copy project memory automatically.

## Theme 23 Lessons

- External skills should be distilled into native foundation-kit workflows instead of copied
  wholesale.
- Debugging workflows need an explicit feedback loop before proposing fixes.
- Large plans benefit from vertical work-item slicing before execution.

## Keep: Classify migration collisions before treating new paths as safe

### Context

Installer planning can see a missing destination while the same logical skill already exists in a
legacy kit-managed namespace.

### Lesson

New-by-path is not automatically safe. Before writing a newly mapped skill destination, check the
bounded kit-managed legacy namespaces and surface collisions for migration review. Keep
project-owned namespaces outside installer ownership rather than broadening collision scans.

### Reuse guidance

- distinguish byte state, ownership, and migration state
- make zero-overwrite apply filter on an explicit safe-write action
- preserve identical files as safe skips, not conflicts
- keep collision checks bounded to paths the tool actually manages
- enforce no-replace semantics again at the final filesystem write

## Keep: Make pre-execution readiness observable before mutation

### Context

An execution workflow can complete its internal approval, memory, repository, PR, and tooling
checks without giving the user a concise account of what was verified and how implementation will
proceed.

### Lesson

Checks that are not surfaced are difficult to verify and easy to misinterpret as skipped. Before
execution mutates repository state, report the approved source, readiness result, relevant unknowns,
planned implementation groups, and stop conditions. Report unavailable or irrelevant checks
truthfully instead of filling gaps with assumptions.

The report is an observability boundary, not authorization for publishing or unrelated actions.

### Reuse guidance

- summarize readiness rather than dumping the full checklist
- distinguish verified, not applicable, and not checkable states
- derive staged groups and stop conditions from the approved plan
- keep project-specific branch, PR, and runtime requirements conditional
- separate local execution setup from push, PR, merge, release, and deployment authority

## Keep: Treat installed workflow scripts as project automation after customization

### Context

A downstream project may adapt an installed helper script to its own repository, CI, validation,
or publishing conventions. The source kit can no longer assume a differing installed copy is an
ordinary reusable file.

### Lesson

Installation origin does not permanently determine ownership. When a mapped script differs in an
existing project, preserve it and surface a manual merge/review boundary. A new or byte-identical
script can still use normal installation behavior.

### Reuse guidance

- classify content state separately from workflow ownership
- distinguish customized automation from ordinary reusable-file differences
- preserve differing scripts in zero-overwrite modes
- keep destructive replacement behind existing backup and explicit confirmation safeguards
- do not confuse installer script classification with authorization to publish or change remote state

## Keep: Optimize boundary density, not line count

### Context

A first-phase audit of high-frequency skills, rules, and the downstream AGENTS entrypoint found
both short canonical files and long boundary-heavy files. Length alone did not distinguish
low-value repetition from instructions that preserve routing, validation, mutation authority, or
safe failure handling.

### Lesson

Evaluate instruction efficiency by behavioral value. Compress routine success output and
duplicated rationale, but preserve complete gates, validation, STOP conditions, workflow
handoffs, uncertainty, and actionable failure evidence.

Repeated wording at an exact mutation or safety boundary may be necessary even when the canonical
concept lives elsewhere. Deduplicate only after confirming that a short reference preserves
availability, timing, ownership, and enforcement.

### Reuse guidance

- treat line and token counts as diagnostics, not acceptance criteria
- inventory safety-critical and capability-critical behavior before editing mature content
- identify the canonical owner before removing duplicated explanations
- compare semantics and regression scenarios before and after a small pilot
- keep warnings and blockers complete even when normal progress is terse
- stop when a smaller file makes a decision or failure path less explicit

### Related files

```txt
kit/rules/skill-and-output-efficiency.md
dev_locals/research-notes/2026-06-20-capability-preserving-skill-efficiency-audit.md
```

## Keep: Structure foundation-kit payload by capability surface

### Context

Foundation-kit installer reports needed to make a large mapped payload easier to review while
keeping existing classification, ownership, and write policy unchanged. Future profiles were a
plausible adjacent use, but were not required to improve the current report.

### Lesson

Static, report-only grouping by capability surface is acceptable cheap structural optionality for
the foundation-kit payload. It creates useful vocabulary and preserves independent ownership and
policy axes without selecting files, authorizing replacement, or changing installation behavior.

Profiles, profile switching, package-manager behavior, dependency solving, and manifest migration
remain deferred speculative implementation until concrete evidence shows that static grouping
alone is insufficient.

### Reuse guidance

- group mapped payload by the capability it provides, not by current conflict outcome
- keep ownership, classification, and write authorization separate from reporting groups
- prefer static report projections before adding installation-selection behavior
- revisit profiles or package behavior only for a verified use case that grouping cannot satisfy

### Related files

```txt
scripts/install-foundation-kit/payload-groups.mjs
scripts/install-foundation-kit/final-report.mjs
```
### Lesson 2026-07-02: Add product framing before planning when implementation drifts from user intent

- Context: Some implementation tasks started from feature ideas, UI mechanics, data states, or technical changes before the concrete user need and use case were fully clarified.

- Problem: Agents could produce technically coherent plans or implementations that satisfied the described mechanism but still diverged from the user's intended product behavior. The mismatch often appeared late, during review, when checking defaults, empty states, view-mode behavior, legends, or UI interpretation.

- Root cause: The workflow lacked a reusable product-framing gate before planning and execution. Requirements were sometimes expressed as implementation mechanics rather than user-facing goals, decisions, valid states, invalid states, and concrete examples.

- Resolution: Introduce and use a Product Framing Review step before `plan-with-context` or implementation whenever a task may affect user-visible behavior, product semantics, data interpretation, view modes, empty states, legends, warnings, or UI meaning.

- Reuse guidance: For Foundation Kit workflows, add a lightweight Product Framing Review Skill that asks what problem, question, or decision brings the user to the page/mode/workflow; separates user-facing concepts from implementation mechanics; records valid and invalid states; and marks readiness before planning. Use concrete use cases as evidence when ambiguity could change implementation direction.

### Related files
Product Framing Review Skill; plan-with-context workflow; execute-plan workflow; project-memory workflow

```txt
kit/skills/meta/plan-with-context/SKILL.md
kit/skills/meta/agent-roles-and-capabilities/SKILL.md
kit/skills/meta/plan-with-context/SKILL.md
```
