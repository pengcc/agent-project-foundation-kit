# Force Project Architecture Plan

Use the `project-architecture-plan` skill.

You must create a project-level architecture and roadmap plan.

Before producing the plan:

1. Read and apply project memory through `project-memory`.
2. Check whether a product/project blueprint exists.
3. Check whether an `initialize-project-context` report exists or was provided.
4. Inspect repo reality: README, docs, package/config, source structure, tests, and existing local plans when relevant.
5. Use `agent-roles-and-capabilities` if installed and route through Project Architect.
6. Use `docs-first-research` for any technical judgment, version/API/config/deployment/database/security choice, or technology option comparison.
7. Use `grill-me` only when key inputs are missing and cannot be found in project files.

The output must use the fixed Project Architecture Plan structure.

Save the plan to:

```txt
dev_locals/plans/YYYY-MM-DD-project-architecture-plan.md
```

Do not:

- implement code
- change source files
- install dependencies
- commit or push
- directly update project memory
- produce feature-level implementation steps

At the end, include:

```txt
Project memory update needed: yes | no
Reason:
Suggested next workflow:
```

If durable memory updates are needed, recommend `update-project-memory`.
