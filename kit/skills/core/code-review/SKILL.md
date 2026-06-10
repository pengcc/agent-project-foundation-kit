# Code Review Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Code Reviewer
- Supporting roles: Test Reviewer, Security Reviewer, Tooling Reviewer, Documentation Reviewer, Architecture Reviewer as needed
- Workflow: code-review
- Maturity expectation: senior-level review judgment with pragmatic scope control
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies
```

For Plan Alignment Review, use this routing:

```txt
Role Routing:
- Primary role: Architecture / Engineering Alignment Reviewer
- Supporting roles: Project Architect, Project Planner, Code Reviewer, Documentation / Memory Reviewer, Test Strategy Reviewer, Tooling / Delivery Reviewer as needed
- Workflow: code-review
- Maturity expectation: senior-level architecture, engineering direction, and scope-control judgment
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research for framework/API/version/config claims
- Quality rule: engineering-quality-principles applies
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Purpose

Use this skill to review proposed or completed changes and produce a structured review report.

This is a review-only workflow. It does not implement changes, approve PRs, request changes on GitHub, merge, apply packages, publish, release, deploy, or update project memory.

## Review Modes

### 1. Change Review

Use Change Review when the user asks to review a concrete change set.

Primary target:

```txt
PR diff
```

Supported secondary targets:

```txt
current local diff
generated theme zip / package before applying
specific commit
branch diff
```

Change Review asks:

```txt
Is this concrete change set correct, safe, maintainable, validated, and ready to merge/apply?
```

Focus areas:

- correctness
- regression risk
- maintainability
- tests and validation
- security basics
- error handling
- project conventions
- scope creep inside the diff
- documentation impact
- project memory impact
- merge/apply readiness

### 2. Plan Alignment Review

Use Plan Alignment Review when the user asks for staged review, architecture review, engineering direction review, plan consistency review, or whether work has drifted from an accepted plan.

Plan Alignment Review asks:

```txt
Is the current implementation direction still aligned with the accepted plan, architecture, phase boundary, project goals, and project memory?
```

Focus areas:

- architecture alignment
- roadmap / phase alignment
- scope boundary
- module boundary
- data flow and integration flow consistency
- technical debt direction
- engineering quality trend
- test strategy completeness
- project memory / decisions consistency
- whether the plan needs revision

## Required Workflow Chain

Before producing a formal review report, follow the `project-memory` skill.

Use it to read and apply:

```txt
AGENTS.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
.codex/project/lessons-learned.md
```

Inspect the review target and relevant context.

Use `docs-first-research` when the review depends on external technical facts, tool or CLI behavior, API behavior, framework/version behavior, security standards, deployment behavior, CI behavior, or other facts that can change or require authoritative sources.

## Review-Only Boundary

This workflow must not:

- Modify code
- Install dependencies
- Change configuration
- Run destructive commands
- Commit changes
- Push changes
- Approve, request changes, or comment on GitHub unless the user explicitly asks for a separate write action
- Merge or apply changes
- Release or deploy
- Update project memory silently
- Produce a full executable fix plan by default
- Treat a readiness verdict as approval or merge permission

It may read project files, inspect diffs, inspect PR metadata/diff when available, inspect generated package contents, read local plans/reports, and save a review report under `dev_locals/research-notes/`.

## Truthful Workflow Declaration

Start with a concise workflow header.

```txt
Workflow:
- Role: Code Reviewer
- Skill: code-review
- Mode: Change Review | Plan Alignment Review
- Context: project-memory skill applied; review target inspected
```

Do not claim that a skill, source, file, diff, PR, package, or workflow was used unless its required steps were actually performed.

If the review target or baseline cannot be inspected, mark the report as provisional or incomplete.

## Review Target Handling

### PR diff

For PR review, inspect:

- PR title and description when available
- changed files
- diff / patch
- related plans or issue references when available
- project memory and relevant decisions

PR diff is the primary Change Review target.

### Current local diff

For local review, inspect:

```bash
git status --short
git diff --stat
git diff
```

Use the smallest meaningful diff range when possible.

### Generated theme zip / package

For generated package review, inspect:

- file list
- line counts
- new files
- overwritten files
- destructive-looking line-count drops
- mature files touched
- whether package structure matches the approved plan

Do not apply the package as part of review.

### Specific commit

For commit review, inspect:

- commit metadata
- changed files
- diff / patch
- parent context when relevant

### Branch diff

For branch review, compare against the expected base branch and inspect:

- changed files
- diff / patch
- commit scope
- related plan or PR when available

## Baseline Requirements for Plan Alignment Review

Plan Alignment Review requires an explicit baseline.

