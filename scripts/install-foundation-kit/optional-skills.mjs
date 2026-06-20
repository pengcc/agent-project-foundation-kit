import { lstat, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import YAML from "yaml";
import { InstallerError } from "./errors.mjs";
import { relativePosix, walkRegularFiles } from "./fs-safe.mjs";
import { assertInside } from "./path-boundary.mjs";

const OPTIONAL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OPTIONAL_SOURCE_DIRECTORY = "optional-skills";

function isLocalOsJunkFile(relativePath) {
  const name = relativePath.split("/").at(-1);
  return (
    name === ".DS_Store" || name === "Thumbs.db" || name === "desktop.ini" || name.startsWith("._")
  );
}

async function optionalRoot(kitRoot) {
  const root = resolve(kitRoot, OPTIONAL_SOURCE_DIRECTORY);
  assertInside(kitRoot, root, "Optional skill source");
  const stats = await lstat(root).catch(() => null);
  if (!stats?.isDirectory() || stats.isSymbolicLink()) {
    throw new InstallerError(
      "INVALID_SOURCE",
      "kit/optional-skills must be a real directory inside the source kit.",
    );
  }
  return root;
}

export async function listOptionalSkillNames(kitRoot) {
  const root = await optionalRoot(kitRoot);
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => entry.name)
    .filter((name) => OPTIONAL_NAME.test(name))
    .sort();
}

async function readOptionalMetadata(skillRoot, expectedName) {
  const metadataPath = resolve(skillRoot, "metadata.yml");
  const skillPath = resolve(skillRoot, "SKILL.md");
  for (const [path, label] of [
    [metadataPath, "metadata.yml"],
    [skillPath, "SKILL.md"],
  ]) {
    const stats = await lstat(path).catch(() => null);
    if (!stats?.isFile() || stats.isSymbolicLink()) {
      throw new InstallerError(
        "INVALID_SOURCE",
        `Optional skill ${expectedName} requires a regular ${label} file.`,
      );
    }
  }

  const documents = YAML.parseAllDocuments(await readFile(metadataPath, "utf8"));
  if (documents.length !== 1 || documents[0].errors.length) {
    throw new InstallerError(
      "INVALID_SOURCE",
      `Optional skill ${expectedName} metadata must be one valid YAML document.`,
    );
  }
  const metadata = documents[0].toJSON();
  if (
    metadata?.name !== expectedName ||
    metadata?.category !== "optional" ||
    metadata?.required !== false
  ) {
    throw new InstallerError(
      "INVALID_SOURCE",
      `Optional skill ${expectedName} metadata must match its directory, use category optional, and set required false.`,
    );
  }
  return metadata;
}

export async function buildOptionalSkillMappings(kitRoot, selectedNames = []) {
  const names = [...new Set(selectedNames)];
  if (!names.length) return [];
  for (const name of names) {
    if (!OPTIONAL_NAME.test(name)) {
      throw new InstallerError("INVALID_ARGUMENT", `Invalid optional skill name: ${name}`);
    }
  }

  const root = await optionalRoot(kitRoot);
  const available = await listOptionalSkillNames(kitRoot);
  const unknown = names.filter((name) => !available.includes(name));
  if (unknown.length) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      `Unknown optional skill: ${unknown.join(", ")}. Available optional skills: ${available.join(", ") || "none"}.`,
    );
  }

  const mappings = [];
  for (const name of names.sort()) {
    const skillRoot = resolve(root, name);
    assertInside(root, skillRoot, "Optional skill source");
    await readOptionalMetadata(skillRoot, name);
    for (const sourcePath of await walkRegularFiles(skillRoot, { boundary: root })) {
      const relative = relativePosix(skillRoot, sourcePath);
      if (isLocalOsJunkFile(relative)) continue;
      mappings.push({
        sourceRelative: `${OPTIONAL_SOURCE_DIRECTORY}/${name}/${relative}`,
        targetRelative: `.codex/skills/engineering/${name}/${relative}`,
        category: "optional",
        optionalName: name,
      });
    }
  }
  return mappings;
}
