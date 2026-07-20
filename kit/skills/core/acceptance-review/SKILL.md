# Acceptance Review Skill

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing. Apply its Role
Routing Display Condition. When it requires output, use:

```txt
Role Routing:
- Primary role: Acceptance Reviewer
- Supporting roles: Code Reviewer, Validation / Test Designer, Documentation Reviewer as needed
- Workflow: acceptance-review
- Maturity expectation: evidence-based delivery acceptance with pragmatic scope control
- Technical specialist skill: no technology-specific skill assumed; use repo facts and docs-first-research when needed
- Quality rule: engineering-quality-principles applies
```

## Purpose and Boundary

Use this workflow to decide whether a delivered implementation or artifact satisfies an explicit
acceptance baseline. It evaluates requirements, acceptance criteria, scope, and validation
evidence; it does not create a plan or re-evaluate every code-quality concern.

Keep workflow ownership distinct:

- `acceptance-review` evaluates delivered outcomes against an explicit baseline;
- `code-review` evaluates change quality, correctness, safety, and maintainability;
- `plan-with-context` creates or revises implementation plans.

This is review-only. Do not implement fixes, approve or merge PRs, publish, deploy, or update
project memory. An acceptance verdict is advisory and is not publication authorization.

## Required Context

Pass the Project Memory Context Gate through `project-memory`. Inspect the delivered target, the
explicit acceptance baseline, and evidence for each criterion. Apply
`engineering-quality-principles` as a review lens. When code-quality judgment is needed, use
`code-review` rather than duplicating its review contract.

## Acceptance Baseline

Require an explicit baseline. Accepted sources include:

- an approved plan;
- explicit user requirements;
- issue or PR acceptance criteria;
- referenced project decisions; or
- a named delivery specification.

If no adequate baseline exists, return `Provisional / insufficient evidence`, identify the missing
baseline, and do not infer criteria or claim acceptance.

## Evaluation

For every criterion, identify the evidence reviewed and classify it as `pass`, `fail`, `partial`,
or `cannot be verified`. Identify scope drift, material validation gaps, and whether the delivered
work is acceptable as delivered. Do not reopen settled design unless the evidence shows a
regression or unmet accepted requirement.

Return the result in chat by default. For durable report persistence, follow the current
`code-review` contract; do not create a report unless that contract authorizes it.

## Output

Use a concise result:

```md
# Acceptance Review: <topic>

## Acceptance Baseline

## Deliverable and Evidence Reviewed

## Criterion Results
| Criterion | Evidence | Result | Notes |

## Scope Drift

## Validation Gaps

## Acceptance Verdict

## Recommended Next Workflow
```

Allowed verdicts:

```txt
Accepted
Accepted with notes
Partially accepted
Not accepted
Provisional / insufficient evidence
```

End after the verdict and recommended next workflow. State that no implementation, approval,
publication, or project-memory update was performed.
