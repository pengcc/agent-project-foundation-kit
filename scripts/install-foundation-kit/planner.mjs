import { lstat, realpath } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { InstallerError } from "./errors.mjs";
import { hashFile, pathStats, walkRegularFiles } from "./fs-safe.mjs";
import { selectMappingsForKitProfile } from "./kit-profiles.mjs";
import { buildMappings, TREE_MAPPINGS } from "./mapping.mjs";
import { OWNERSHIP, ownershipPolicyFor } from "./ownership-policy.mjs";
import { assertInside, assertNoTargetSymlinks, assertRelativePathSafe } from "./path-boundary.mjs";
import { planPublishAliases, publishAliasPlanFingerprint } from "./publish-aliases.mjs";

const RETIRED_KIT_STATE_ROOT = ".codex/foundation-kit";

function posixRelative(base, path) {
  return relative(base, path).split("\\").join("/");
}

function planFingerprint(
  entries,
  replaceRoots,
  publishAliases,
  requestedKitProfile,
  selectedPayloadGroups,
) {
  return JSON.stringify({
    requestedKitProfile,
    selectedPayloadGroups,
    replaceRoots,
    entries: entries.map((entry) => ({
      sourceRelative: entry.sourceRelative,
      targetRelative: entry.targetRelative,
      sourceSha256: entry.sourceSha256,
      targetSha256: entry.targetSha256,
      contentState: entry.contentState,
      ownership: entry.ownership,
      action: entry.action,
    })),
    publishAliases: publishAliasPlanFingerprint(publishAliases),
  });
}

async function mappedEntry({ mapping, kitRoot, targetRoot }) {
  assertRelativePathSafe(mapping.sourceRelative, "Source path");
  assertRelativePathSafe(mapping.targetRelative, "Target path");
  const sourcePath = resolve(kitRoot, mapping.sourceRelative);
  const sourceStats = await lstat(sourcePath);
  if (sourceStats.isSymbolicLink() || !sourceStats.isFile()) {
    throw new InstallerError(
      "INVALID_SOURCE",
      `Mapped source must be a regular file: ${mapping.sourceRelative}`,
    );
  }
  assertInside(kitRoot, await realpath(sourcePath), "Source file");
  await assertNoTargetSymlinks(targetRoot, mapping.targetRelative);
  const targetPath = resolve(targetRoot, mapping.targetRelative);
  const targetStats = await pathStats(targetPath);
  if (targetStats && !targetStats.isFile()) {
    throw new InstallerError(
      "INVALID_TARGET",
      `Mapped target exists but is not a regular file: ${mapping.targetRelative}`,
    );
  }
  const sourceSha256 = await hashFile(sourcePath);
  const targetSha256 = targetStats ? await hashFile(targetPath) : "";
  const contentState = !targetStats
    ? "new"
    : sourceSha256 === targetSha256
      ? "existing-identical"
      : "existing-different";
  const policy = ownershipPolicyFor(mapping);
  return Object.freeze({
    ...mapping,
    ...policy,
    contentState,
    sourceSha256,
    targetSha256,
    action: policy.ownership === OWNERSHIP.PROJECT_OWNED && targetStats ? "preserve" : "install",
  });
}

function replaceRootsFor(selectedMappings) {
  const replaceRoots = [];
  for (const [, targetDirectory] of TREE_MAPPINGS) {
    if (
      selectedMappings.some((mapping) => mapping.targetRelative.startsWith(`${targetDirectory}/`))
    ) {
      replaceRoots.push(targetDirectory);
    }
  }
  return Object.freeze(replaceRoots.sort());
}

async function obsoleteEntries({ selectedMappings, replaceRoots, targetRoot }) {
  const selectedTargets = new Set(selectedMappings.map((mapping) => mapping.targetRelative));
  const entries = [];
  for (const targetDirectory of [...replaceRoots, RETIRED_KIT_STATE_ROOT]) {
    const root = resolve(targetRoot, targetDirectory);
    if (!(await pathStats(root))) continue;
    for (const targetPath of await walkRegularFiles(root, { boundary: targetRoot })) {
      const targetRelative = posixRelative(targetRoot, targetPath);
      if (selectedTargets.has(targetRelative)) continue;
      entries.push(
        Object.freeze({
          sourceRelative: "",
          targetRelative,
          category: "obsolete-kit-owned",
          ownership: OWNERSHIP.KIT_MANAGED,
          kind: "obsolete-kit-owned",
          contentState: "existing-different",
          sourceSha256: "",
          targetSha256: await hashFile(targetPath),
          action: "delete",
        }),
      );
    }
  }
  return entries;
}

function summaryFor(entries, includeOptional) {
  return {
    total: entries.length,
    installedFiles: entries.filter((entry) => entry.action === "install").length,
    replacedFiles: entries.filter(
      (entry) => entry.action === "install" && entry.contentState.startsWith("existing-"),
    ).length,
    newFiles: entries.filter((entry) => entry.action === "install" && entry.contentState === "new")
      .length,
    preservedFiles: entries.filter((entry) => entry.action === "preserve").length,
    removedFiles: entries.filter((entry) => entry.action === "delete").length,
    selectedOptionalSkills: Object.freeze([...new Set(includeOptional)].sort()),
  };
}

export async function buildInstallPlan({
  kitRoot,
  targetRoot,
  includeOptional = [],
  kitProfile = "",
}) {
  const allMappings = await buildMappings(kitRoot, { includeOptional });
  const selection = selectMappingsForKitProfile(allMappings, kitProfile);
  const replaceRoots = replaceRootsFor(selection.mappings);
  const entries = [];
  for (const mapping of selection.mappings) {
    entries.push(await mappedEntry({ mapping, kitRoot, targetRoot }));
  }
  entries.push(
    ...(await obsoleteEntries({
      selectedMappings: selection.mappings,
      replaceRoots,
      targetRoot,
    })),
  );
  entries.sort((left, right) => left.targetRelative.localeCompare(right.targetRelative));
  const publishAliases = await planPublishAliases(targetRoot);
  return Object.freeze({
    entries: Object.freeze(entries),
    publishAliases,
    requestedKitProfile: selection.requestedKitProfile,
    selectedPayloadGroups: selection.selectedPayloadGroups,
    replaceRoots,
    fingerprint: planFingerprint(
      entries,
      replaceRoots,
      publishAliases,
      selection.requestedKitProfile,
      selection.selectedPayloadGroups,
    ),
    ...summaryFor(entries, includeOptional),
  });
}

export async function revalidateInstallPlan({
  expected,
  kitRoot,
  targetRoot,
  includeOptional = [],
  kitProfile = "",
}) {
  const current = await buildInstallPlan({ kitRoot, targetRoot, includeOptional, kitProfile });
  if (current.fingerprint !== expected.fingerprint) {
    throw new InstallerError(
      "PLAN_DRIFT",
      "Source or target state changed after planning. Run the installer again.",
    );
  }
  return current;
}
