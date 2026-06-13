# GitHub Repository Settings Checklist

Use this checklist after creating a GitHub repository and installing the foundation kit.

The installer copies these files and does not apply GitHub settings. Applying settings is a
separate, externally visible administrator action.

## Prerequisites

- [ ] The repository has a default branch.
- [ ] `gh auth status` succeeds.
- [ ] The authenticated account has repository administration permission.
- [ ] You reviewed the ruleset and General settings payload before applying them.

GitHub ruleset availability and behavior can vary by account, organization policy, repository
visibility, and plan. Confirm that rulesets are available for the target repository before relying
on this package.

## 1. Apply General Pull Request Settings

GitHub does not provide a General settings JSON import screen. Use either the UI or the
repository REST API.

### Option A: GitHub UI

Open:

```txt
Repository > Settings > General > Pull Requests
```

Enable:

- [ ] Allow squash merging
- [ ] Allow auto-merge

The following settings are optional and are not changed by the required JSON payload:

- Allow merge commits
- Allow rebase merging
- Automatically delete head branches
- Always suggest updating pull request branches
- Default squash commit title/message format

### Option B: GitHub CLI

From the downstream project root:

```bash
gh api \
  --method PATCH \
  'repos/{owner}/{repo}' \
  --input .codex/github-settings/general-settings.required.json
```

The payload changes only:

```txt
allow_squash_merge = true
allow_auto_merge = true
```

## 2. Import the Default-Branch Ruleset

### Option A: GitHub UI

1. Open `Repository > Settings > Rules > Rulesets`.
2. Select `New ruleset > Import a ruleset`.
3. Import:

```txt
.codex/github-settings/protect-default-branch.ruleset.json
```

4. Review the imported ruleset.
5. Confirm that it targets `~DEFAULT_BRANCH`.
6. Create the ruleset.

### Option B: GitHub CLI

First check that an equivalent ruleset does not already exist:

```bash
gh api 'repos/{owner}/{repo}/rulesets' \
  --jq '.[] | {id, name, enforcement, target}'
```

Create the ruleset only when no equivalent ruleset exists:

```bash
gh api \
  --method POST \
  'repos/{owner}/{repo}/rulesets' \
  --input .codex/github-settings/protect-default-branch.ruleset.json
```

The ruleset:

- targets the repository default branch
- prevents branch deletion
- prevents force pushes
- requires changes through pull requests
- permits squash merging only
- requires review conversations to be resolved
- requires zero approving reviews
- requires linear history
- defines no bypass actors
- does not require status checks

## 3. Verify the Configuration

Verify General settings:

```bash
gh api 'repos/{owner}/{repo}' \
  --jq '{
    default_branch,
    allow_squash_merge,
    allow_auto_merge,
    allow_merge_commit,
    allow_rebase_merge,
    delete_branch_on_merge
  }'
```

Required values:

```txt
allow_squash_merge: true
allow_auto_merge: true
```

Verify rulesets:

```bash
gh api 'repos/{owner}/{repo}/rulesets' \
  --jq '.[] | {id, name, enforcement, target}'
```

Verify effective rules on the default branch:

```bash
default_branch="$(gh api 'repos/{owner}/{repo}' --jq '.default_branch')"
gh api "repos/{owner}/{repo}/rules/branches/$default_branch" \
  --jq 'map(.type)'
```

Expected rule types include:

```txt
deletion
non_fast_forward
pull_request
required_linear_history
```

## 4. Optional Project-Specific Hardening

Decide per project whether to add:

- required approving reviews
- code owner reviews
- required status checks after CI exists
- stale review dismissal
- last-push approval
- signed commits
- required deployments
- merge queue
- bypass actors

Do not add a required status check before that check exists and reports successfully on pull
requests. Otherwise all merges can be blocked.

## 5. Rollback

General settings can be disabled in:

```txt
Repository > Settings > General > Pull Requests
```

Rulesets can be disabled or deleted in:

```txt
Repository > Settings > Rules > Rulesets
```

Prefer disabling a ruleset temporarily before deleting it. Record project-specific policy
changes in project memory.

## Official References

- [Managing rulesets for a repository](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository)
- [REST API: Update a repository](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#update-a-repository)
- [REST API: Create a repository ruleset](https://docs.github.com/en/rest/repos/rules?apiVersion=2022-11-28#create-a-repository-ruleset)
- [Managing auto-merge](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository)
- [Configuring commit squashing](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)