Accepted baseline sources include:

```txt
user-provided plan / architecture plan
referenced dev_locals plan
project architecture plan
project memory
project decisions
foundation design log
PR description
commit messages
roadmap / phase definition
```

Preferred baseline order:

1. User-provided plan / architecture plan
2. Referenced `dev_locals/plans/*`
3. `.codex/project/project-decisions.md`
4. `.codex/project/project-guideline.md`
5. `docs/foundation-design-log.md`
6. PR description / commit messages

If no clear baseline exists, output:

```txt
Provisional Alignment Review
```

and state what baseline is missing. Do not claim full alignment confidence.

## Severity Levels

Use these severity levels for findings.

### Blocking

Must be fixed before merge/apply. The change is unsafe, incorrect, violates accepted scope/architecture, breaks validation, or creates a serious regression/security/data/workflow risk.

### High

Strongly recommended before merge/apply. The issue has clear risk, but the user may explicitly accept the risk in rare cases.

### Medium

Should be fixed, but may be handled in the current PR or a follow-up depending on scope and risk.

### Low / Notes

Minor readability, style, documentation, maintainability, or small improvement notes. Not blocking.

## Positive Findings

Include positive findings when useful.

Positive findings should identify good patterns to keep, such as:

- clear boundary preservation
- small focused changes
- good validation
- safe error handling
- useful tests
- good docs
- effective simplification
- correct reuse of existing project patterns

## Fix Recommendations Boundary

This workflow may provide issue-specific fix recommendations.

It must not produce a full executable fix plan by default.

Use:

```txt
Fix Recommendation
```

Do not use:

```txt
Suggested Fix Plan
```

unless the user explicitly asks to switch into planning and `plan-with-context` is used.

Route follow-up work as:

- tiny isolated typo / naming / single-function cleanup: user may approve direct `execute-plan`
- multi-file fixes: use `plan-with-context`
- architecture, data, security, migration, workflow, or scope-affecting fixes: use `plan-with-context`
- changed architecture direction: use `project-architecture-plan`
- durable lesson / decision / fact: use `update-project-memory`

## Review Report Persistence

Important review reports should be saved as local-only artifacts.

Default save path:

```txt
dev_locals/research-notes/YYYY-MM-DD-code-review-<topic>.md
```

Save a full report when the review is:

- PR diff review with non-trivial findings
- Plan Alignment Review
- generated theme zip / package review
- security / data / migration / deployment / script workflow risk review
- a review that produces fix recommendations or re-plan recommendations

Saving may be skipped for:

- trivial diffs
- pure formatting changes
- quick reviews explicitly requested by the user

Full review reports are not committed by default.

Only distilled and user-confirmed facts, decisions, or lessons may be promoted into `.codex/project/` through `update-project-memory`.

## Lesson Candidates

Review reports may include lesson candidates.

Separate lesson candidates into:

```txt
Avoid
Keep
Mixed
```

### Avoid

Use for mistakes, risk patterns, or repeated failure modes to avoid.

### Keep

Use for good patterns worth preserving and reusing.

### Mixed

Use for tradeoffs, such as a pattern that is useful in one context but dangerous if overused.

Do not write lesson candidates directly into `.codex/project/lessons-learned.md`.

Recommend `update-project-memory` when the user confirms that a lesson should become durable project memory.

## Merge / Apply Readiness

The review may include an advisory verdict.

Allowed values:

```txt
Ready
Ready with notes
Needs minor fixes
Needs changes before merge/apply
Blocked
Provisional / insufficient context
```

This verdict is advisory only.

It does not approve, merge, apply, publish, or modify anything.

## Report Structure

Use this structure for formal reports:

```md
# Code Review Report: <topic>

## 1. Role Routing

## 2. Review Metadata

## 3. Review Mode

## 4. Review Target

## 5. Baseline / Context Reviewed

## 6. Summary Verdict

## 7. Positive Findings

## 8. Findings by Severity

### Blocking

### High

### Medium

### Low / Notes

## 9. Fix Recommendations

## 10. Validation Gaps

## 11. Plan Alignment Notes

## 12. Lesson Candidates

### Avoid

### Keep

### Mixed

## 13. Recommended Next Workflow

## 14. Report Save Path
```

For quick reviews, a shorter chat summary is acceptable, but important reviews should still save the full report.

## Recommended Next Workflow

End with one of these recommendations:

```txt
none / ready to merge
execute-plan for tiny isolated fix
plan-with-context from this review report
project-architecture-plan if architecture direction changed
update-project-memory for confirmed durable lesson / decision
publish-current-branch after fixes and validation
```

Always state that no implementation or fix plan was executed by the review.
