# Force Execute Plan Prompt

Use this prompt when generic execution would otherwise bypass the installed `execute-plan` workflow.

Use `execute-plan` with this approved input:

```txt
<replace with approved plan path or complete approved current-conversation plan>
```

Execution mode:

```txt
strict
```

Do not execute an unapproved, incomplete, vague, or blocked plan. The skill owns readiness,
batching, validation, stop conditions, research, project-memory checks, and final reporting.

Do not push, create or update a PR, merge, release, or deploy. A local commit requires explicit
authorization in the approved execution input or request.
