import { InstallerError } from "./errors.mjs";
import { payloadGroupFor } from "./payload-groups.mjs";

export const DOCS_PROFILE_GROUPS = Object.freeze([
  "project-templates",
  "common-workflow",
  "docs-writing-workflow",
  "publish-package",
]);

const KIT_PROFILES = Object.freeze({
  docs: DOCS_PROFILE_GROUPS,
});

export function resolveKitProfile(requestedKitProfile = "") {
  if (!requestedKitProfile) {
    return Object.freeze({
      requestedKitProfile: "",
      selectedPayloadGroups: Object.freeze([]),
    });
  }

  const selectedPayloadGroups = KIT_PROFILES[requestedKitProfile];
  if (!selectedPayloadGroups) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      `Unsupported kit profile: ${requestedKitProfile}. Expected docs.`,
    );
  }

  return Object.freeze({ requestedKitProfile, selectedPayloadGroups });
}

export function selectMappingsForKitProfile(mappings, requestedKitProfile = "") {
  const profile = resolveKitProfile(requestedKitProfile);
  if (!profile.requestedKitProfile) {
    return Object.freeze({ ...profile, mappings });
  }

  const selectedGroups = new Set(profile.selectedPayloadGroups);
  return Object.freeze({
    ...profile,
    mappings: Object.freeze(
      mappings.filter((mapping) => selectedGroups.has(payloadGroupFor(mapping))),
    ),
  });
}

export function kitProfileIncludesGroup(requestedKitProfile, payloadGroup) {
  const profile = resolveKitProfile(requestedKitProfile);
  return !profile.requestedKitProfile || profile.selectedPayloadGroups.includes(payloadGroup);
}
