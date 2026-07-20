import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import YAML from "yaml";
import {
  DOCS_PROFILE_GROUPS,
  replacementRootsForKitProfile,
  resolveKitProfile,
  selectMappingsForKitProfile,
} from "../../scripts/install-foundation-kit/kit-profiles.mjs";
import { buildMappings } from "../../scripts/install-foundation-kit/mapping.mjs";
import { payloadGroupFor } from "../../scripts/install-foundation-kit/payload-groups.mjs";

const kitRoot = resolve(import.meta.dirname, "../../kit");

describe("installer kit profiles", () => {
  it("defines the exact ordered docs capability set", () => {
    expect(DOCS_PROFILE_GROUPS).toEqual([
      "project-templates",
      "common-workflow",
      "docs-writing-workflow",
      "publish-package",
    ]);
    expect(resolveKitProfile("docs").selectedPayloadGroups).toEqual(DOCS_PROFILE_GROUPS);
  });

  it("returns the complete mapping array unchanged when no profile is requested", async () => {
    const mappings = await buildMappings(kitRoot);
    const selection = selectMappingsForKitProfile(mappings);

    expect(selection.mappings).toBe(mappings);
    expect(selection.requestedKitProfile).toBe("");
    expect(selection.selectedPayloadGroups).toEqual([]);
  });

  it("declares profile-aware replacement roots independently from discovered files", () => {
    expect(replacementRootsForKitProfile()).toEqual([
      ".codex/prompts",
      ".codex/rules",
      ".codex/skills",
      ".repo-tools",
    ]);
    expect(replacementRootsForKitProfile("docs")).toEqual([
      ".codex/prompts",
      ".codex/rules",
      ".codex/skills",
      ".repo-tools/config",
      ".repo-tools/scripts",
    ]);
  });

  it("selects only the approved docs groups from current real mappings", async () => {
    const mappings = await buildMappings(kitRoot);
    const selection = selectMappingsForKitProfile(mappings, "docs");
    const groups = new Set(selection.mappings.map((mapping) => payloadGroupFor(mapping)));

    expect(selection.mappings.length).toBeGreaterThan(0);
    expect(groups).toEqual(new Set(DOCS_PROFILE_GROUPS));
    expect(selection.mappings.some((mapping) => payloadGroupFor(mapping) === "code-workflow")).toBe(
      false,
    );
    expect(selection.mappings.some((mapping) => payloadGroupFor(mapping) === "github-setup")).toBe(
      false,
    );
  });

  it("rejects unknown profile names", () => {
    expect(() => resolveKitProfile("full")).toThrow("Unsupported kit profile: full");
  });

  it("keeps selected skill hard dependencies inside the docs profile", async () => {
    const mappings = await buildMappings(kitRoot);
    const selection = selectMappingsForKitProfile(mappings, "docs");
    const metadataMappings = selection.mappings.filter((mapping) =>
      mapping.targetRelative.match(/^\.codex\/skills\/(?:meta|core)\/[^/]+\/metadata\.yml$/),
    );
    const selectedSkills = new Set(
      metadataMappings.map(
        (mapping) =>
          mapping.targetRelative.match(
            /^\.codex\/skills\/(?:meta|core)\/([^/]+)\/metadata\.yml$/,
          )[1],
      ),
    );

    for (const mapping of metadataMappings) {
      const metadata = YAML.parse(await readFile(resolve(kitRoot, mapping.sourceRelative), "utf8"));
      for (const dependency of metadata.depends_on ?? []) {
        expect(selectedSkills, `${metadata.name} depends on excluded ${dependency}`).toContain(
          dependency,
        );
      }
    }
  });
});
