# Force Code Review

Use the `code-review` skill.

This installed downstream copy is a temporary review-report-persistence pilot. It must later be
promoted to the canonical Foundation Kit or reverted; do not extend it into unrelated tooling.

Review only. Do not implement, modify project files, approve, request changes, merge, apply,
publish, release, deploy, or update project memory unless a separate explicitly authorized
workflow is requested. The only file write allowed within this review workflow is an explicitly
authorized local review report under the approved `dev_locals/research-notes/` path.

Start by determining the review mode:

```txt
Change Review
Plan Alignment Review
```

For Change Review, prefer PR diff as the primary target when available.

For Plan Alignment Review, require an explicit baseline. If no baseline is available, output a Provisional Alignment Review and state what is missing.

Apply `project-memory`, use `agent-roles-and-capabilities` when available, and apply `engineering-quality-principles`.

Use `docs-first-research` when the review depends on external technical facts, CLI/API behavior, framework/version behavior, security standards, deployment behavior, or CI behavior.

Return the review in chat by default. Do not create or update a report file unless I explicitly
request a durable local report or a formally approved workflow explicitly requires durable
evidence or handoff. When authorized, save it only under:

```txt
dev_locals/research-notes/YYYY-MM-DD-code-review-<topic>.md
```

Do not add a local review report to project memory or Git-visible project content.

The report may include issue-specific Fix Recommendations, but must not produce a full executable fix plan by default. Route larger or unclear fixes to `plan-with-context`.

End with an advisory Merge / Apply Readiness verdict and a Recommended Next Workflow.
