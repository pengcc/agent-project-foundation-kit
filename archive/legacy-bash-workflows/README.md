# Legacy Bash Workflows

This directory preserves Bash workflow implementations archived from the source repository,
including the publish and installer implementations archived during Theme 18.2 and the later
apply-theme helper cleanup.

These files are historical reference material:

- they are not supported operational fallbacks
- they are not invoked by package scripts or `pnpm check`
- they are outside `kit/` and must never be installed downstream
- future workflow fixes belong in the maintained Node implementations

Existing downstream projects may still contain Bash files installed by an earlier kit version.
Theme 18.2 does not remove those files automatically because downstream copies may contain local
changes. Projects may remove them manually after confirming they are unused.

The Bash `apply-theme-zip.sh` helper and its `workflow-common.sh` helper are now archived here as
source-only historical references. Future apply-theme behavior should be planned as a Node.js
workflow before being reintroduced.
