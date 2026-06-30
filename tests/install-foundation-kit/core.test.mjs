import { readFileSync } from "node:fs";
import { glob, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";
import YAML from "yaml";
import { parseCliOptions, usage } from "../../scripts/install-foundation-kit/cli-options.mjs";
import { buildMappings } from "../../scripts/install-foundation-kit/mapping.mjs";
import { buildInstallPlan } from "../../scripts/install-foundation-kit/planner.mjs";
import {
  conflictOverwriteBlocked,
  conflictPolicyOutcome,
  resolveProjectMode,
} from "../../scripts/install-foundation-kit/project-mode.mjs";
import {
  CONFIRM_TOKEN,
  createInstallerPrompts,
} from "../../scripts/install-foundation-kit/prompts.mjs";
import {
  inspectTargetProject,
  TARGET_PROJECT_SIGNALS,
} from "../../scripts/install-foundation-kit/target-project.mjs";
import { resolveInstallRoots } from "../../scripts/install-foundation-kit/validation.mjs";
import { assertSupportedRuntime } from "../../scripts/install-foundation-kit.mjs";
import { createTestWorkspace } from "./helpers.mjs";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const workspaces = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => workspace.cleanup()));
});

async function workspace(name) {
  const value = await createTestWorkspace(name);
  workspaces.push(value);
  return value;
}

describe("installer CLI", () => {
  it("requires Node 24+", () => {
    expect(() => assertSupportedRuntime("22.0.0")).toThrow("Node.js 24 or newer");
    expect(() => assertSupportedRuntime("24.0.0")).not.toThrow();
  });

  it("parses quoted target paths and candidate flags without modification", () => {
    expect(
      parseCliOptions([
        "--target",
        '/tmp/Project "One" with spaces',
        "--apply",
        "--show-diff",
        "--project-mode",
        "existing",
        "--overwrite-conflicts",
        "--verbose",
      ]),
    ).toEqual({
      target: '/tmp/Project "One" with spaces',
      apply: true,
      showDiff: true,
      projectMode: "existing",
      overwriteConflicts: true,
      skipConflicts: false,
      replaceKitManaged: false,
      includeOptional: [],
      kitProfile: "",
      verbose: true,
      help: false,
    });
  });

  it("supports side-effect-free help and rejects missing or unknown arguments", () => {
    expect(parseCliOptions(["--help"]).help).toBe(true);
    expect(usage()).toContain("Default mode is dry-run");
    expect(parseCliOptions(["--target", "/tmp/x"]).projectMode).toBe("auto");
    expect(() => parseCliOptions(["--target", "/tmp/x", "--project-mode"])).toThrow(
      "--project-mode requires a value",
    );
    expect(() => parseCliOptions(["--target", "/tmp/x", "--project-mode", "legacy"])).toThrow(
      "Unsupported project mode",
    );
    expect(() => parseCliOptions([])).toThrow("--target is required");
    expect(() => parseCliOptions(["--target", "/tmp/x", "--unknown"])).toThrow("Unknown option");
  });

  it("parses safe apply and repeatable optional skill selections directly", () => {
    expect(
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--apply",
        "--skip-conflicts",
        "--include-optional",
        "optional-example",
        "--include-optional",
        "optional-example",
      ]),
    ).toMatchObject({
      apply: true,
      skipConflicts: true,
      overwriteConflicts: false,
      includeOptional: ["optional-example"],
    });
    expect(usage()).toContain(
      "pnpm install:node --target /path/to/project --apply --skip-conflicts",
    );
  });

  it("supports only the explicit docs profile", () => {
    expect(parseCliOptions(["--target", "/tmp/x", "--kit-profile", "docs"])).toMatchObject({
      kitProfile: "docs",
      includeOptional: [],
    });
    expect(usage()).toContain("--kit-profile docs");
    expect(() => parseCliOptions(["--target", "/tmp/x", "--kit-profile"])).toThrow(
      "--kit-profile requires a value",
    );
    expect(() => parseCliOptions(["--target", "/tmp/x", "--kit-profile", "full"])).toThrow(
      "Unsupported kit profile: full",
    );
    expect(() =>
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--kit-profile",
        "docs",
        "--include-optional",
        "optional-example",
      ]),
    ).toThrow("cannot be combined with --include-optional");
    expect(() =>
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--project-mode",
        "existing",
        "--apply",
        "--kit-profile",
        "docs",
        "--replace-kit-managed",
      ]),
    ).toThrow("cannot be combined with --replace-kit-managed");
  });

  it("rejects invalid safe apply combinations and an extra argument separator", () => {
    expect(() => parseCliOptions(["--target", "/tmp/x", "--skip-conflicts"])).toThrow(
      "--skip-conflicts requires --apply",
    );
    expect(() =>
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--apply",
        "--skip-conflicts",
        "--overwrite-conflicts",
      ]),
    ).toThrow("mutually exclusive");
    expect(() =>
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--apply",
        "--skip-conflicts",
        "--project-mode",
        "new",
      ]),
    ).toThrow("cannot be combined");
    expect(() => parseCliOptions(["--target", "/tmp/x", "--include-optional"])).toThrow(
      "--include-optional requires a skill name",
    );
    expect(() => parseCliOptions(["--", "--target", "/tmp/x"])).toThrow("Unknown option: --");
  });

  it("requires a dedicated existing-project authorization for managed replacement", () => {
    expect(
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--project-mode",
        "existing",
        "--apply",
        "--replace-kit-managed",
        "--include-optional",
        "react-component-patterns",
      ]),
    ).toMatchObject({
      apply: true,
      projectMode: "existing",
      replaceKitManaged: true,
      includeOptional: ["react-component-patterns"],
    });
    expect(() =>
      parseCliOptions([
        "--target",
        "/tmp/x",
        "--project-mode",
        "existing",
        "--replace-kit-managed",
      ]),
    ).toThrow("--replace-kit-managed requires --apply");
    expect(() =>
      parseCliOptions(["--target", "/tmp/x", "--apply", "--replace-kit-managed"]),
    ).toThrow("requires --project-mode existing");
    for (const conflictFlag of ["--skip-conflicts", "--overwrite-conflicts"]) {
      expect(() =>
        parseCliOptions([
          "--target",
          "/tmp/x",
          "--project-mode",
          "existing",
          "--apply",
          "--replace-kit-managed",
          conflictFlag,
        ]),
      ).toThrow("mutually exclusive");
    }
  });
});

