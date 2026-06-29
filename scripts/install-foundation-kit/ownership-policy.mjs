export const OWNERSHIP = Object.freeze({
  KIT_MANAGED: "kit-managed",
  PROJECT_OWNED: "project-owned",
  MIXED: "mixed",
});

export const RISK = Object.freeze({
  NORMAL: "normal",
  MANUAL: "manual",
});

function policy(
  ownership,
  risk,
  kind,
  { baselineAdoptable = false, managedReplaceAllowed = false } = {},
) {
  return Object.freeze({
    ownership,
    risk,
    kind,
    baselineAdoptable,
    managedReplaceAllowed,
  });
}

export const REACT_CANARY_MANAGED_REPLACEMENT = Object.freeze([
  Object.freeze({
    sourceRelative: "optional-skills/react-component-patterns/SKILL.md",
    targetRelative: ".codex/skills/engineering/react-component-patterns/SKILL.md",
  }),
  Object.freeze({
    sourceRelative: "optional-skills/react-component-patterns/metadata.yml",
    targetRelative: ".codex/skills/engineering/react-component-patterns/metadata.yml",
  }),
]);

const PROJECT_MEMORY = policy(OWNERSHIP.PROJECT_OWNED, RISK.MANUAL, "project-memory");
const ENTRYPOINT = policy(OWNERSHIP.MIXED, RISK.MANUAL, "entrypoint");
const WORKFLOW_SCRIPT = policy(OWNERSHIP.KIT_MANAGED, RISK.MANUAL, "workflow-script");
const PROJECT_CONFIG = policy(OWNERSHIP.PROJECT_OWNED, RISK.MANUAL, "project-config");
const UNCLASSIFIED_CONFIG = policy(OWNERSHIP.MIXED, RISK.MANUAL, "unclassified-config");
const REUSABLE = policy(OWNERSHIP.KIT_MANAGED, RISK.NORMAL, "reusable", {
  baselineAdoptable: true,
});
export function isManagedReplacementAllowlisted(mapping) {
  return REACT_CANARY_MANAGED_REPLACEMENT.some(
    (entry) =>
      entry.sourceRelative === mapping.sourceRelative &&
      entry.targetRelative === mapping.targetRelative,
  );
}

export function ownershipPolicyFor(mapping) {
  if (mapping.targetRelative === "AGENTS.md") return ENTRYPOINT;
  if (mapping.targetRelative.startsWith(".codex/project/")) return PROJECT_MEMORY;
  if (mapping.targetRelative.startsWith(".codex/scripts/")) return WORKFLOW_SCRIPT;
  if (mapping.targetRelative === ".codex/config/publish-changes-policy.yml") {
    return PROJECT_CONFIG;
  }
  if (mapping.targetRelative === ".codex/config/publish-cli-theme.json") return REUSABLE;
  if (mapping.targetRelative.startsWith(".codex/config/")) return UNCLASSIFIED_CONFIG;
  if (mapping.category === "optional") {
    return policy(OWNERSHIP.KIT_MANAGED, RISK.NORMAL, "optional", {
      baselineAdoptable: true,
      managedReplaceAllowed: isManagedReplacementAllowlisted(mapping),
    });
  }
  return REUSABLE;
}

export function isManifestManaged(policyValue) {
  return policyValue.ownership === OWNERSHIP.KIT_MANAGED;
}
