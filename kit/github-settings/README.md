# GitHub Repository Settings

This directory contains reusable GitHub repository settings for projects installed from the
Codex Project Foundation Kit.

Files:

- `protect-default-branch.ruleset.json`: importable branch ruleset for the default branch.
- `general-settings.required.json`: minimal General settings payload required by the kit's
  squash auto-merge workflow.
- `repository-settings-checklist.md`: UI, GitHub CLI, verification, and rollback instructions.

Install location in downstream projects:

```txt
.codex/github-settings/
```

The installer copies these files and does not apply GitHub settings.

Review the checklist before applying settings. Applying repository settings is externally
visible and requires repository administration permission.
