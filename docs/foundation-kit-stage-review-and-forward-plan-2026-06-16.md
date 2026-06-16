# Foundation Kit Stage Review and Forward Plan

Date: 2026-06-16  
Repository: `pengcc/agent-project-foundation-kit`  
Report status: local planning / audit artifact, not durable project memory  
Recommended save path in repo: `dev_locals/research-notes/2026-06-16-foundation-kit-stage-review-and-forward-plan.md`

## 1. Purpose

This report is a stage-level review of the current `agent-project-foundation-kit` after the recent additions through Theme 21.1. It combines:

- the local `Core Foundation Alignment Research Report` dated 2026-06-16,
- the current `docs/foundation-kit-skills-review-and-optimization-roadmap.md`,
- current project memory and canonical workflow boundaries,
- current source-repository entrypoints, rules, and core skills.

The goal is not to continue adding features immediately. The goal is to check whether the kit now needs simplification, whether new instructions conflict with older instructions, whether workflow calls may block each other, and what the safest next planning step should be.

## 2. Workflow / Role Context Used

Project Memory Context:

```txt
Gate: passed
Files checked:
- root AGENTS.md
- kit/skills/core/project-memory/SKILL.md
- .codex/project/project-guideline.md
- .codex/project/project-decisions.md
- local Core Foundation Alignment Research Report
- docs/foundation-kit-skills-review-and-optimization-roadmap.md
- agent-operating-contract
- key workflow skills: plan-with-context, execute-plan, code-review, codebase-audit, docs-first-research, update-project-memory, write-a-skill, agent-roles-and-capabilities
Memory status: sufficient; update recommended after the next implementation theme because roadmap/current-state facts have drifted
```

Applied workflow perspectives:

- `codebase-audit`: repository-level, read-only survey and prioritization.
- `docs-first-research`: external / source report and roadmap comparison.
- `code-review`: consistency and boundary review of current skill instructions.
- `write-a-skill`: skill structure and trigger/boundary review.
- `project-memory`: source-of-truth and current-state reconciliation.

No repository files were modified by this report.

## 3. Executive Summary

The foundation kit has grown substantially, but the growth is still mostly healthy. The current problem is not that there are too many skills. The stronger risk is that the documentation layer and inventory layer are starting to drift after many successful themes.

The most important conclusion:

> Do not start the full Phase 4 implementation yet. First perform a small status, inventory, and roadmap refresh theme.

Recommended next theme:

```txt
Theme 22.0: Stage Review, Inventory, and Roadmap Refresh
```

This should be a documentation-only cleanup that updates the roadmap, canonical inventory, and current-state records after Themes 19, 20, 21, and 21.1. After that, continue into a smaller Phase 4 split:

1. Theme 22.1: Third-Party Skill Adoption Safety
2. Theme 22.2: Kit Evolution / Reusable Lesson Promotion Loop

Do not combine all of Phase 4, UI quality, architecture review, optional skill catalog, and specialist skills into one large theme.

## 4. Current State Snapshot

### 4.1 Current completed themes

Project memory now records completed work through Theme 21.1:

- Theme 19: core foundation alignment after Project Memory Context Gate
- Theme 20: plan, execute, and review quality hardening
- Theme 21: read-only codebase audit foundation
- Theme 21.1: supporting skill invocation and skill authoring verification

### 4.2 Current canonical workflow stack

The current workflow stack is now layered as follows:

1. Source / downstream entrypoints
   - root `AGENTS.md` for this source repo
   - `kit/project-templates/AGENTS.md` for downstream projects
   - `kit/rules/agent-operating-contract.md`

2. Context and memory
   - `project-memory`: durable memory reader/applicator and Project Memory Context Gate
   - `update-project-memory`: confirmed durable memory writer/curator

3. Role and routing
   - `agent-roles-and-capabilities`
   - supporting skill invocation concept added in Theme 21.1

4. Planning and execution
   - `plan-with-context`
   - `project-architecture-plan`
   - `execute-plan`

5. Review and audit
   - `code-review`: concrete diff / PR / package / branch / plan-alignment review
   - `codebase-audit`: read-only repository survey and prioritized finding discovery

6. Supporting productivity workflows
   - `docs-first-research`
   - `grill-me`
   - `handoff`
   - `write-a-skill`
   - `publish-current-branch`
   - `initialize-project-context`

### 4.3 Current tooling boundary

The maintained source-repository tooling remains clear:

