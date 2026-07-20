# Force Publish Current Branch Prompt

Use this prompt only for an explicitly authorized request to publish the completed current branch.
Apply the `publish-current-branch` workflow.

Requested publish scope:

```txt
<replace with authorized push, PR, or merge action>
```

The skill owns preflight, branch/PR checks, publication safeguards, auto-merge handling, summary,
and project-memory follow-up.

Do not implement changes, release, deploy, force-push to main, or bypass branch protection.
