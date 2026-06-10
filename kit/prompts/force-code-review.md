# Force Code Review

Use the `code-review` skill.

Review only. Do not implement, modify files, approve, request changes, merge, apply, publish, release, deploy, or update project memory unless a separate explicitly authorized workflow is requested.

Start by determining the review mode:

```txt
Change Review
Plan Alignment Review
```

For Change Review, prefer PR diff as the primary target when available.

For Plan Alignment Review, require an explicit baseline. If no baseline is available, output a Provisional Alignment Review and state what is missing.

Apply `project-memory`, use `agent-roles-and-capabilities` when available, and apply `engineering-quality-principles`.

Use `docs-first-research` when the review depends on external technical facts, CLI/API behavior, framework/version behavior, security standards, deployment behavior, or CI behavior.

For important reviews, save the full report under:

```txt
dev_locals/research-notes/YYYY-MM-DD-code-review-<topic>.md
```

The report may include issue-specific Fix Recommendations, but must not produce a full executable fix plan by default. Route larger or unclear fixes to `plan-with-context`.

End with an advisory Merge / Apply Readiness verdict and a Recommended Next Workflow.
