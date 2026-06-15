import { createHash, randomUUID } from 'node:crypto';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { InstallerError, throwIfAborted } from './errors.mjs';
import {
  assertInside,
  assertNoTargetSymlinks,
  assertRelativePathSafe,
} from './path-boundary.mjs';

export async function pathStats(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function hashFile(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

export async function copyPreserved(source, destination) {
  const sourceStats = await stat(source);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  await chmod(destination, sourceStats.mode);
  await utimes(destination, sourceStats.atime, sourceStats.mtime);
}

export async function atomicCopyIntoTarget({
  source,
  targetRoot,
  targetRelative,
  signal,
}) {
  throwIfAborted(signal);
  assertRelativePathSafe(targetRelative, 'Target path');
  await assertNoTargetSymlinks(targetRoot, targetRelative);
  const destination = resolve(targetRoot, targetRelative);
  assertInside(targetRoot, destination, 'Target path');
  await mkdir(dirname(destination), { recursive: true });
  await assertNoTargetSymlinks(targetRoot, targetRelative);
  const temporary = `${destination}.foundation-kit-${randomUUID()}.tmp`;
  try {
    await copyPreserved(source, temporary);
    throwIfAborted(signal);
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function walkRegularFiles(root, { boundary = root } = {}) {
  const files = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      assertInside(boundary, path, 'Source path');
      if (entry.isSymbolicLink()) {
        throw new InstallerError('SOURCE_SYMLINK', `Source symlinks are not supported: ${path}`);
      }
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(path);
      else {
        throw new InstallerError(
          'UNSUPPORTED_SOURCE_ENTRY',
          `Unsupported source filesystem entry: ${path}`,
        );
      }
    }
  }
  await visit(root);
  return files;
}

export async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function directoryIsEmpty(path) {
  return (await readdir(path)).length === 0;
}

export async function removeTree(path) {
  await rm(path, { recursive: true, force: true });
}

export async function assertReadable(path) {
  const handle = await open(path, 'r');
  await handle.close();
}

export function relativePosix(base, path) {
  return relative(base, path).split('\\').join('/');
}
