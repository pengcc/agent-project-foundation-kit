import { mkdir, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import YAML from "yaml";
import { parseCliOptions, usage } from "../../scripts/install-foundation-kit/cli-options.mjs";
import { buildMappings } from "../../scripts/install-foundation-kit/mapping.mjs";
import {
  OWNERSHIP,
  ownershipPolicyFor,
} from "../../scripts/install-foundation-kit/ownership-policy.mjs";
import {
  resolveInstallRoots,
  validateRequiredKitPaths,
} from "../../scripts/install-foundation-kit/validation.mjs";
import { createTestWorkspace } from "./helpers.mjs";

const kitRoot = resolve(import.meta.dirname, "../../kit");
const cleanups = [];

afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function fixture(name) {
  const value = await createTestWorkspace(name);
  cleanups.push(value.cleanup);
  return value;
}

async function discoverSkillMetadata(root) {
  const categories = [
    ["meta", resolve(root, "codex/skills/meta")],
    ["core", resolve(root, "codex/skills/core")],
    ["optional", resolve(root, "codex/optional-skills")],
  ];
  const records = [];
  for (const [category, directory] of categories) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const skillRoot = resolve(directory, entry.name);
      const documents = YAML.parseAllDocuments(
        await readFile(resolve(skillRoot, "metadata.yml"), "utf8"),
      );
      expect(documents, `${category}/${entry.name} metadata document count`).toHaveLength(1);
      expect(documents[0].errors, `${category}/${entry.name} metadata parse errors`).toHaveLength(
        0,
      );
      records.push({
        category,
        directoryName: entry.name,
        metadata: documents[0].toJSON(),
      });
      await expect(readFile(resolve(skillRoot, "SKILL.md"), "utf8")).resolves.not.toBe("");
    }
  }
  return records;
}

