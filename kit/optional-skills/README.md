# Optional Skills

This directory contains optional specialist skills available for explicit project adoption.

Optional metadata and dependency direction follow
`kit/rules/skill-invocation-and-dependency-boundaries.md`.

Optional skills live inside the installable `kit/` source boundary but are not copied by default.
The foundation-kit installer includes one only when the user names it with `--include-optional`;
catalog presence alone does not authorize installation or activation.

Selected downstream adoption requires:

- a matching project signal or explicit need
- review of the skill's dependencies, conflicts, and non-goals
- explicit user selection
- installing only the selected skill into `.codex/skills/engineering/<skill-name>/`
- validation of metadata, content, dependencies, conflicts, and installed-skill routing
- a confirmed target project-memory update through `update-project-memory`

Do not copy the complete `kit/optional-skills/` tree or treat catalog presence as adoption
approval. Do not install selected optional skills under `.codex/skills/optional/`,
`.codex/skills/project/`, or a flat `.codex/skills/<skill-name>/` path.

`.codex/skills/project/` is target-project-owned and outside optional-skill discovery, validation,
migration, and collision checks.
