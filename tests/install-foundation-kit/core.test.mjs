import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import { parseCliOptions, usage } from "../../scripts/install-foundation-kit/cli-options.mjs";
import { buildMappings } from "../../scripts/install-foundation-kit/mapping.mjs";
import {
  OWNERSHIP,
  ownershipPolicyFor,
} from "../../scripts/install-foundation-kit/ownership-policy.mjs";
import { validateRequiredKitPaths } from "../../scripts/install-foundation-kit/validation.mjs";

const kitRoot = resolve(import.meta.dirname, "../../kit");

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
    expect(byTarget.get("AGENTS.md")).toBe("project-templates/AGENTS.md");
    expect(byTarget.get(".codex/project-memory/guideline.md")).toBe(
      "project-templates/project-memory/guideline.md",
    );
    expect(byTarget.get(".codex/project-memory/decisions.md")).toBe(
      "project-templates/project-memory/decisions.md",
    );
    expect(byTarget.get(".codex/project-memory/lessons-learned.md")).toBe(
      "project-templates/project-memory/lessons-learned.md",
    );
    expect(byTarget.get(".codex/project-specific/agent-guidance.md")).toBe(
      "project-templates/project-specific/agent-guidance.md",
    );
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/skills/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/rules/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/prompts/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/scripts/"))).toBe(true);
    expect([...byTarget.keys()].some((target) => target.startsWith(".codex/project/"))).toBe(false);
  });

  it("classifies only the two repository-owned namespaces as preserved", () => {
    expect(ownershipPolicyFor({ targetRelative: "AGENTS.md" }).ownership).toBe(
      OWNERSHIP.KIT_MANAGED,
    );
    expect(
      ownershipPolicyFor({ targetRelative: ".codex/scripts/publish-changes.mjs" }).ownership,
    ).toBe(OWNERSHIP.KIT_MANAGED);
    expect(
      ownershipPolicyFor({ targetRelative: ".codex/project-memory/guideline.md" }).ownership,
    ).toBe(OWNERSHIP.PROJECT_OWNED);
    expect(
      ownershipPolicyFor({ targetRelative: ".codex/project-specific/agent-guidance.md" }).ownership,
    ).toBe(OWNERSHIP.PROJECT_OWNED);
  });

  it("keeps all real skill metadata machine-readable and path-aligned", async () => {
    const mappings = await buildMappings(kitRoot);
    const metadataMappings = mappings.filter((mapping) =>
      mapping.sourceRelative.endsWith("/metadata.yml"),
    );
    expect(metadataMappings.length).toBeGreaterThan(0);
    for (const mapping of metadataMappings) {
      const metadata = YAML.parse(await readFile(resolve(kitRoot, mapping.sourceRelative), "utf8"));
      const name = mapping.sourceRelative.split("/").at(-2);
      expect(metadata.name).toBe(name);
      expect(["meta", "core"]).toContain(metadata.category);
      expect(Array.isArray(metadata.depends_on)).toBe(true);
    }
  });

  it("validates the new template source layout", async () => {
    await expect(validateRequiredKitPaths(kitRoot)).resolves.toBeUndefined();
  });
});