- Node publish CLI: `kit/scripts/publish-changes.mjs`
- Node installer: `scripts/install-foundation-kit.mjs`
- active source-only Bash helper: `scripts/apply-theme-zip.sh`
- archived legacy Bash workflows under `archive/legacy-bash-workflows/` are historical only

The current `package.json` still provides the expected validation and publish commands:

```txt
pnpm publish:local
pnpm publish:pr-only
pnpm publish:merge-pr
pnpm install:node
pnpm check
```

## 5. Major Strengths

### 5.1 Core workflow boundaries are clearer than before

The kit now has strong workflow separation:

- `plan-with-context` is planning-only.
- `execute-plan` executes only an approved plan.
- `code-review` is review-only and advisory.
- `codebase-audit` is read-only and does not generate executable fix plans.
- `update-project-memory` owns durable memory writes.
- `publish-current-branch` owns push / PR / merge workflows.

This separation is the main value of the kit and should be preserved.

### 5.2 Project Memory Context Gate is centralized

The Project Memory Context Gate is defined in one canonical location: `project-memory`. Other workflows now refer to it rather than redefining the full sequence. This reduces drift risk.

### 5.3 Plan / execute / review quality now has real contracts

Theme 20 and Theme 21.1 added important safety contracts:

- plans must be self-contained enough for a fresh agent,
- changed hunks must map to the approved plan,
- supporting skills must be explicitly read/applied before being claimed,
- supporting skills cannot override the approved plan boundary,
- review distinguishes introduced vs pre-existing findings.

### 5.4 Codebase audit fills a real gap without bloating code-review

The addition of `codebase-audit` is useful because it keeps repo-wide surveys separate from diff review. This is a healthy split.

### 5.5 External skills are treated as references, not authority

The local Core Foundation Alignment Research Report correctly established that Vercel Labs and Obra patterns should be used as selective inspiration, not imported wholesale. Current `docs-first-research` and `write-a-skill` now reflect that direction.

## 6. Main Findings

### Finding 1 — Roadmap has become partially stale

Severity: High  
Category: documentation consistency / future planning risk  
Confidence: high

Evidence:

- The roadmap says it is a long-term reference and not an approved implementation plan.
- The roadmap current core skill list still omits `codebase-audit`, even though the strategic direction section and project memory now include it.
- The roadmap still has older “future” wording for some work that has since been implemented, while later sections correctly mark Theme 19, Phase 2, and Phase 3 as implemented/current.
- Section 16 still positions Theme 21.1 as the next step, even after Theme 21.1 has been reviewed/merged.

Impact:

Future agents may incorrectly treat already-completed themes as pending, or may use older roadmap sections instead of current project memory.

Recommendation:

Create a docs-only roadmap refresh before starting new substantive Phase 4 work.

### Finding 2 — Project guideline rule inventory is inconsistent

Severity: High  
Category: source-of-truth consistency  
Confidence: high

Evidence:

`.codex/project/project-guideline.md` currently lists only `engineering-quality-principles` under “Current canonical core rules.” But current repo rules include at least:

```txt
kit/rules/agent-operating-contract.md
kit/rules/docs-first-policy.md
kit/rules/engineering-quality-principles.md
```

The roadmap correctly lists these three as current core rules.

Impact:

Agents using project memory as the current source of truth may miss `agent-operating-contract` and `docs-first-policy` as canonical rules.

Recommendation:

Patch `.codex/project/project-guideline.md` to list all current canonical rules. Keep the list short and factual.

### Finding 3 — Root AGENTS commonly relevant skills list is slightly behind the current skill set

Severity: Medium  
Category: entrypoint consistency  
Confidence: medium

Evidence:

Root `AGENTS.md` lists commonly relevant skills but does not include some now-important current skills such as `project-architecture-plan`, `codebase-audit`, or `publish-current-branch` in that specific list, while other files route those workflows.

Impact:

This is not blocking because `agent-operating-contract` and role routing are stronger sources for skill routing. However, it may reduce discoverability for future agents starting from root `AGENTS.md`.

Recommendation:

Do not bloat root `AGENTS.md`. Either:

- leave it as “commonly relevant” and accept it is not exhaustive, or
- change the wording to “examples include” and point to `agent-operating-contract` as the complete routing map.

Avoid adding a long full skill list to root `AGENTS.md`.

### Finding 4 — Supporting skill invocation is good, but publish mapping needs a guardrail

Severity: Medium  
Category: workflow boundary ambiguity  
Confidence: medium/high

Evidence:

`execute-plan` now maps bounded substeps to supporting skills, including:

