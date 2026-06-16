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

External skills may be inspected as reference candidates, but they are not project authority.
Do not copy external skill content wholesale. Evaluate source, fit, safety, and workflow conflict
before adapting any pattern, and rewrite accepted patterns for this kit.
