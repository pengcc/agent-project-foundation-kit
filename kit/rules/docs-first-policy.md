# Docs-First Policy

This policy defines the global source priority for technical work.

## Core Principle

Official documentation and project files are the primary sources of truth.

Model memory can support reasoning, but must not override official documentation or project reality.

For research that may affect project planning, implementation, review, workflow, tooling, or
project memory, pass the Project Memory Context Gate first. For pure external fact lookup that has
no project impact, state that the gate is not applicable.

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

## Degraded Mode

If official documentation cannot be accessed, the agent must say so.

For high-impact technical decisions, the agent must request user confirmation before continuing.

For local low-impact documentation or workflow cleanup, the agent may recommend continuing after explaining that the impact is limited and official docs are not required for the current step.

Project memory updates still require the `update-project-memory` workflow and its required update summary.

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