describe("project mode policy", () => {
  it("detects the approved target project signals deterministically", async () => {
    const fixture = await workspace("target-signals");
    for (const signal of TARGET_PROJECT_SIGNALS) {
      const path = resolve(fixture.targetRoot, signal);
      if (signal.includes(".")) await writeFile(path, "signal\n");
      else await mkdir(path, { recursive: true });
    }
    const inspection = await inspectTargetProject(fixture.targetRoot);
    expect(inspection.existingProject).toBe(true);
    expect(inspection.detectedSignals).toEqual(TARGET_PROJECT_SIGNALS);
  });

  it("resolves auto from target evidence while explicit modes remain authoritative", () => {
    expect(
      resolveProjectMode({ requestedMode: "auto", detectedSignals: [], conflicts: 0 }),
    ).toMatchObject({ effectiveMode: "new" });
    expect(
      resolveProjectMode({ requestedMode: "auto", detectedSignals: ["src"], conflicts: 0 }),
    ).toMatchObject({ effectiveMode: "existing" });
    expect(
      resolveProjectMode({ requestedMode: "auto", detectedSignals: [], conflicts: 1 }),
    ).toMatchObject({ effectiveMode: "existing" });
    expect(
      resolveProjectMode({ requestedMode: "new", detectedSignals: ["src"], conflicts: 1 }),
    ).toMatchObject({ effectiveMode: "new" });
    expect(
      resolveProjectMode({ requestedMode: "existing", detectedSignals: [], conflicts: 0 }),
    ).toMatchObject({ effectiveMode: "existing" });
  });

  it("requires explicit overwrite only for existing-like conflicts", () => {
    const policy = resolveProjectMode({
      requestedMode: "existing",
      detectedSignals: ["README.md"],
      conflicts: 1,
    });
    expect(conflictOverwriteBlocked({ policy, overwriteConflicts: false })).toBe(true);
    expect(conflictOverwriteBlocked({ policy, overwriteConflicts: true })).toBe(false);
    expect(conflictPolicyOutcome({ policy, overwriteConflicts: false })).toBe(
      "manual-review-required",
    );
  });
});

describe("source repository package scripts", () => {
  it("uses the explicit Node installer without active Bash or default aliases", () => {
    expect(packageJson.scripts["install:node"]).toBe("node scripts/install-foundation-kit.mjs");
    expect(packageJson.scripts["install:bash"]).toBeUndefined();
    expect(packageJson.scripts.install).toBeUndefined();
  });

  it("runs the Node installer suite through test:install and pnpm check", () => {
    expect(packageJson.scripts["test:install:node"]).toBe(
      "vitest run tests/install-foundation-kit",
    );
    expect(packageJson.scripts["test:install:bash"]).toBeUndefined();
    expect(packageJson.scripts["test:install"]).toBe("pnpm test:install:node");
    expect(packageJson.scripts.check).toContain("pnpm test:install");
  });
});