```txt
publishing -> publish-current-branch
```

But `execute-plan` also says it must not push, create PRs, merge, release, or deploy; push / PR / merge require explicit `publish-current-branch`.

Impact:

A future agent might misunderstand “publishing -> publish-current-branch” as permission to run publishing inside execute-plan. The intended behavior is likely: stop/route/switch to `publish-current-branch` after explicit user approval, not silently publish as an execution substep.

Recommendation:

In a small future patch, clarify that `publish-current-branch` is a workflow transition or recommended next workflow, not a mutating substep inside `execute-plan`, unless the user explicitly invokes/approves publish workflow.

### Finding 5 — `code-review` and `codebase-audit` boundaries are mostly clean

Severity: Low  
Category: boundary health  
Confidence: high

Evidence:

`code-review` remains focused on concrete targets: PR diff, current local diff, generated package, commit, or branch diff. It states it must not modify code, approve/request changes on GitHub without explicit separate write action, merge, apply changes, or produce a full executable fix plan by default.

`codebase-audit` states it is not `code-review`, is read-only, does not modify files, does not implement findings, does not produce executable fix plans, and routes selected findings to `plan-with-context`.

Impact:

The split is healthy. No simplification needed here.

Recommendation:

Keep both skills. Do not merge audit into review.

### Finding 6 — `write-a-skill` is now useful, but should remain bounded

Severity: Low / Watch  
Category: skill authoring scope  
Confidence: high

Evidence:

`write-a-skill` now includes skill authoring verification and misuse/rationalization checks, while explicitly avoiding mandatory delegated-agent tests, test-driven authoring, or tool-specific mechanics.

Impact:

This is the right level of borrowing from Obra. It improves skill quality without importing Obra/Superpowers-specific discipline wholesale.

Recommendation:

Keep this lightweight. Do not add mandatory TDD/subagent skill-testing workflows unless there is repeated evidence that static and manual verification are insufficient.

### Finding 7 — Current skill count is acceptable; current documentation drift is the real risk

Severity: Medium  
Category: simplification strategy  
Confidence: high

Evidence:

The kit now has many skills, but most of them are bounded and have distinct workflow roles. The roadmap itself identifies the kit as a small operating layer with project memory, role routing, planning, execution, review, audit, handoff, skill authoring, publishing, safety, and quality constraints.

Impact:

Deleting or merging skills now would likely reduce clarity more than it reduces complexity. The better simplification target is the inventory and roadmap layer.

Recommendation:

Do not delete skills in the next theme. Instead:

1. Create a current inventory / workflow map.
2. Mark old reports and roadmap sections as historical or superseded where appropriate.
3. Clarify which documents are current state vs historical research vs future reference.

## 7. Blocking / Interaction Risk Analysis

### 7.1 Project Memory Gate

Risk: low.

The gate is centralized and has explicit `passed | partial | blocked` meanings. `initialize-project-context` and `update-project-memory` can continue from partial only for diagnosis/repair, which prevents a deadlock where missing memory blocks memory repair.

### 7.2 Docs-first research

Risk: low.

It correctly distinguishes project-impacting research, which passes the gate, from pure external fact lookup where the gate can be not applicable.

### 7.3 Plan → execute loop

Risk: low/medium.

`plan-with-context` can produce plans; `execute-plan` executes only approved plans; material drift returns to planning. This is good. The main risk is over-documenting plans for tiny tasks. Current wording says small plans should remain proportional, so this is acceptable.

### 7.4 Execute → supporting skills

Risk: medium.

Theme 21.1 fixed the problem of not invoking dedicated supporting skills. The remaining edge case is publishing. Publishing should be a workflow transition, not a mutating substep inside `execute-plan`.

### 7.5 Review → plan / audit split

Risk: low.

`code-review` and `codebase-audit` are separate enough. Review handles concrete changes; audit handles repo-wide survey and selected planning inputs.

### 7.6 Audit → plan split

Risk: low.

`codebase-audit` explicitly says selected findings are inputs for `plan-with-context`, not executable plans.

### 7.7 Memory update loop

Risk: low.

Many workflows can recommend `update-project-memory`; only `update-project-memory` writes durable memory and requires a pre-update summary. This is correct.

## 8. Simplification Assessment

### Do not simplify by deleting skills now

No current core skill appears redundant enough to delete:

