# Force Publish Current Branch Prompt

Use this prompt when Codex or another coding agent needs to publish the current completed branch but does not appear to use the installed `publish-current-branch` workflow.

This prompt does not replace the skill. It forces the agent to apply the skill.

## Prompt

Use the `publish-current-branch` workflow.

Publish scope:

```txt
- push current branch
- create or update PR
- prepare merge or auto-merge only if supported and authorized
```

Out of scope:

```txt
- release
- deploy
- force push to main
- bypass branch protection
- implementation changes
```

Before publishing:

1. Apply the `project-memory` skill.
2. Check the current branch.
3. Stop if the branch is `main` or `master`.
4. Check that the working tree is clean.
5. Check that there is a local commit to publish.
6. Check remote `origin`.
7. Check upstream state.
8. Check whether `gh` is available and authenticated if PR work is needed.
9. Check whether a PR already exists for the current branch.
10. Restate workflow, publishing scope, out of scope, and stop conditions.

Do not perform a full GitHub repo settings audit every time.

Repo-level settings such as ruleset, branch protection, required checks, auto-merge enablement, and main protection belong to project initialization / setup.

If repo-level settings are unknown in project memory, create/update PR only and recommend `initialize-project-context` or setup check.

For an explicitly requested PR-number merge, use public `--auto-merge` only when pending required
checks should be waited on by GitHub. Repository-level **Allow auto-merge** only permits this;
auto-merge must still be enabled per PR, and it never bypasses required checks or reviews. Do not
enable it for PR-only mode or silently infer it.

Do not release or deploy.

At the end or when pausing, output:

```txt
Publish Summary:
- Branch:
- Remote:
- Working tree:
- Local commit:
- Push:
- PR:
- Auto-merge:
- Merge:
- Checks:
- Blockers:
- Project memory update check:
- Recommended next workflow:
```