describe("source repository metadata hygiene", () => {
  it("keeps skill metadata parseable and enforces taxonomy boundaries", async () => {
    const paths = [];
    for (const pattern of [
      "kit/skills/meta/*/metadata.yml",
      "kit/skills/core/*/metadata.yml",
      "kit/optional-skills/*/metadata.yml",
    ]) {
      for await (const path of glob(pattern)) {
        paths.push(path);
      }
    }
    expect(paths.length).toBeGreaterThan(0);

    const metadataByName = new Map();
    for (const path of paths.sort()) {
      const text = await readFile(path, "utf8");
      const documents = YAML.parseAllDocuments(text);
      expect(documents, path).toHaveLength(1);
      expect(documents[0].errors, path).toEqual([]);

      const metadata = documents[0].toJSON();
      expect(metadata, path).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        invocation: expect.any(String),
        required: expect.any(Boolean),
        depends_on: expect.any(Array),
        version: expect.any(String),
      });
      expect(metadata.name, path).toBe(path.split("/").at(-2));
      expect(["meta", "core", "optional"], path).toContain(metadata.category);
      expect(["user", "model", "support"], path).toContain(metadata.invocation);
      const expectedCategory = path.startsWith("kit/skills/meta/")
        ? "meta"
        : path.startsWith("kit/skills/core/")
          ? "core"
          : "optional";
      expect(metadata.category, path).toBe(expectedCategory);
      expect(metadata.required, path).toBe(expectedCategory !== "optional");
      expect(metadataByName.has(metadata.name), `${path}: duplicate skill name`).toBe(false);
      metadataByName.set(metadata.name, { ...metadata, path });
    }

    for (const metadata of metadataByName.values()) {
      for (const dependency of metadata.depends_on) {
        const target = metadataByName.get(dependency);
        expect(target, `${metadata.path}: unknown dependency ${dependency}`).toBeDefined();
        if (metadata.category === "meta") {
          expect(target.category, `${metadata.path}: meta dependency ${dependency}`).toBe("meta");
        }
        if (metadata.category === "core") {
          expect(target.category, `${metadata.path}: core dependency ${dependency}`).toBe("meta");
        }
      }
    }

    expect(metadataByName.get("grilling")).toMatchObject({
      category: "meta",
      required: true,
      invocation: "support",
      depends_on: [],
    });
    expect(metadataByName.get("grill-me")).toMatchObject({
      category: "meta",
      invocation: "user",
      depends_on: ["grilling"],
    });
    for (const name of [
      "plan-with-context",
      "initialize-project-context",
      "project-architecture-plan",
    ]) {
      expect(metadataByName.get(name)?.depends_on, name).toEqual(["project-memory", "grilling"]);
    }
  });
});

