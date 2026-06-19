import { readFileSync } from "node:fs";
import { glob, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
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
    for await (const path of glob("kit/skills/core/*/metadata.yml")) {
      paths.push(path);
    }
    for await (const path of glob("optional-skills/*/metadata.yml")) {
      paths.push(path);
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
      expect(metadata.required, path).toBe(metadata.category !== "optional");
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
      ]),
    );
    expect(mappings.some((entry) => entry.sourceRelative.startsWith("scripts/install-"))).toBe(
      false,
    );
    expect(mappings.some((entry) => entry.sourceRelative.endsWith(".sh"))).toBe(false);
    expect(mappings.some((entry) => entry.sourceRelative.startsWith("archive/"))).toBe(false);
    expect(mappings.some((entry) => entry.targetRelative === "package.json")).toBe(false);
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

  it("treats identical existing files as conflicts", async () => {
    const fixture = await workspace("identical");
    await writeFile(
      resolve(fixture.targetRoot, "AGENTS.md"),
      await readFile(resolve(fixture.kitRoot, "project-templates/AGENTS.md")),
    );
    const plan = await buildInstallPlan(fixture);
    const agents = plan.entries.find((entry) => entry.targetRelative === "AGENTS.md");
    expect(agents).toMatchObject({
      state: "conflict",
      contentState: "identical",
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
