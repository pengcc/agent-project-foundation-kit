export const OWNERSHIP = Object.freeze({
  KIT_MANAGED: "kit-managed",
  PROJECT_OWNED: "project-owned",
  MIXED: "mixed",
});

export const RISK = Object.freeze({
  NORMAL: "normal",
  MANUAL: "manual",
});

function policy(ownership, risk, kind, { baselineAdoptable = false } = {}) {
  return Object.freeze({ ownership, risk, kind, baselineAdoptable });
}

const PROJECT_MEMORY = policy(OWNERSHIP.PROJECT_OWNED, RISK.MANUAL, "project-memory");
const ENTRYPOINT = policy(OWNERSHIP.MIXED, RISK.MANUAL, "entrypoint");
const WORKFLOW_SCRIPT = policy(OWNERSHIP.KIT_MANAGED, RISK.MANUAL, "workflow-script");
const PROJECT_CONFIG = policy(OWNERSHIP.PROJECT_OWNED, RISK.MANUAL, "project-config");
const UNCLASSIFIED_CONFIG = policy(OWNERSHIP.MIXED, RISK.MANUAL, "unclassified-config");
const REUSABLE = policy(OWNERSHIP.KIT_MANAGED, RISK.NORMAL, "reusable", {
  baselineAdoptable: true,
});
const OPTIONAL = policy(OWNERSHIP.KIT_MANAGED, RISK.NORMAL, "optional", {
  baselineAdoptable: true,
});

export function ownershipPolicyFor(mapping) {
  if (mapping.targetRelative === "AGENTS.md") return ENTRYPOINT;
  if (mapping.targetRelative.startsWith(".codex/project/")) return PROJECT_MEMORY;
  if (mapping.targetRelative.startsWith(".codex/scripts/")) return WORKFLOW_SCRIPT;
  if (
    [".codex/config/publish-changes-policy.yml", ".codex/config/publish-cli-theme.json"].includes(
      mapping.targetRelative,
    )
  ) {
    return PROJECT_CONFIG;
  }
  if (mapping.targetRelative.startsWith(".codex/config/")) return UNCLASSIFIED_CONFIG;
  if (mapping.category === "optional") return OPTIONAL;
  return REUSABLE;
}

export function isManifestManaged(policyValue) {
  return policyValue.ownership === OWNERSHIP.KIT_MANAGED;
}