describe("source repository reference hygiene", () => {
  it("requires an objective recheck before extending existing plans", async () => {
    const text = await readFile("kit/skills/meta/plan-with-context/SKILL.md", "utf8");

    expect(text).toContain("## Objective Recheck for Existing Plans");
    expect(text).toContain("If the objective is already satisfied, recommend closeout or re-scope");
    expect(text).toContain(
      "Do not require a full lessons-file read for unrelated or trivial tasks.",
    );
  });

  it("keeps shared task and change principles advisory with direct operating boundaries", async () => {
    const paths = [
      "kit/rules/agent-operating-contract.md",
      "kit/rules/engineering-quality-principles.md",
      "kit/rules/task-and-change-safety-principles.md",
    ];
    const documents = Object.fromEntries(
      await Promise.all(paths.map(async (path) => [path, await readFile(path, "utf8")])),
    );
    const contract = documents["kit/rules/agent-operating-contract.md"];
    const engineering = documents["kit/rules/engineering-quality-principles.md"];
    const shared = documents["kit/rules/task-and-change-safety-principles.md"];

    expect(contract).toContain("task-and-change-safety-principles.md");
    expect(engineering).toContain("task-and-change-safety-principles.md");
    expect(shared).toContain("This rule is non-authorizing and non-ceremonial");
    expect(shared).toContain("It is not a workflow");
    expect(shared).toContain("This rule guides judgment only");

    for (const heading of [
      "Startup Order",
      "Project Memory Context Gate",
      "Explicit Target Reference Guardrail",
      "Requirement Clarification Gate",
      "Project Root Boundary",
      "Global Toolchain and Out-of-Project Operation Boundary",
      "Skill Routing Map",
      "Durable Project Memory Loop",
      "Final Report Boundary",
      "Publishable Change Handoff",
    ]) {
      expect(contract.match(new RegExp(`^## ${heading}$`, "gm")), heading).toHaveLength(1);
    }

    for await (const path of glob("kit/rules/*.md")) {
      expect(await readFile(path, "utf8"), path).not.toContain("Base Collaboration Protocol");
    }
  });

  it("keeps the publishable change handoff canonical with concise workflow pointers", async () => {
    const paths = [
      "AGENTS.md",
      "kit/project-templates/AGENTS.md",
      "kit/rules/agent-operating-contract.md",
      "kit/skills/core/execute-plan/SKILL.md",
      "kit/skills/core/publish-current-branch/SKILL.md",
      "kit/skills/meta/update-project-memory/SKILL.md",
      "kit/skills/meta/writing-great-skills/SKILL.md",
    ];
    const documents = Object.fromEntries(
      await Promise.all(paths.map(async (path) => [path, await readFile(path, "utf8")])),
    );
    const contract = documents["kit/rules/agent-operating-contract.md"];

    expect(contract.match(/^## Publishable Change Handoff$/gm)).toHaveLength(1);
    expect(contract).toContain(
      "Whenever `Publish changes recommendation` is present, `PR for review`",
    );
    expect(contract).toContain("Recommended next workflow: code-review");
    expect(contract).toContain(
      [
        "PR for review:",
        "",
        "```bash",
        'pnpm publish:pr-only "<commit message>" "<PR title>"',
        "```",
      ].join("\n"),
    );
    expect(contract).not.toContain(
      'PR for review: pnpm publish:pr-only "<commit message>" "<PR title>"',
    );
    expect(contract).toContain("PR for review: not checked (");
    expect(contract).toContain("PR for review: not available (");
    expect(contract).toContain("Do not paraphrase, rename, merge, or substitute");
    expect(contract).toContain("do not wrap the complete\nfour-field handoff in a code block");
    expect(contract).toContain("Publication guardrail:");
    expect(contract).toContain("do not create/update a PR unless the user explicitly authorizes");
    expect(contract).toContain("until review is complete and the user explicitly authorizes it");
    expect(contract).toContain(
      "Do not use\n`pnpm publish:changes` as a PR-for-review or Fast PR substitute",
    );
    expect(contract).toContain("do not infer other command\nforms from package script names");
    expect(contract).not.toContain("Fast PR after review approval");
    expect(contract).toContain("not available (<reason>)");
    expect(contract).toContain("not checked (<reason>)");
    expect(contract).toContain("Do not guess a command");
    expect(contract).toContain(
      "Publishable changes: none; local-only artifacts changed: <paths or summary>",
    );
    expect(contract).toContain("When publishable changes and local-only artifacts both changed");
    expect(contract).toContain("does not itself authorize any publication action");
    expect(contract).toMatch(
      /`publish-current-branch`\s+remains the only workflow\s+authorized to push/,
    );

    for (const path of [
      "AGENTS.md",
      "kit/project-templates/AGENTS.md",
      "kit/skills/core/execute-plan/SKILL.md",
      "kit/skills/meta/update-project-memory/SKILL.md",
      "kit/skills/meta/writing-great-skills/SKILL.md",
    ]) {
      expect(documents[path], path).toContain("Publishable Change Handoff");
      expect(documents[path], path).not.toContain(
        "Whenever `Publish changes recommendation` is present, `PR for review`",
      );
    }

    for (const path of ["AGENTS.md", "kit/project-templates/AGENTS.md"]) {
      expect(documents[path], path).toContain("PR for review");
      expect(documents[path], path).toContain("Publication guardrail");
      expect(documents[path], path).not.toContain(
        'pnpm publish:pr-only "<commit message>" "<PR title>"',
      );
      expect(documents[path].match(/Fast PR/g), path).toBeNull();
    }

    expect(documents["kit/skills/core/execute-plan/SKILL.md"]).toContain(
      "Do not wrap the\ncomplete handoff in one code block",
    );
    expect(documents["kit/skills/core/execute-plan/SKILL.md"]).toContain(
      "Do not paraphrase `PR for review`",
    );
    expect(documents["kit/skills/core/execute-plan/SKILL.md"]).toContain(
      "command-only `bash` code block",
    );
    expect(documents["kit/skills/core/execute-plan/SKILL.md"]).not.toContain(
      "Fast PR after review approval",
    );
    expect(documents["kit/skills/core/execute-plan/SKILL.md"]).not.toContain(
      "publish readiness / publish handoff -> recommend publish-current-branch after execution",
    );
    expect(documents["AGENTS.md"]).toContain(
      "recommended commit message when publishable changes exist",
    );
    expect(documents["kit/skills/meta/update-project-memory/SKILL.md"]).toContain(
      "The no-update output below does not trigger that handoff",
    );
    expect(documents["kit/skills/meta/writing-great-skills/SKILL.md"].match(/Fast PR/g)).toBeNull();
    expect(documents["kit/skills/core/publish-current-branch/SKILL.md"]).not.toContain(
      "Publishable Change Handoff",
    );
  });

  it("keeps the explicit target reference guardrail canonical with concise pointers", async () => {
    const paths = [
      "AGENTS.md",
      "kit/project-templates/AGENTS.md",
      "kit/rules/agent-operating-contract.md",
      "kit/rules/skill-invocation-and-dependency-boundaries.md",
      "kit/skills/meta/initialize-project-context/SKILL.md",
    ];
    const documents = Object.fromEntries(
      await Promise.all(paths.map(async (path) => [path, await readFile(path, "utf8")])),
    );
    const heading = "Explicit Target Reference Guardrail";

    expect(
      documents["kit/rules/agent-operating-contract.md"].match(
        /^## Explicit Target Reference Guardrail$/gm,
      ),
    ).toHaveLength(1);
    expect(documents["kit/rules/agent-operating-contract.md"]).toContain(
      "Stop and ask for direction when the target is required",
    );
    expect(documents["kit/rules/agent-operating-contract.md"]).toContain("For prospective output");
    expect(documents["kit/rules/agent-operating-contract.md"]).toContain(
      "unless the reference is clearly historical",
    );
    expect(documents["kit/rules/agent-operating-contract.md"]).toContain(
      "The installer does not automatically clean obsolete installed paths",
    );
    expect(documents["AGENTS.md"]).toContain(
      "Explicit Target Reference Guardrail in\n`kit/rules/agent-operating-contract.md`",
    );
    expect(documents["kit/project-templates/AGENTS.md"]).toContain(heading);
    expect(documents["kit/project-templates/AGENTS.md"]).toContain(
      ".codex/rules/agent-operating-contract.md",
    );
    expect(documents["kit/rules/skill-invocation-and-dependency-boundaries.md"]).toContain(heading);
    expect(documents["kit/skills/meta/initialize-project-context/SKILL.md"]).toContain(heading);
  });

  it("keeps active surfaces free of obsolete meta skill paths", async () => {
    const activePaths = new Set([
      "AGENTS.md",
      "README.md",
      "kit/project-templates/AGENTS.md",
      ".codex/project/project-guideline.md",
      "docs/foundation-kit-skills-review-and-optimization-roadmap.md",
    ]);
    for (const pattern of [
      "kit/skills/**/*.md",
      "kit/prompts/**/*.md",
      "kit/rules/**/*.md",
      "tests/**/*.mjs",
      "scripts/**/*.mjs",
    ]) {
      for await (const path of glob(pattern)) activePaths.add(path);
    }

    const metaSkillNames = [
      "agent-roles-and-capabilities",
      "docs-first-research",
      "grilling",
      "grill-me",
      "handoff",
      "initialize-project-context",
      "plan-with-context",
      "project-memory",
      "update-project-memory",
      "writing-great-skills",
    ];
    const obsoleteReferences = metaSkillNames.flatMap((name) => [
      ["kit", "skills", "core", name].join("/"),
      [".codex", "skills", "core", name].join("/"),
    ]);

    for (const path of [...activePaths].sort()) {
      const text = await readFile(path, "utf8");
      for (const reference of obsoleteReferences) {
        expect(text, `${path}: obsolete active reference ${reference}`).not.toContain(reference);
      }
    }
  });
});

describe("mapping and boundaries", () => {
  it("maps templates and complete installable trees deterministically", async () => {
    const fixture = await workspace("mapping");
    const mappings = await buildMappings(fixture.kitRoot);
    expect(mappings).toEqual(
      [...mappings].sort((left, right) => left.targetRelative.localeCompare(right.targetRelative)),
    );
    expect(mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRelative: "project-templates/AGENTS.md",
          targetRelative: "AGENTS.md",
        }),
        expect.objectContaining({
          sourceRelative: "config/example.json",
          targetRelative: ".codex/config/example.json",
        }),
        expect.objectContaining({
          sourceRelative: "scripts/publish-changes.mjs",
          targetRelative: ".codex/scripts/publish-changes.mjs",
        }),
        expect.objectContaining({
          sourceRelative: "skills/meta/meta-example/SKILL.md",
          targetRelative: ".codex/skills/meta/meta-example/SKILL.md",
        }),
        expect.objectContaining({
          sourceRelative: "skills/core/core-example/SKILL.md",
          targetRelative: ".codex/skills/core/core-example/SKILL.md",
        }),
      ]),
    );
    expect(mappings.some((entry) => entry.sourceRelative.startsWith("scripts/install-"))).toBe(
      false,
    );
    expect(mappings.some((entry) => entry.sourceRelative.endsWith(".sh"))).toBe(false);
    expect(mappings.some((entry) => entry.sourceRelative.startsWith("archive/"))).toBe(false);
    expect(mappings.some((entry) => entry.category === "optional")).toBe(false);
    expect(mappings.some((entry) => entry.targetRelative === "package.json")).toBe(false);
  });

  it("installs selected optional skills only into the engineering namespace", async () => {
    const fixture = await workspace("optional-mapping");
    const mappings = await buildMappings(fixture.kitRoot, {
      includeOptional: ["optional-example"],
    });
    const optionalMappings = mappings.filter((entry) => entry.category === "optional");

    expect(optionalMappings).toHaveLength(2);
    expect(optionalMappings.every((entry) => entry.optionalName === "optional-example")).toBe(true);
    expect(optionalMappings.map((entry) => entry.targetRelative)).toEqual([
      ".codex/skills/engineering/optional-example/metadata.yml",
      ".codex/skills/engineering/optional-example/SKILL.md",
    ]);
    expect(
      optionalMappings.some((entry) =>
        [
          ".codex/skills/optional/",
          ".codex/skills/project/",
          ".codex/skills/optional-example/",
        ].some((prefix) => entry.targetRelative.startsWith(prefix)),
      ),
    ).toBe(false);
    const plan = await buildInstallPlan({
      ...fixture,
      includeOptional: ["optional-example"],
    });
    expect(plan.optionalSelectedFiles).toBe(2);
  });

  it("rejects unknown optional skills and malformed optional metadata", async () => {
    const unknown = await workspace("optional-unknown");
    await expect(
      buildMappings(unknown.kitRoot, { includeOptional: ["missing-skill"] }),
    ).rejects.toThrow("Unknown optional skill: missing-skill");

    const malformed = await workspace("optional-malformed");
    await writeFile(
      resolve(malformed.kitRoot, "optional-skills", "optional-example/metadata.yml"),
      "name: wrong-name\ncategory: optional\nrequired: false\n",
    );
    await expect(
      buildMappings(malformed.kitRoot, { includeOptional: ["optional-example"] }),
    ).rejects.toThrow("metadata must match its directory");
  });

  it("excludes local OS junk files from installable tree mappings", async () => {
    const fixture = await workspace("mapping-os-junk");
    await writeFile(resolve(fixture.kitRoot, "skills/.DS_Store"), "local artifact\n");
    await writeFile(resolve(fixture.kitRoot, "prompts/Thumbs.db"), "local artifact\n");
    await writeFile(resolve(fixture.kitRoot, "rules/._example.md"), "local artifact\n");
    await writeFile(resolve(fixture.kitRoot, "config/desktop.ini"), "local artifact\n");

    const mappings = await buildMappings(fixture.kitRoot);
    expect(mappings.some((entry) => entry.sourceRelative.includes(".DS_Store"))).toBe(false);
    expect(mappings.some((entry) => entry.sourceRelative.includes("Thumbs.db"))).toBe(false);
    expect(mappings.some((entry) => entry.sourceRelative.includes("/._"))).toBe(false);
    expect(mappings.some((entry) => entry.sourceRelative.includes("desktop.ini"))).toBe(false);
  });

  it("treats identical existing files as safe skips", async () => {
    const fixture = await workspace("identical");
    await writeFile(
      resolve(fixture.targetRoot, "AGENTS.md"),
      await readFile(resolve(fixture.kitRoot, "project-templates/AGENTS.md")),
    );
    const plan = await buildInstallPlan(fixture);
    const agents = plan.entries.find((entry) => entry.targetRelative === "AGENTS.md");
    expect(agents).toMatchObject({
      contentState: "existing-identical",
      action: "skip-identical",
    });
    expect(plan.conflicts).toBe(0);
  });

  it("treats identical project memory as a safe skip", async () => {
    const fixture = await workspace("identical-memory");
    const target = resolve(fixture.targetRoot, ".codex/project/project-guideline.md");
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(
      target,
      await readFile(resolve(fixture.kitRoot, "project-templates/project-guideline.md")),
    );
    const plan = await buildInstallPlan(fixture);
    expect(
      plan.entries.find((entry) => entry.targetRelative.endsWith("project-guideline.md")),
    ).toMatchObject({
      contentState: "existing-identical",
      ownership: "project-owned",
      kind: "project-memory",
      action: "skip-identical",
    });
  });

  it("classifies project memory and AGENTS.md separately from reusable files", async () => {
    const fixture = await workspace("ownership-classification");
    await mkdir(resolve(fixture.targetRoot, ".codex/project"), { recursive: true });
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "local agents\n");
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project/project-guideline.md"),
      "local memory\n",
    );
    const plan = await buildInstallPlan(fixture);

    expect(plan.entries.find((entry) => entry.targetRelative === "AGENTS.md")).toMatchObject({
      contentState: "existing-different",
      ownership: "mixed",
      kind: "entrypoint",
      resultCategory: "BLOCKED_MANUAL",
      action: "manual-merge",
    });
    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/project/project-guideline.md"),
    ).toMatchObject({
      contentState: "existing-different",
      ownership: "project-owned",
      kind: "project-memory",
      resultCategory: "PROJECT_OWNED",
      action: "preserve",
    });
  });

  it("treats the publish theme as reusable while preserving project-owned publish policy", async () => {
    const fixture = await workspace("publish-config-ownership");
    const configRoot = resolve(fixture.targetRoot, ".codex/config");
    await mkdir(configRoot, { recursive: true });
    await writeFile(resolve(configRoot, "publish-cli-theme.json"), '{"project":"theme"}\n');
    await writeFile(resolve(configRoot, "publish-changes-policy.yml"), "project: policy\n");

    const plan = await buildInstallPlan(fixture);

    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/config/publish-cli-theme.json"),
    ).toMatchObject({
      ownership: "kit-managed",
      risk: "normal",
      kind: "reusable",
      baselineAdoptable: true,
      resultCategory: "BLOCKED_MANUAL",
      action: "review",
    });
    expect(
      plan.entries.find(
        (entry) => entry.targetRelative === ".codex/config/publish-changes-policy.yml",
      ),
    ).toMatchObject({
      ownership: "project-owned",
      risk: "manual",
      kind: "project-config",
      baselineAdoptable: false,
      resultCategory: "PROJECT_OWNED",
      action: "preserve",
    });
  });

  it("classifies workflow scripts by content state without changing new-file behavior", async () => {
    const fixture = await workspace("workflow-script-classification");
    const targetRelative = ".codex/scripts/publish-changes.mjs";
    const target = resolve(fixture.targetRoot, targetRelative);
    const source = resolve(fixture.kitRoot, "scripts/publish-changes.mjs");

    let plan = await buildInstallPlan(fixture);
    expect(plan.entries.find((entry) => entry.targetRelative === targetRelative)).toMatchObject({
      contentState: "new",
      ownership: "kit-managed",
      kind: "workflow-script",
      risk: "manual",
      resultCategory: "SAFE_ADD",
      action: "write",
    });

    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, await readFile(source));
    plan = await buildInstallPlan(fixture);
    expect(plan.entries.find((entry) => entry.targetRelative === targetRelative)).toMatchObject({
      contentState: "existing-identical",
      ownership: "kit-managed",
      kind: "workflow-script",
      action: "skip-identical",
    });

    await writeFile(target, "project-specific publish workflow\n");
    plan = await buildInstallPlan(fixture);
    expect(plan.entries.find((entry) => entry.targetRelative === targetRelative)).toMatchObject({
      contentState: "existing-different",
      ownership: "kit-managed",
      kind: "workflow-script",
      resultCategory: "BLOCKED_MANUAL",
      action: "script-merge",
    });
    expect(plan.scriptMergeFiles).toBe(1);
    expect(plan.reviewItems).toBe(1);
  });

  it("flags only kit-managed optional-skill namespace collisions", async () => {
    const fixture = await workspace("optional-collisions");
    await mkdir(resolve(fixture.targetRoot, ".codex/skills/project/optional-example"), {
      recursive: true,
    });
    let plan = await buildInstallPlan({
      ...fixture,
      includeOptional: ["optional-example"],
    });
    expect(plan.entries.filter((entry) => entry.optionalName === "optional-example")).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: "write", collisionPath: "" })]),
    );

    await mkdir(resolve(fixture.targetRoot, ".codex/skills/core/optional-example"), {
      recursive: true,
    });
    plan = await buildInstallPlan({ ...fixture, includeOptional: ["optional-example"] });
    expect(plan.entries.filter((entry) => entry.optionalName === "optional-example")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "migration-review",
          collisionPath: ".codex/skills/core/optional-example",
        }),
      ]),
    );
  });

  it("flags legacy core locations for required meta skills", async () => {
    const fixture = await workspace("meta-collision");
    await mkdir(resolve(fixture.targetRoot, ".codex/skills/core/meta-example"), {
      recursive: true,
    });
    const plan = await buildInstallPlan(fixture);
    expect(
      plan.entries.find(
        (entry) => entry.targetRelative === ".codex/skills/meta/meta-example/SKILL.md",
      ),
    ).toMatchObject({
      action: "migration-review",
      collisionPath: ".codex/skills/core/meta-example",
    });
  });

  it("rejects target symlinks and source symlinks", async () => {
    const targetFixture = await workspace("target-symlink");
    const outside = resolve(targetFixture.root, "outside");
    await mkdir(outside);
    await mkdir(resolve(targetFixture.targetRoot, ".codex"));
    await symlink(outside, resolve(targetFixture.targetRoot, ".codex/skills"));
    await expect(buildInstallPlan(targetFixture)).rejects.toThrow("symlink");

    const sourceFixture = await workspace("source-symlink");
    await symlink(
      resolve(sourceFixture.kitRoot, "prompts/example.md"),
      resolve(sourceFixture.kitRoot, "prompts/linked.md"),
    );
    await expect(buildMappings(sourceFixture.kitRoot)).rejects.toThrow(
      "Source symlinks are not supported",
    );
  });

  it("rejects repository-root and kit-contained targets", async () => {
    const fixture = await workspace("unsafe-target");
    await expect(
      resolveInstallRoots({ repoRoot: fixture.repoRoot, target: fixture.repoRoot }),
    ).rejects.toThrow("foundation-kit repository itself");
    await expect(
      resolveInstallRoots({ repoRoot: fixture.repoRoot, target: fixture.kitRoot }),
    ).rejects.toThrow("source kit");
  });

  it("requires the optional-skill source boundary to remain a real directory", async () => {
    const fixture = await workspace("optional-source-boundary");
    const optionalRoot = resolve(fixture.kitRoot, "optional-skills");
    await rm(optionalRoot, { recursive: true });
    await writeFile(optionalRoot, "not a directory\n");
    await expect(
      resolveInstallRoots({ repoRoot: fixture.repoRoot, target: fixture.targetRoot }),
    ).rejects.toThrow("must be a directory: optional-skills");
  });
});

