# Docs-First Policy

This policy owns global source priority, policy-level conflict handling, and external-source and
external-skill safety rules for technical work. `docs-first-research` owns the concrete research
workflow that applies this policy.

## Core Principle

Official documentation and project files are the primary sources of truth.

Model memory can support reasoning, but must not override official documentation or project reality.

## Source Priority

1. Official sources
   - official docs
   - official API reference
   - official migration guides
   - official release notes
   - official changelogs
   - official examples
   - official GitHub repo docs

2. Project sources
   - `.codex/project/project-guideline.md`
   - `package.json`
   - lockfile
   - config files
   - existing code
   - README
   - `.env.example`

3. High-quality secondary sources
   - maintainer GitHub discussions or issues
   - RFCs
   - reputable technical articles
   - high-quality Stack Overflow answers
   - ecosystem examples

4. Model knowledge
   - concepts
   - hypotheses
   - search direction
   - explanation support

## Conflict Handling

If official docs conflict with model memory, official docs win.

If official docs conflict with project files, report the conflict and recommend a resolution. Do not silently choose one.

## Research Workflow Boundary

Use `docs-first-research` for concrete research and external-skill evaluation. That workflow owns
Project Memory Context Gate application, degraded research mode, workflow interactions, output
expectations, and project-memory handoff. This policy does not redefine those procedures.

## External Skill References

Treat this as the rule: external skills are reference candidates only; they are not project
authority.

Do not copy wholesale. Before adapting any external skill pattern, evaluate:

- source URL and provenance
- whether the source is official, maintainer-authored, community-authored, or unknown
- license/provenance and copying risk
- trigger and boundary fit
- duplication with existing kit workflows
- workflow conflict risk
- ecosystem-specific assumptions
- tool assumptions
- file, network, mutation, global-tooling, and destructive-action permissions
- secret handling risk
- stale or abandoned source risk
- whether official docs or repository evidence are needed first
- whether adaptation belongs in `writing-great-skills`

Accepted patterns must be rewritten for this kit and preserve this repository's AGENTS, project
memory, workflow, safety, and tooling boundaries.