- `project-memory` and `update-project-memory` are distinct read/apply vs confirmed write workflows.
- `plan-with-context` and `project-architecture-plan` differ by lifecycle level.
- `code-review` and `codebase-audit` differ by concrete diff vs repo-wide survey.
- `write-a-skill` is now necessary because the kit evolves by adding reusable skills.
- `agent-roles-and-capabilities` is needed for truthful role/capability routing.

### Simplify by improving inventory and document lifecycle

The next simplification target should be:

- one current skill/rule/prompt inventory,
- clear status labels on roadmap phases,
- a current “next recommended step” section,
- archived/superseded note for local research reports,
- no duplicate “future” wording for already-completed themes.

### Avoid large new policy bundles

The roadmap’s Phase 4 currently combines several ideas:

- third-party skill adoption safety,
- kit evolution loop,
- reusable lesson promotion policy,
- optional external skill catalog.

These should be split into smaller themes. Combining them would create policy bloat.

## 9. Recommended Next Work Plan

### Theme 22.0 — Stage Review, Inventory, and Roadmap Refresh

Type: docs-only / memory-doc consistency  
Risk: low  
Recommended next step: yes

Goal:

Refresh the current-state documentation after Themes 19, 20, 21, and 21.1 so future planning starts from accurate inventory rather than stale roadmap fragments.

Suggested scope:

```txt
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

Optional, only if needed:

```txt
AGENTS.md
kit/project-templates/AGENTS.md
kit/rules/agent-operating-contract.md
```

Recommended edits:

1. Update roadmap “Current Core Skills” list to include `codebase-audit`.
2. Split skills into clear groups:
   - core workflow skills,
   - productivity skills,
   - rules,
   - prompts,
   - future / optional candidates.
3. Update `.codex/project/project-guideline.md` core rules list to include all current canonical rules.
4. Mark Theme 21.1 completed/current if merged.
5. Replace roadmap Section 16 with the new recommended next step: Theme 22.1 Third-Party Skill Adoption Safety plan.
6. Add a short “Document Lifecycle” note:
   - roadmap = long-term planning reference,
   - project memory = current facts/decisions/lessons,
   - local research notes = process artifacts requiring freshness check.
7. Do not add new skills or rules in this theme.

Validation:

```bash
git diff --check
git diff --stat
rg -n "codebase-audit" docs/foundation-kit-skills-review-and-optimization-roadmap.md .codex/project/project-guideline.md
rg -n "agent-operating-contract|docs-first-policy|engineering-quality-principles" .codex/project/project-guideline.md docs/foundation-kit-skills-review-and-optimization-roadmap.md
git diff --name-only -- kit/skills kit/rules kit/prompts package.json pnpm-lock.yaml scripts kit/scripts tests archive
pnpm check
```

Stop condition:

If the refresh requires adding a new policy, new skill, or changing runtime/tooling behavior, stop and create a separate `plan-with-context` plan.

### Theme 22.1 — Third-Party Skill Adoption Safety

Type: lightweight policy/rule  
Risk: medium  
Recommended after Theme 22.0

Goal:

Define how external skills are evaluated before being referenced, adapted, or rejected.

Recommended default:

Prefer a concise rule or small sections in `docs-first-research` / `write-a-skill`; do not create a new workflow unless repeated use proves it necessary.

Likely scope:

```txt
kit/rules/third-party-skill-adoption-policy.md
kit/skills/core/docs-first-research/SKILL.md
kit/skills/core/write-a-skill/SKILL.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
```

Key required policy points:

```txt
- External skills are reference candidates only.
- Check source/provenance/license.
- Prefer official or maintainer-authored sources.
- Check trigger scope and boundary fit.
- Check tools, scripts, file writes, network, global tooling, and secret risk.
- Check workflow conflicts with current kit skills.
- Do not copy wholesale.
- Rewrite accepted patterns for this kit through write-a-skill.
- Use docs-first-research for source and external facts.
- Use plan-with-context before implementation.
```

Non-goals:

```txt
- no external marketplace
- no optional skill install automation
- no broad catalog yet
- no technology-specific skills
- no scripts/package/installer/runtime changes
```

### Theme 22.2 — Kit Evolution and Reusable Lesson Promotion Loop

Type: policy/rule  
Risk: medium  
Recommended after Theme 22.1 or as a separate plan if user wants to prioritize learning loop

Goal:

Define how project-specific experience becomes reusable foundation-kit guidance without polluting installable templates.

Likely scope:

```txt
kit/rules/kit-evolution-loop.md
.codex/project/project-guideline.md
.codex/project/project-decisions.md
docs/foundation-design-log.md
docs/foundation-kit-skills-review-and-optimization-roadmap.md
```

Key required policy points:

```txt
project experience
→ local project memory
→ reusable lesson candidate
→ review and generalization
→ user confirmation
→ foundation kit rule / skill / template / reference
```

This should include a reusable lesson candidate format, but should not automatically promote lessons.

### Theme 23 — UI Quality Foundation

Do later. This should be a small rule focused on design-system reuse and UI state quality, not a UI style skill.

### Theme 24 — Architecture Review Reference

Do later. Add a `project-architecture-plan/REFERENCE.md` only if repeated architecture review needs justify it. Do not create `architecture-review` yet.

### Theme 25 — External Skill Catalog / Optional Packs

Do later, after third-party policy exists. The catalog should track candidates, not install them automatically.

## 10. Recommended Immediate Plan Prompt

Use this as the next Codex planning prompt.

```text
Use root AGENTS.md and pass the Project Memory Context Gate first.