describe("confirmation input", () => {
  async function runPrompt({ token, interactive }) {
    const input = new PassThrough();
    const output = new PassThrough();
    if (interactive) {
      input.isTTY = true;
      output.isTTY = true;
    }
    const prompts = createInstallerPrompts({ input, output });
    const pending = prompts.confirmBackup();
    input.end(`${token}\n`);
    try {
      return await pending;
    } finally {
      prompts.close();
    }
  }

  it("accepts exact piped confirmation", async () => {
    await expect(runPrompt({ token: CONFIRM_TOKEN, interactive: false })).resolves.toBe(true);
  });

  it("accepts piped confirmation that arrives before the prompt begins", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const prompts = createInstallerPrompts({ input, output });
    input.end(`${CONFIRM_TOKEN}\n`);
    await new Promise((resolve) => setImmediate(resolve));
    try {
      await expect(prompts.confirmBackup()).resolves.toBe(true);
    } finally {
      prompts.close();
    }
  });

  it("accepts exact interactive confirmation", async () => {
    await expect(runPrompt({ token: CONFIRM_TOKEN, interactive: true })).resolves.toBe(true);
  });

  it("rejects wrong or missing confirmation", async () => {
    await expect(runPrompt({ token: "NO", interactive: false })).rejects.toThrow(
      "Confirmation token did not match",
    );
    await expect(runPrompt({ token: "", interactive: false })).rejects.toThrow(
      "Confirmation token did not match",
    );
  });
});
