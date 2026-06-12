# agent-project-foundation-kit

Source repository for the Codex Project Foundation Kit.

## Local Commands

This repository uses a private, dependency-free `package.json` as a short command façade:

```bash
pnpm publish:local "Commit message"
pnpm apply-theme <zip-path-or-file-name> "Commit message"
pnpm test:install
pnpm test:publish
pnpm check
```

`publish:local` always uses a feature branch and pull request. It never pushes directly to
`main`. The workflow records update classification and validation in the PR, then offers
PR-only, squash auto-merge, or immediate squash merge modes with explicit review gates.

## Publish Smoke Test

The automated publish tests use fake `git` and `gh` commands and do not access GitHub. Before
relying on changed `gh` behavior, use a disposable low-risk branch and verify:

1. PR creation and existing-PR publish-record comments.
2. Required-check reporting for passing, pending, and failing checks.
3. Squash auto-merge and immediate squash merge confirmation wording.
4. Default-branch refresh only after GitHub reports the PR as merged.
