# Optional Skill Catalog and Specialist Pack Model

Status: source-repository planning documentation.

This document defines how the foundation kit evaluates future optional specialist skills and
specialist packs without adding them to the minimal core kit by default.

It is not an installer manifest, package registry, marketplace, generated package workflow, or
downstream-installed runtime file.

## Purpose

Use this catalog model to:

- make future optional specialist needs visible
- keep the minimal core kit small
- avoid pretending missing specialist skills are installed
- require evaluation before external patterns are adapted
- route actual optional skill or pack additions through explicit planning and approval

## Boundaries

This document does not:

- install optional skills
- auto-select optional packs
- define default downstream packages
- create technology-specific skills
- approve external skills for copying or adaptation
- change installer behavior
- replace `docs-first-research`, `writing-great-skills`, `plan-with-context`, or `execute-plan`

External skills and public examples remain reference candidates only until they are evaluated
through `docs-first-research` and rewritten for this kit through an approved plan.

## Core Versus Optional

Core skills are installed as part of the foundation kit because they define general project
workflow, safety, memory, planning, execution, review, audit, handoff, publishing, or skill
authoring behavior.

Optional specialist packs are future separately approved additions for project-specific,
technology-specific, domain-specific, or lifecycle-specific needs. They must not be installed by
default unless a future approved installer design explicitly supports that behavior.

Approved optional skills live under `kit/optional-skills/`, inside the installable source boundary
but outside the default mapping. They require exact explicit selection and are never installed by
default.

Reference candidates are external skills, public workflows, or observed project patterns that may
inform future kit work after evaluation. A reference candidate is not an approved optional pack.

## Candidate Categories

Future candidates may be classified by broad need rather than by immediate implementation target:

- technology or framework specialization
- domain or integration specialization
- UI quality specialization
- security or privacy specialization
- release or deployment specialization
- data or persistence specialization
- project-specific workflow specialization

Do not add real specialist pack entries until a separate approved plan defines the candidate and
its evidence.

## Candidate Metadata Shape

Use this shape when evaluating a future optional skill or specialist pack:

```txt
id:
name:
category: optional
invocation: user | model | support
required: false
depends_on:
maturity: stable | experimental | reference
install default: never | prompt | project-template-specific
dependencies:
conflicts:
required project signals:
trigger examples:
non-goals:
validation notes:
source / provenance:
license / copying risk:
adaptation status:
recommended next workflow:
```

Field guidance:

- `id`: stable local identifier for discussion and planning.
- `name`: human-readable candidate name.
- `category`: always `optional` for implemented optional skill metadata; candidate capability area
  belongs in catalog prose.
- `invocation`: whether a user, model, or supporting workflow invokes the skill.
- `required`: always `false`; optional skills require explicit adoption.
- `depends_on`: hard skill dependencies only; optional-to-optional dependencies must be explicit.
- `maturity`: readiness level for this kit, not upstream popularity.
- `install default`: default stance for downstream installation.
- `dependencies`: required core skills, rules, prompts, tools, or project conditions.
- `conflicts`: incompatible workflows, assumptions, or project states.
- `required project signals`: repo evidence that should exist before recommending the candidate.
- `trigger examples`: user requests or project situations that would activate the skill.
- `non-goals`: explicit scope boundaries.
- `validation notes`: checks future implementation should run.
- `source / provenance`: origin of any external reference or project experience.
- `license / copying risk`: copying and attribution considerations.
- `adaptation status`: current candidate state.
- `recommended next workflow`: usually `docs-first-research`, `plan-with-context`, or
  `writing-great-skills`.

## Candidate Status Values

Use these status values:

```txt
reference-only
candidate
approved-for-plan
implemented
rejected
```

Definitions:

- `reference-only`: useful for learning, not approved for adaptation.
- `candidate`: worth evaluating further.
- `approved-for-plan`: approved to plan a concrete kit change.
- `implemented`: added to this repository through an approved plan.
- `rejected`: not suitable for this kit or this project context.

## Adoption Flow

Future optional skill or specialist pack work follows this order:

```txt
detect need
-> verify source / provenance / license / external facts with docs-first-research
-> evaluate trigger, boundary, workflow fit, safety, dependencies, and conflicts
-> classify as core, optional, project-specific, reference-only, or rejected
-> create a self-contained plan with plan-with-context
-> author or refine the skill with writing-great-skills
-> implement only through execute-plan after explicit approval
-> update project memory or design log when durable facts or decisions change
```

Do not skip from a missing capability directly to implementation.

For an optional skill already implemented in this repository, downstream adoption follows this
narrower flow:

```txt
matching project signal or explicit need
-> project-specific plan
-> user approval
-> select only kit/optional-skills/<skill-name>/ with --include-optional <skill-name>
-> install only to target .codex/skills/engineering/<skill-name>/
-> validate metadata, content, dependencies, conflicts, and installed-skill routing
-> update target project memory through update-project-memory
```

This is an explicit selected-skill installer workflow. It does not authorize automatic selection,
default installation, package-manager changes, copying the whole optional tree, or installation
under `.codex/skills/optional/`, `.codex/skills/project/`, or flat `.codex/skills/<name>/` paths.
Project-owned `.codex/skills/project/` content is outside this installer workflow.

## Workflow Interactions

`initialize-project-context` may identify project signals that suggest future optional specialist
pack candidates. It must report them as candidates only and must not install or promote them.

`agent-roles-and-capabilities` routes to installed specialist skills when they exist. If a
specialist skill is missing, it uses the Missing Specialist Skill Policy and may identify a future
candidate without claiming the candidate is installed.

`docs-first-research` verifies external source facts, provenance, license/copying risk, and
technical claims before adaptation.

`writing-great-skills` authors or refines approved optional skills after the evaluation and planning
steps are complete.

`plan-with-context` plans actual optional pack additions, metadata, installer support, or catalog
changes.

`execute-plan` implements only an approved plan and must not expand optional pack scope during
execution.

The maintained installer supports exact optional-skill selection. Broader pack resolution,
automatic recommendation, and full skill-taxonomy migration remain future work requiring a
separate approved plan.

## Current Catalog

| ID | Name | Category | Maturity | Install default | Adaptation status | Recommended next workflow |
| --- | --- | --- | --- | --- | --- | --- |
| react-component-patterns | React Component Patterns | technology / framework | experimental | never | implemented | plan-with-context for explicit project adoption |
| tanstack-router-query-patterns | TanStack Router and Query Patterns | technology / framework | experimental | never | implemented | plan-with-context for explicit project adoption |

`react-component-patterns` requires React dependency or source evidence. It covers component and
local-state implementation only; Next.js, React Server Components, TanStack, shadcn/ui, Tailwind,
testing, architecture, and data fetching remain separate concerns.

`tanstack-router-query-patterns` requires explicit adoption plus a TanStack Router or TanStack
Query project signal, or an explicit user request. It covers routing, URL/search state, loaders,
navigation, server-state queries, mutations, caching, and invalidation. Other TanStack libraries,
TanStack Start, Next.js, React Server Components, backend/API/database/authentication design,
testing strategy, full frontend architecture, React local state, and visual design remain separate
concerns.
