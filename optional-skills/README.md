# Optional Skills

This directory contains source-only optional specialist skills for explicit project adoption.

Optional skills here are not part of the default installable `kit/` payload. The foundation-kit
installer does not copy this directory, and catalog presence does not authorize installation or
activation.

Manual downstream adoption requires:

- a matching project signal or explicit need
- review of the skill's dependencies, conflicts, and non-goals
- an explicit project-specific plan
- user approval for the copy action
- copying only the selected skill into `.codex/skills/<skill-name>/`
- validation of metadata, content, dependencies, conflicts, and installed-skill routing
- a confirmed target project-memory update through `update-project-memory`

Do not copy the complete `optional-skills/` tree or treat catalog presence as adoption approval.
The target project's plan must name the selected skill and source path.

Installer support, automatic selection, default installation, and package-manager behavior remain
out of scope until separately planned and approved.
