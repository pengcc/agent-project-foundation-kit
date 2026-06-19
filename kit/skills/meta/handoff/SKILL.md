# Handoff Skill

Use this skill to compact current project or session context into a local handoff document so another session or agent can continue safely.

This is a productivity workflow. It does not replace project memory, plans, issues, PRs, commits, diffs, or source-of-truth documents.

## Role Routing Integration

If `agent-roles-and-capabilities` is installed, read or apply it before continuing.

Then output a concise Role Routing Header using this default routing:

```txt
Role Routing:
- Primary role: Handoff Writer
- Supporting roles: Project Memory Curator, Documentation Writer, Project Planner as needed
- Workflow: handoff
- Maturity expectation: concise, accurate context transfer with strong source-of-truth discipline
- Technical specialist skill: no technology-specific skill assumed; use docs-first-research only if external technical facts must be verified
- Quality rule: engineering-quality-principles applies when handoff affects engineering, review, or execution continuity
```

Do not claim `agent-roles-and-capabilities` was used unless it was actually read or applied.

## Purpose

`handoff` creates a concise continuation document for future work.

It should help a fresh agent or future session understand:

- what the current goal is
- what has already happened
- which artifacts matter
- which decisions are already made
- what remains blocked or unclear
- what to do next
- which skills should be used next

A handoff is a local-only process artifact.

It is not the durable source of truth.

Durable facts, decisions, and lessons belong in project memory through `update-project-memory`.

## When to Use

Use this skill when:

- the user asks for a handoff
- a session is ending and another agent or session should continue
- work spans multiple sessions
- the current conversation is too long to continue safely without compact context
- a fresh agent needs current status, blockers, decisions, files, commands, and next steps
- the user wants a concise continuation document
- a plan, implementation, review, or debugging workflow needs to be paused and resumed later

## When Not to Use

Do not use this skill when:

- a short direct answer is enough
- durable project memory should be updated instead
- the task is finished and does not need continuation
- the requested output is a final report, not a continuation note
- the handoff would duplicate existing plans, PRDs, ADRs, issues, commits, diffs, or memory files
- sensitive information cannot be safely redacted

## Storage Location

Save handoffs under:

```txt
dev_locals/handoffs/YYYY-MM-DD-short-topic.md
```

Rules:

- Handoff files are local-only.
- Handoff files must not be committed.
- Handoff files are process artifacts.
- Handoff files are not project memory.
- Handoff files may reference project memory, plans, docs, PRs, commits, and diffs by path or URL.
- Durable facts, decisions, and lessons discovered while making a handoff should be routed to `update-project-memory`.

If `dev_locals/handoffs/` does not exist and file writing is allowed, create it.

If file writing is not available, output the handoff content and clearly state the recommended path.

## Required Context Check

Before creating a handoff, pass the Project Memory Context Gate defined in the `project-memory`
skill and include its report in the handoff context. Do not redefine the gate sequence or status
meanings here.

Then inspect task-relevant context as available:

```txt
current branch / git status summary when available
relevant docs
relevant changed files
relevant PR / commit / issue URLs if provided
```

Do not read broad unrelated code.

Do not duplicate existing artifacts. Reference them.

Use an earlier plan, handoff, report, or research note only when the user or active task identifies
it as relevant, and only after the Project Memory Context Gate freshness check. Do not scan all
local process artifacts by default.

If the user provides a specific handoff focus, optimize the handoff around that focus instead of summarizing everything.

## Handoff Content Rules

Use the Report Depth Levels from `agent-operating-contract`. Handoffs should be concise but
complete enough for safe continuation; use Detailed only when continuity risk is high.

A handoff should include:

```txt
- Handoff purpose
- Next session focus
- Current status
- Important context sources
- Decisions already made
- Open questions / blockers
- Relevant files / paths / URLs
- Suggested skills for next agent
- Recommended next steps
- Validation or checks already run
- Risks / cautions
- Project memory update needed
```

A handoff should avoid:

```txt
- long chat transcript duplication
- full plan copies
- full diffs
- full PRD / ADR copies
- secrets
- private data
- unsupported claims
- stale assumptions
```

Prefer compact, accurate context over exhaustive history.

## Suggested Skills Section

Every handoff should include a `Suggested Skills` section.

Only list skills relevant to the next step.

Use truthful status:

- installed skill
- planned / not installed
- not needed

Example:

```txt
## Suggested Skills

- project-memory: read first to recover durable project context.
- agent-roles-and-capabilities: use for role routing before workflow selection.
- grill-me: use if the next task still has unclear scope or decisions.
- plan-with-context: use if a new executable plan is needed.
- execute-plan: use only after a plan is approved.
- update-project-memory: use if durable facts, decisions, or lessons changed.
```

Do not imply a skill exists if it is not installed.

## Redaction and Safety Rules

Redact:

```txt
API keys
tokens
passwords
private keys
cookies
session IDs
personal data not needed for continuation
customer/user data not needed for continuation
local machine secrets or paths when unnecessary
```

If sensitive content is required to continue, describe how the next agent can obtain it safely instead of copying it.

Do not include private or regulated data unless the user explicitly requests it and it is necessary for the handoff.

## Output Format

Saved handoffs should use this structure:

```md
# Handoff: <short title>

## 1. Handoff Purpose

## 2. Next Session Focus

## 3. Current Status

## 4. Important Context Sources

## 5. Decisions Already Made

## 6. Open Questions / Blockers

## 7. Relevant Files / Paths / URLs

## 8. Suggested Skills

## 9. Recommended Next Steps

## 10. Validation / Checks Already Run

## 11. Risks / Cautions

## 12. Project Memory Update Needed
```

## Project Memory Follow-Up

At the end, state:

```txt
Project memory update needed: yes/no
Reason:
Suggested next workflow:
```

Use `update-project-memory` for confirmed durable facts, decisions, or lessons.

Do not silently update memory.
