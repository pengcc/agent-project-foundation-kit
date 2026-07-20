export const OWNERSHIP = Object.freeze({
  KIT_MANAGED: "kit-managed",
  PROJECT_OWNED: "project-owned",
});

export function ownershipPolicyFor(mapping) {
  const projectOwned =
    mapping.targetRelative.startsWith(".codex/project-memory/") ||
    mapping.targetRelative.startsWith(".codex/project-specific/");
  return Object.freeze({
    ownership: projectOwned ? OWNERSHIP.PROJECT_OWNED : OWNERSHIP.KIT_MANAGED,
    kind: projectOwned ? "project-owned-seed" : "kit-owned-payload",
  });
}