describe("installer contract", () => {
  it("accepts the bounded current CLI and rejects obsolete conflict flags", () => {
    expect(
      parseCliOptions(["--target", "/tmp/x", "--apply", "--include-optional", "optional-example"]),
    ).toEqual({
      target: "/tmp/x",
      apply: true,
      includeOptional: ["optional-example"],
      kitProfile: "",
      verbose: false,
      help: false,
    });
    for (const flag of [
      "--project-mode",
      "--overwrite-conflicts",
      "--skip-conflicts",
      "--replace-kit-managed",
      "--show-diff",
    ]) {
      expect(() => parseCliOptions(["--target", "/tmp/x", flag])).toThrow(
        `Unknown option: ${flag}`,
      );
      expect(usage()).not.toContain(flag);
    }
  });

  it("maps the approved templates and complete Kit-owned payload trees", async () => {
    const mappings = await buildMappings(kitRoot);
    const byTarget = new Map(
      mappings.map((mapping) => [mapping.targetRelative, mapping.sourceRelative]),
    );
    expect(byTarget.get("AGENTS.md")).toBe("AGENTS.md");
    expect(byTarget.get(".codex/project-memory/guideline.md")).toBe(
      "codex/project-memory/guideline.md",
    );
    expect(byTarget.get(".codex/project-memory/decisions.md")).toBe(
      "codex/project-memory/decisions.md",
    );
    expect(byTarget.get(".codex/project-memory/lessons-learned.md")).toBe(
      "codex/project-memory/lessons-learned.md",
    );
    expect(byTarget.get(".codex/project-specific/agent-guidance.md")).toBe(
      "codex/project-specific/agent-guidance.md",
    );
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/skills/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/rules/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/prompts/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".repo-tools/scripts/"))).toBe(
      true,
    );
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/project/"))).toBe(false);
  });

  it("classifies only the two repository-owned namespaces as preserved", () => {
    expect(ownershipPolicyFor({ targetRelative: "AGENTS.md" }).ownership).toBe(
      OWNERSHIP.KIT_MANAGED,
    );
    expect(
      ownershipPolicyFor({ targetRelative: ".repo-tools/scripts/publish-changes.mjs" }).ownership,
    ).toBe(OWNERSHIP.KIT_MANAGED);
    expect(
      ownershipPolicyFor({ targetRelative: ".codex/project-memory/guideline.md" }).ownership,
    ).toBe(OWNERSHIP.PROJECT_OWNED);
    expect(
      ownershipPolicyFor({ targetRelative: ".codex/project-specific/agent-guidance.md" }).ownership,
    ).toBe(OWNERSHIP.PROJECT_OWNED);
  });

  it("validates the full dynamic metadata contract and dependency graph", async () => {
    const records = await discoverSkillMetadata(kitRoot);
    const byName = new Map(records.map((record) => [record.metadata.name, record]));
    expect(byName.size).toBe(records.length);

    for (const { category, directoryName, metadata } of records) {
      expect(metadata.name).toBe(directoryName);
      expect(metadata.category).toBe(category);
      expect(metadata.description).toEqual(expect.any(String));
      expect(metadata.description.trim().length).toBeGreaterThan(0);
      expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(metadata.required).toBe(category !== "optional");
      expect(["user", "model", "support"]).toContain(metadata.invocation);
      expect(metadata.depends_on).toEqual(expect.any(Array));
      expect(new Set(metadata.depends_on).size).toBe(metadata.depends_on.length);

      for (const dependency of metadata.depends_on) {
        expect(dependency).toEqual(expect.any(String));
        expect(dependency.trim()).toBe(dependency);
        expect(byName.has(dependency), `${metadata.name} depends on missing ${dependency}`).toBe(
          true,
        );
        const dependencyCategory = byName.get(dependency).category;
        if (category === "meta") expect(dependencyCategory).toBe("meta");
        if (category === "core") expect(dependencyCategory).toBe("meta");
        if (category === "optional")
          expect(["meta", "core", "optional"]).toContain(dependencyCategory);
      }
    }
  });

  it("validates the new template source layout", async () => {
    await expect(validateRequiredKitPaths(kitRoot)).resolves.toBeUndefined();
  });

  it("rejects the repository root and targets inside the source kit", async () => {
    const value = await fixture("unsafe-target-boundaries");
    await expect(
      resolveInstallRoots({ repoRoot: value.repoRoot, target: value.repoRoot }),
    ).rejects.toThrow("foundation-kit repository itself");
    const nestedTarget = resolve(value.kitRoot, "nested-target");
    await mkdir(nestedTarget);
    await expect(
      resolveInstallRoots({ repoRoot: value.repoRoot, target: nestedTarget }),
    ).rejects.toThrow("into or below source kit");
  });

  it("rejects a target root symlink", async () => {
    const value = await fixture("target-root-symlink");
    const linkedTarget = resolve(value.root, "linked-target");
    await symlink(value.targetRoot, linkedTarget, "dir");
    await expect(
      resolveInstallRoots({ repoRoot: value.repoRoot, target: linkedTarget }),
    ).rejects.toThrow("must not be a symlink");
  });

  it("rejects source symlinks in mapped trees", async () => {
    const value = await fixture("source-symlink");
    const outside = resolve(value.root, "outside.md");
    await writeFile(outside, "outside\n");
    await symlink(outside, resolve(value.kitRoot, "codex/rules/linked.md"));
    await expect(buildMappings(value.kitRoot)).rejects.toThrow("Source symlinks are not supported");
  });

  it("rejects missing and wrongly typed required sources", async () => {
    const missing = await fixture("missing-source");
    await rm(resolve(missing.kitRoot, "AGENTS.md"));
    await expect(validateRequiredKitPaths(missing.kitRoot)).rejects.toThrow(
      "Required kit source is missing or is a symlink: AGENTS.md",
    );

    const wrongType = await fixture("wrong-source-type");
    await rm(resolve(wrongType.kitRoot, "repo-tools/config"), { recursive: true });
    await writeFile(resolve(wrongType.kitRoot, "repo-tools/config"), "not a directory\n");
    await expect(validateRequiredKitPaths(wrongType.kitRoot)).rejects.toThrow(
      "Required kit source must be a directory: repo-tools/config",
    );
  });
});
