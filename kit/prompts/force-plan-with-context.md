# Force Plan With Context Prompt

Use this prompt when generic plan mode would otherwise bypass the installed `plan-with-context`
workflow.

Use `plan-with-context` to plan:

```txt
<replace with task>
```

This is planning only; plan creation is not execution approval. The skill owns context checks,
research triggering, clarification, artifact choice and location, plan structure, persistence, and
the waiting-for-approval status.

Do not modify production code, install dependencies, change configuration, run destructive
commands, commit, push, or update project memory silently.
