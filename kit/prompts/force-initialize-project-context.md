# Force Initialize Project Context Prompt

Use this prompt when Codex or another coding agent needs to initialize project context after installing the foundation kit or when first taking over a project.

This prompt does not replace the skill. It forces the agent to apply the skill.

## Prompt

Use the `initialize-project-context` workflow.

Do not start feature implementation.

Do not execute a feature plan.

Do not refactor code.

Do not install dependencies unless explicitly authorized.

Do not modify GitHub repo settings.

Do not release or deploy.

Your task is to inspect and analyze the project before feature planning.

Read and compare available sources:

```txt
- user-provided product specification or product description
- user-provided project development plan or roadmap
- README.md
- docs/
- existing .codex/project/ memory, if present
- package.json and lockfile
- config files
- .env.example
- source code
- tests
- Git state
- GitHub state, if available
```

If product or project planning documents exist, compare them against repo reality.

Treat an existing product plan or roadmap as initialization input, not as a conflict or a file to
replace. Preserve it, compare it with current code/config/tests, and report any gap.

Detect existing formatter/linter setup from Biome, ESLint, Prettier, package scripts, lockfiles,
and package-manager indicators. Preserve configured tooling. If none exists, recommend Biome only
as a Manual Setup Task requiring a separate approved plan; do not install or replace tooling.

Clearly separate:

```txt
Product / Plan says:
Repo currently shows:
Gap / Risk:
Question for user:
Recommended project memory update:
```

Use `docs-first-research` only when the initialization depends on external technical facts, version recommendations, compatibility, deployment/GitHub Actions behavior, security/auth/database choices, or external technical constraints that may be written into project memory.

Output a fixed Project Initialization Report:

```md
# Project Initialization Report

## 1. Project Identity

## 2. Product / Plan Summary

## 3. Repo Reality Check

## 4. Tech Stack and Version Check

## 5. Scripts and Validation Check

## 6. Environment and Secrets Check

## 7. Git and GitHub Readiness

## 8. Deployment Readiness

## 9. Capability Areas Detected

## 10. Gaps, Risks, and Open Questions

## 11. Manual Setup Tasks

## 12. Recommended Project Memory Updates

## 13. Recommended Next Workflow
```

If the `agent-roles-and-capabilities` skill exists, use or reference it for Agent Role Profile Suggestions.

If it does not exist, only output capability areas detected and provisional role suggestions.

Save the full report by default to:

```txt
dev_locals/research-notes/YYYY-MM-DD-project-initialization-report.md
```

This report is local-only and is not the long-term source of truth.

Long-term durable facts, decisions, and lessons must be written through `update-project-memory`.

Do not start feature implementation until initialization is complete and required project-memory
updates have been reviewed and approved.

Classify open questions as:

```txt
- Blocking before project memory update
- Needed before first feature planning
- Nice to clarify later
```

Do not ask a long unordered list of questions.

Ask the highest-priority blocking questions first, one tight group at a time, and include a recommended answer or recommended direction.

End with a recommended next workflow.
