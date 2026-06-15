import { lstat, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { InstallerError } from './errors.mjs';
import { hashFile, pathStats } from './fs-safe.mjs';
import { buildMappings } from './mapping.mjs';
import {
  assertInside,
  assertNoTargetSymlinks,
  assertRelativePathSafe,
} from './path-boundary.mjs';

function planFingerprint(entries) {
  return JSON.stringify(
    entries.map((entry) => ({
      sourceRelative: entry.sourceRelative,
      targetRelative: entry.targetRelative,
      sourceSha256: entry.sourceSha256,
      targetSha256: entry.targetSha256,
      state: entry.state,
      contentState: entry.contentState,
    })),
  );
}

export async function buildInstallPlan({ kitRoot, targetRoot }) {
  const entries = [];
  for (const mapping of await buildMappings(kitRoot)) {
    assertRelativePathSafe(mapping.sourceRelative, 'Source path');
    assertRelativePathSafe(mapping.targetRelative, 'Target path');
    const sourcePath = resolve(kitRoot, mapping.sourceRelative);
    const sourceStats = await lstat(sourcePath);
    if (sourceStats.isSymbolicLink() || !sourceStats.isFile()) {
      throw new InstallerError(
        'INVALID_SOURCE',
        `Mapped source must be a regular file: ${mapping.sourceRelative}`,
      );
    }
    assertInside(kitRoot, await realpath(sourcePath), 'Source file');
    await assertNoTargetSymlinks(targetRoot, mapping.targetRelative);
    const targetPath = resolve(targetRoot, mapping.targetRelative);
    const targetStats = await pathStats(targetPath);
    if (targetStats && !targetStats.isFile()) {
      throw new InstallerError(
        'INVALID_TARGET',
        `Mapped target exists but is not a regular file: ${mapping.targetRelative}`,
      );
    }
    const sourceSha256 = await hashFile(sourcePath);
    const targetSha256 = targetStats ? await hashFile(targetPath) : '';
    entries.push({
      ...mapping,
      risk: 'DANGER',
      state: targetStats ? 'conflict' : 'new',
      contentState:
        targetStats && targetSha256 === sourceSha256 ? 'identical' : 'different',
      sourceSha256,
      targetSha256,
    });
  }
  const frozenEntries = entries.map((entry) => Object.freeze(entry));
  return Object.freeze({
    entries: Object.freeze(frozenEntries),
    fingerprint: planFingerprint(frozenEntries),
    total: frozenEntries.length,
    conflicts: frozenEntries.filter((entry) => entry.state === 'conflict').length,
    newFiles: frozenEntries.filter((entry) => entry.state === 'new').length,
  });
}

export async function revalidateInstallPlan({ expected, kitRoot, targetRoot }) {
  const current = await buildInstallPlan({ kitRoot, targetRoot });
  if (current.fingerprint !== expected.fingerprint) {
    throw new InstallerError(
      'PLAN_DRIFT',
      'Source or target state changed after planning. Run the installer again.',
    );
  }
  return current;
}
