import { lstat, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { InstallerError } from "./errors.mjs";

export function isInside(base, candidate) {
  const rel = relative(base, candidate);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

export function assertRelativePathSafe(path, label = "Path") {
  if (!path || isAbsolute(path)) {
    throw new InstallerError("BOUNDARY_VIOLATION", `${label} must be a nonempty relative path.`);
  }
  const normalized = path.replaceAll("\\", "/");
  if (normalized === "." || normalized.split("/").includes("..")) {
    throw new InstallerError("BOUNDARY_VIOLATION", `${label} escapes its boundary: ${path}`);
  }
}

export function assertInside(base, candidate, label) {
  if (!isInside(base, candidate)) {
    throw new InstallerError("BOUNDARY_VIOLATION", `${label} is outside the allowed boundary.`, {
      base,
      candidate,
    });
  }
}

export async function canonicalExistingDirectory(path, label) {
  let stats;
  try {
    stats = await lstat(path);
  } catch {
    throw new InstallerError("INVALID_PATH", `${label} must be an existing directory: ${path}`);
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new InstallerError(
      "INVALID_PATH",
      `${label} must be a real existing directory, not a symlink: ${path}`,
    );
  }
  return realpath(path);
}

export async function assertNoTargetSymlinks(targetRoot, targetRelative) {
  assertRelativePathSafe(targetRelative, "Target path");
  const parts = targetRelative.split("/");
  let current = targetRoot;
  for (const part of parts) {
    current = resolve(current, part);
    assertInside(targetRoot, current, "Target path");
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink()) {
        throw new InstallerError(
          "BOUNDARY_VIOLATION",
          `Refusing target path containing a symlink: ${targetRelative}`,
        );
      }
    } catch (error) {
      if (error instanceof InstallerError) throw error;
      if (error?.code === "ENOENT") return;
      throw error;
    }
  }
}
