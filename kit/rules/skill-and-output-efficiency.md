# Skill and Output Efficiency

## Purpose

Improve skill, rule, and agent-output efficiency without weakening behavior.

This rule is a compact review standard, not a workflow, taxonomy, or replacement for the skill
that owns a specific gate or action.

## Primary Constraint

Do not reduce intelligence, capability, or safety.

Efficiency is valid only when the resulting instructions preserve correct decisions, required
context, safety boundaries, validation, and truthful reporting. Line count and token estimates are
diagnostics, not acceptance criteria.

## PRESERVE

Preserve every instruction that materially controls:

- project-memory, approval, clarification, or external-verification gates;
- workflow scope, mutation authority, and read-only boundaries;
- validation requirements, acceptance criteria, and feedback loops;
- STOP conditions, rollback paths, and scope-drift handling;
- uncertainty, assumptions, evidence, and conflict reporting;
- project-root, global-tooling, secret, destructive-action, and external-action safety;
- planning, execution, review, handoff, publish, release, and deployment separation;
- canonical source selection and project-specific precedence;
- final-report facts required by project instructions; and
- warnings, blockers, and errors that prevent unsafe continuation.

Repeated safety language at the exact boundary where an agent might mutate state may be necessary.
Do not remove it as duplication until semantic review proves the boundary remains equally visible
and enforceable.

## COMPRESS

Compress content when behavior remains unchanged, especially:

- routine success-path progress;
- repeated rationale after the decision is already clear;
- decorative introductions, transitions, and conclusions;
- examples that repeat the same branch without adding a distinct case;
- role prose that does not change task routing or judgment;
- synonyms and restatements that add no trigger, constraint, or action; and
- details already owned by another canonical source and not needed at the current boundary.

Prefer direct instructions, stable project terms, short checklists, and references with clear
read-when conditions. Do not replace explicit behavior with vague summaries.

## DEDUP

For shared behavior, identify one canonical owner.

The canonical owner contains the complete contract. Other surfaces should use a short reference
and retain only their local trigger, boundary, or integration requirement.

Before deduplicating, verify:

1. the canonical owner exists and is available whenever the reference is used;
2. the removed text does not protect a distinct mutation or safety boundary;
3. the reference tells the agent when the canonical content must be applied; and
4. no workflow responsibility moves to a file that does not own it.

Do not create a new owner merely to reduce line count. Prefer an existing skill or rule when its
responsibility already matches.

## WARN / BLOCK

Warnings, blockers, and errors must remain complete, precise, and actionable.

Use at least:

```txt
BLOCKED: <reason>
Evidence: <file, command, or observed result>
Impact: <why safe continuation is not possible>
Next: <recommended action or workflow>
```

Add rollback, user decision, or uncertainty details when they materially affect recovery. Never
hide failed validation, missing evidence, or residual risk to keep output short.

## OUTPUT

Routine success-path updates may use terse fragments when the meaning is unambiguous:

```txt
Context gate: passed
Validation: pending
Next: scoped tests
```

Boundary updates must preserve the state, evidence, impact, and next action relevant to the
decision. Final reports must retain changed scope, validation result, risk or blockers, durable
memory or documentation status, external/global actions, and the next recommended workflow when
project instructions require them.

Use the smallest report depth that preserves correctness and decision quality. Concision does not
authorize omission.

## Compression Review

Before compressing mature skill, rule, prompt, or AGENTS content:

1. list safety-critical and capability-critical behavior;
2. identify canonical owners for proposed deduplication;
3. separate success-path verbosity from failure-path requirements;
4. define regression scenarios for gates, validation, drift, warnings, and workflow handoffs;
5. make a small pilot change;
6. compare semantics and protected boundaries before and after; and
7. broaden only after the pilot passes review and validation.

Stop when a proposed reduction makes triggers, ownership, evidence, validation, or failure handling
less explicit. Restore the original wording or return to planning instead of accepting capability
loss for a smaller file.

## Non-Goals

This rule does not require short skills, numeric token targets, broad rewrites, new abstraction
layers, or uniform output templates. Longer content is justified when it carries distinct,
frequently needed behavior or protects a high-risk boundary.
