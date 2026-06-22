import { lstat, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { InstallerError } from "./errors.mjs";
import { hashFile, pathStats } from "./fs-safe.mjs";
import { loadInstallationManifest } from "./installation-manifest.mjs";
import { buildMappings } from "./mapping.mjs";
import { isManifestManaged, OWNERSHIP, ownershipPolicyFor, RISK } from "./ownership-policy.mjs";
import { assertInside, assertNoTargetSymlinks, assertRelativePathSafe } from "./path-boundary.mjs";

function planFingerprint(entries, installationManifest) {
  return JSON.stringify({
    installationManifest: {
      status: installationManifest.status,
      fileSha256: installationManifest.fileSha256,
      issues: installationManifest.issues,
    },
    entries: entries.map((entry) => ({
      sourceRelative: entry.sourceRelative,
      targetRelative: entry.targetRelative,
      sourceSha256: entry.sourceSha256,
      targetSha256: entry.targetSha256,
      baselineSha256: entry.baselineSha256,
      baselineStatus: entry.baselineStatus,
      contentState: entry.contentState,
      ownership: entry.ownership,
      risk: entry.risk,
      kind: entry.kind,
      managedReplaceAllowed: entry.managedReplaceAllowed,
      mappingState: entry.mappingState,
      migrationState: entry.migrationState,
      collisionPath: entry.collisionPath,
      resultCategory: entry.resultCategory,
      reasonCode: entry.reasonCode,
      action: entry.action,
      optionalName: entry.optionalName ?? "",
    })),
  });
}

async function firstExistingPath(targetRoot, candidates) {
  for (const candidate of candidates) {
    if (await pathStats(resolve(targetRoot, candidate))) return candidate;
  }
  return "";
}

async function migrationCollisionFor(mapping, targetRoot, contentState) {
  if (contentState !== "new") return "";
  if (mapping.category === "optional") {
    const name = mapping.optionalName;
    return firstExistingPath(targetRoot, [
      `.codex/skills/core/${name}`,
      `.codex/skills/meta/${name}`,
    ]);
  }

  const match = mapping.targetRelative.match(/^\.codex\/skills\/meta\/([^/]+)\//);
  if (!match) return "";
  const name = match[1];
  const candidates = [`.codex/skills/core/${name}`];
  if (name === "writing-great-skills") candidates.push(".codex/skills/core/write-a-skill");
  return firstExistingPath(targetRoot, candidates);
}

function manifestPolicyIssues(mappings, installationManifest) {
  if (installationManifest.status !== "valid") return [];
  const mappingsByTarget = new Map(mappings.map((mapping) => [mapping.targetRelative, mapping]));
  const issues = [];
  for (const [target, record] of Object.entries(installationManifest.manifest.files)) {
    const mapping = mappingsByTarget.get(target);
    if (!mapping) continue;
    const policy = ownershipPolicyFor(mapping);
    if (!isManifestManaged(policy)) {
      issues.push(`Manifest claims a source-policy project or mixed path: ${target}`);
    }
    if (record.source !== mapping.sourceRelative) {
      issues.push(`Manifest source does not match the current mapping: ${target}`);
    }
  }
  return issues;
}

function withPolicyValidation(installationManifest, issues) {
  if (!issues.length) return installationManifest;
  return Object.freeze({
    status: "invalid",
    fileSha256: installationManifest.fileSha256,
    manifest: installationManifest.manifest,
    issues: Object.freeze(issues),
  });
}

function baselineFor(mapping, installationManifest) {
  return installationManifest.manifest?.files[mapping.targetRelative] ?? null;
}

function classify({
  contentState,
  policy,
  migrationState,
  baselineRecord,
  installationManifest,
  sourceSha256,
  targetSha256,
}) {
  if (installationManifest.status === "invalid") {
    return {
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "installation-manifest-invalid",
      action: "blocked",
      baselineStatus: "invalid",
    };
  }
  if (contentState === "new") {
    if (baselineRecord) {
      return {
        resultCategory: "BLOCKED_MANUAL",
        reasonCode: "manifested-target-missing",
        action: "blocked",
        baselineStatus: "present",
      };
    }
    if (migrationState === "legacy-path-collision") {
      return {
        resultCategory: "BLOCKED_MANUAL",
        reasonCode: "legacy-path-collision",
        action: "migration-review",
        baselineStatus: "missing",
      };
    }
    return {
      resultCategory: "SAFE_ADD",
      reasonCode: "target-missing-additive",
      action: "write",
      baselineStatus: "missing",
    };
  }
  if (contentState === "existing-identical") {
    return {
      resultCategory: null,
      reasonCode: policy.baselineAdoptable
        ? baselineRecord
          ? "unchanged-managed-baseline"
          : "unchanged-managed-adoptable"
        : "unchanged-not-adoptable",
      action: "skip-identical",
      baselineStatus: baselineRecord
        ? "present"
        : policy.baselineAdoptable
          ? "adoptable"
          : "not-applicable",
    };
  }
  if (policy.ownership === OWNERSHIP.PROJECT_OWNED) {
    return {
      resultCategory: "PROJECT_OWNED",
      reasonCode: "source-policy-project-owned",
      action: "preserve",
      baselineStatus: "not-applicable",
    };
  }
  if (policy.ownership === OWNERSHIP.MIXED) {
    return {
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "mixed-file-without-managed-sections",
      action: "manual-merge",
      baselineStatus: "not-applicable",
    };
  }
  if (policy.risk === RISK.MANUAL) {
    return {
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "manual-risk-existing-difference",
      action: policy.kind === "workflow-script" ? "script-merge" : "blocked",
      baselineStatus: baselineRecord ? "present" : "missing",
    };
  }
  if (!baselineRecord) {
    return {
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "installed-baseline-missing",
      action: "review",
      baselineStatus: "missing",
    };
  }
  if (contentState === "existing-different") {
    if (baselineRecord.baselineSha256 === targetSha256) {
      return {
        resultCategory: "KIT_MANAGED_REPLACE",
        reasonCode: "target-equals-installed-baseline",
        action: "managed-replace-review",
        baselineStatus: "present",
      };
    }
    return {
      resultCategory: "MIXED_AGENT_MERGE",
      reasonCode:
        baselineRecord.baselineSha256 === sourceSha256
          ? "target-changed-from-baseline"
          : "source-and-target-changed-from-baseline",
      action: "agent-merge",
      baselineStatus: "present",
    };
  }
  throw new InstallerError("INVALID_PLAN", `Unsupported content state: ${contentState}`);
}

function summaryFor(entries, includeOptional) {
  const categoryCount = (category) =>
    entries.filter((entry) => entry.resultCategory === category).length;
  return {
    total: entries.length,
    newFiles: entries.filter((entry) => entry.contentState === "new").length,
    writableNewFiles: entries.filter((entry) => entry.action === "write").length,
    identicalFiles: entries.filter((entry) => entry.contentState === "existing-identical").length,
    differentFiles: entries.filter((entry) => entry.contentState === "existing-different").length,
    conflicts: entries.filter((entry) => entry.contentState === "existing-different").length,
    preservedFiles: entries.filter((entry) => entry.action === "preserve").length,
    mergeFiles: entries.filter((entry) => entry.action === "manual-merge").length,
    scriptMergeFiles: entries.filter((entry) => entry.action === "script-merge").length,
    migrationReviews: entries.filter((entry) => entry.action === "migration-review").length,
    optionalSelectedFiles: entries.filter((entry) => entry.kind === "optional").length,
    safeAddFiles: categoryCount("SAFE_ADD"),
    kitManagedReplaceFiles: categoryCount("KIT_MANAGED_REPLACE"),
    projectOwnedFiles: categoryCount("PROJECT_OWNED"),
    mixedAgentMergeFiles: categoryCount("MIXED_AGENT_MERGE"),
    blockedManualFiles: categoryCount("BLOCKED_MANUAL"),
    unchangedFiles: entries.filter((entry) => entry.resultCategory === null).length,
    reviewItems: entries.filter(
      (entry) => entry.resultCategory && entry.resultCategory !== "SAFE_ADD",
    ).length,
    selectedOptionalSkills: Object.freeze([...new Set(includeOptional)].sort()),
  };
}

async function mappedEntry({ mapping, kitRoot, targetRoot, installationManifest }) {
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
  const contentState = targetStats
    ? targetSha256 === sourceSha256
      ? "existing-identical"
      : "existing-different"
    : "new";
  const policy = ownershipPolicyFor(mapping);
  const baselineRecord = baselineFor(mapping, installationManifest);
  const collisionPath = await migrationCollisionFor(mapping, targetRoot, contentState);
  const migrationState = collisionPath ? "legacy-path-collision" : "none";
  const classification = classify({
    contentState,
    policy,
    migrationState,
    baselineRecord,
    installationManifest,
    sourceSha256,
    targetSha256,
  });
  return {
    ...mapping,
    ...policy,
    ...classification,
    mappingState: "current",
    migrationState,
    collisionPath,
    contentState,
    sourceSha256,
    targetSha256,
    baselineSha256: baselineRecord?.baselineSha256 ?? "",
  };
}

async function obsoleteEntries({ mappings, targetRoot, installationManifest }) {
  if (!installationManifest.manifest) return [];
  const mappedTargets = new Set(mappings.map((mapping) => mapping.targetRelative));
  const entries = [];
  for (const [targetRelative, record] of Object.entries(installationManifest.manifest.files)) {
    if (mappedTargets.has(targetRelative)) continue;
    await assertNoTargetSymlinks(targetRoot, targetRelative);
    const targetPath = resolve(targetRoot, targetRelative);
    const stats = await pathStats(targetPath);
    const targetSha256 = stats?.isFile() ? await hashFile(targetPath) : "";
    entries.push({
      sourceRelative: record.source,
      targetRelative,
      category: "manifest-only",
      ownership: "kit-managed",
      risk: "manual",
      kind: "obsolete",
      baselineAdoptable: false,
      managedReplaceAllowed: false,
      mappingState: "source-no-longer-mapped",
      migrationState: "none",
      collisionPath: "",
      contentState: stats ? "existing-different" : "missing",
      sourceSha256: "",
      targetSha256,
      baselineSha256: record.baselineSha256,
      baselineStatus: "present",
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "source-no-longer-mapped",
      action: "blocked",
    });
  }
  return entries;
}

export async function buildInstallPlan({ kitRoot, targetRoot, includeOptional = [] }) {
  const mappings = await buildMappings(kitRoot, { includeOptional });
  const loadedManifest = await loadInstallationManifest(targetRoot);
  const installationManifest = withPolicyValidation(
    loadedManifest,
    manifestPolicyIssues(mappings, loadedManifest),
  );
  const entries = [];
  for (const mapping of mappings) {
    entries.push(await mappedEntry({ mapping, kitRoot, targetRoot, installationManifest }));
  }
  entries.push(...(await obsoleteEntries({ mappings, targetRoot, installationManifest })));
  entries.sort((left, right) => left.targetRelative.localeCompare(right.targetRelative));
  const frozenEntries = entries.map((entry) => Object.freeze(entry));
  return Object.freeze({
    entries: Object.freeze(frozenEntries),
    installationManifest,
    fingerprint: planFingerprint(frozenEntries, installationManifest),
    ...summaryFor(frozenEntries, includeOptional),
  });
}

export async function revalidateInstallPlan({
  expected,
  kitRoot,
  targetRoot,
  includeOptional = [],
}) {
  const current = await buildInstallPlan({ kitRoot, targetRoot, includeOptional });
  if (current.fingerprint !== expected.fingerprint) {
    throw new InstallerError(
      "PLAN_DRIFT",
      "Source, target, policy, or installation manifest changed after planning. Run the installer again.",
    );
  }
  return current;
}