Create a plan-with-context implementation plan for:

Theme 22.0: Stage Review, Inventory, and Roadmap Refresh

Intended plan path:
dev_locals/plans/2026-06-16-stage-review-inventory-roadmap-refresh.md

Do not implement yet.

Goal:
Refresh the current-state documentation after Themes 19, 20, 21, and 21.1 so future planning starts from accurate inventory rather than stale roadmap fragments.

Context:
- Recent themes added or hardened project-memory, docs-first, plan/execute/review, codebase-audit, supporting skill invocation, and write-a-skill verification.
- The roadmap is a long-term reference, not an approved implementation plan, but it now contains stale or partially outdated current-state sections.
- The project guideline currently records Theme 21.1 and current boundaries, but its canonical rule inventory appears incomplete compared with current `kit/rules/` and the roadmap.
- Local research reports are process artifacts and should be treated as historical inputs unless refreshed.

Scope:
- docs/foundation-kit-skills-review-and-optimization-roadmap.md
- .codex/project/project-guideline.md
- .codex/project/project-decisions.md
- docs/foundation-design-log.md

Optional only if the plan finds a concrete consistency issue:
- AGENTS.md
- kit/project-templates/AGENTS.md
- kit/rules/agent-operating-contract.md

Non-goals:
- Do not add new skills.
- Do not add new rules.
- Do not implement third-party skill adoption policy.
- Do not implement kit evolution loop.
- Do not implement UI quality, architecture review, external catalog, technology-specific skills, release workflow, or deployment workflow.
- Do not change scripts, package commands, installer behavior, dependencies, tests, archive files, generated package workflow, or runtime behavior.
- Do not rename skills.
- Do not broadly rewrite mature docs.

Planning requirements:
1. Update current skill inventory in the roadmap to include `codebase-audit` and Theme 21.1 status.
2. Distinguish current core workflow skills, productivity skills, rules, prompts, and future/optional candidates.
3. Update project-guideline canonical rule inventory to include all current canonical rules.
4. Replace roadmap Section 16 with the next recommended work after this refresh: Theme 22.1 Third-Party Skill Adoption Safety planning.
5. Add or update a short document lifecycle note: roadmap/reference vs project memory/current state vs local research/process artifacts.
6. Preserve the existing strategic roadmap but mark completed/current phases accurately.
7. Keep changes small and documentation-only.

Validation requirements:
- git diff --check
- git diff --stat
- rg -n "codebase-audit" docs/foundation-kit-skills-review-and-optimization-roadmap.md .codex/project/project-guideline.md
- rg -n "agent-operating-contract|docs-first-policy|engineering-quality-principles" .codex/project/project-guideline.md docs/foundation-kit-skills-review-and-optimization-roadmap.md
- git diff --name-only -- kit/skills kit/rules kit/prompts package.json pnpm-lock.yaml scripts kit/scripts tests archive
- pnpm check

Plan status:
- Save to the intended path if possible.
- If writing is blocked, do not claim it was saved; provide complete plan content and exact intended path.
- Stop after planning.
```

## 11. Final Recommendation

Recommended immediate action:

```txt
Do Theme 22.0 first.
```

Do not proceed directly to full Phase 4. The kit is now mature enough that future improvements should start from a cleaned current inventory and refreshed roadmap.

After Theme 22.0 is reviewed and merged, continue with:

```txt
Theme 22.1: Third-Party Skill Adoption Safety
Theme 22.2: Kit Evolution and Reusable Lesson Promotion Loop
```

The kit does not need a structural rewrite now. It needs a stage-level consolidation pass.
