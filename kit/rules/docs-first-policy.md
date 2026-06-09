# Docs-First Policy

This policy defines the global source priority for technical work.

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

## Degraded Mode

If official documentation cannot be accessed, the agent must say so.

For high-impact technical decisions, the agent must request user confirmation before continuing.

For local low-impact documentation or workflow cleanup, the agent may recommend continuing after explaining that the impact is limited and official docs are not required for the current step.

Project memory updates still require the `update-project-guideline` workflow and its required update summary.
