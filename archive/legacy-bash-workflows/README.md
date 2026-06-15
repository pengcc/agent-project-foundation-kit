# Legacy Bash Workflows

This directory preserves the Bash publish and installer implementations that were archived during
Theme 18.2.

These files are historical reference material:

- they are not supported operational fallbacks
- they are not invoked by package scripts or `pnpm check`
- they are outside `kit/` and must never be installed downstream
- future workflow fixes belong in the maintained Node implementations

Existing downstream projects may still contain Bash files installed by an earlier kit version.
Theme 18.2 does not remove those files automatically because downstream copies may contain local
changes. Projects may remove them manually after confirming they are unused.

The active Bash `apply-theme-zip.sh` workflow is not archived. Its helper remains source-only under
`scripts/lib/`.
