import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { InstallerError } from "../../scripts/install-foundation-kit/errors.mjs";
import { runInstallerFlow } from "../../scripts/install-foundation-kit/flow.mjs";
import { hashFile } from "../../scripts/install-foundation-kit/fs-safe.mjs";
import {
  BOOTSTRAP_CRITICAL_TARGETS,
  BOOTSTRAP_DEPENDENCY_GUARD_TARGETS,
} from "../../scripts/install-foundation-kit/payload-groups.mjs";
import { PUBLISH_PACKAGE_ALIASES } from "../../scripts/install-foundation-kit/publish-aliases.mjs";
import { commandRunner, createOutput, createTestWorkspace } from "./helpers.mjs";

const workspaces = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => workspace.cleanup()));
});

async function workspace(name) {
  const value = await createTestWorkspace(name);
  workspaces.push(value);
  return value;
}

function options(target, overrides = {}) {
  return {
    target,
    apply: false,
    showDiff: false,
    projectMode: "auto",
    overwriteConflicts: false,
    skipConflicts: false,
    replaceKitManaged: false,
    includeOptional: [],
    verbose: false,
    help: false,
    ...overrides,
  };
}

function prompts({ accept = true } = {}) {
  return {
    confirmBackup: async () => {
      if (!accept) {
        throw new InstallerError("USER_CANCELLED", "Confirmation token did not match.");
      }
      return true;
    },
  };
}

async function run(fixture, overrides = {}) {
  return runInstallerFlow({
    repoRoot: fixture.repoRoot,
    options: options(fixture.targetRoot, overrides.options),
    output: overrides.output ?? createOutput(),
    prompts: overrides.prompts ?? prompts(),
    commandRunner: overrides.commandRunner ?? commandRunner(),
    runId: overrides.runId ?? "test-run",
    now: overrides.now ?? (() => new Date("2026-06-15T12:34:56.000Z")),
    hooks: overrides.hooks,
  });
}

async function writeFixtureSource(fixture, sourceRelative, contents = "source fixture\n") {
  const source = resolve(fixture.kitRoot, sourceRelative);
  await mkdir(resolve(source, ".."), { recursive: true });
  await writeFile(source, contents);
}

async function writeMappedDifference(
  fixture,
  sourceRelative,
  targetRelative,
  { sourceContents = "source fixture\n", targetContents = "target fixture\n" } = {},
) {
  await writeFixtureSource(fixture, sourceRelative, sourceContents);
  const target = resolve(fixture.targetRoot, targetRelative);
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, targetContents);
}

describe("installer flow", () => {
  it("performs a zero-write dry-run", async () => {
    const fixture = await workspace("dry-run");
    const result = await run(fixture);
    expect(result.report.mode).toBe("dry-run");
    expect(await readdir(fixture.targetRoot)).toEqual([]);
    await expect(
      lstat(resolve(fixture.repoRoot, "dev_locals/workflow-tmp/install-foundation-kit/test-run")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("groups existing-project review items without changing classifications or target bytes", async () => {
    const fixture = await workspace("payload-groups-dry-run");
    const output = createOutput();
    const packageContents = `${JSON.stringify(
      {
        private: true,
        scripts: { "publish:changes": "node tools/project-publish.mjs" },
      },
      null,
      2,
    )}\n`;
    await writeFile(resolve(fixture.targetRoot, "package.json"), packageContents);
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "project agents\n");
    await mkdir(resolve(fixture.targetRoot, ".codex/project"), { recursive: true });
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project/project-guideline.md"),
      "project memory\n",
    );
    await writeMappedDifference(
      fixture,
      "rules/agent-operating-contract.md",
      ".codex/rules/agent-operating-contract.md",
    );
    await writeMappedDifference(
      fixture,
      "rules/docs-first-policy.md",
      ".codex/rules/docs-first-policy.md",
    );
    await writeMappedDifference(
      fixture,
      "rules/engineering-quality-principles.md",
      ".codex/rules/engineering-quality-principles.md",
    );
    await writeMappedDifference(
      fixture,
      "skills/core/publish-current-branch/SKILL.md",
      ".codex/skills/core/publish-current-branch/SKILL.md",
    );
    await writeMappedDifference(
      fixture,
      "scripts/publish-changes.mjs",
      ".codex/scripts/publish-changes.mjs",
    );
    await writeMappedDifference(
      fixture,
      "scripts/shared/command-runner.mjs",
      ".codex/scripts/shared/command-runner.mjs",
    );
    await writeMappedDifference(
      fixture,
      "config/publish-cli-theme.json",
      ".codex/config/publish-cli-theme.json",
    );
    await writeMappedDifference(
      fixture,
      "github-settings/example.json",
      ".codex/github-settings/example.json",
    );

    const targetPaths = [
      "AGENTS.md",
      "package.json",
      ".codex/project/project-guideline.md",
      ".codex/rules/agent-operating-contract.md",
      ".codex/rules/docs-first-policy.md",
      ".codex/rules/engineering-quality-principles.md",
      ".codex/skills/core/publish-current-branch/SKILL.md",
      ".codex/scripts/publish-changes.mjs",
      ".codex/scripts/shared/command-runner.mjs",
      ".codex/config/publish-cli-theme.json",
      ".codex/github-settings/example.json",
    ];
    const before = new Map(
      await Promise.all(
        targetPaths.map(async (target) => [
          target,
          await readFile(resolve(fixture.targetRoot, target), "utf8"),
        ]),
      ),
    );

    const result = await run(fixture, { output });
    for (const [reportField, planField] of [
      ["safeAddFiles", "safeAddFiles"],
      ["kitManagedReplaceFiles", "kitManagedReplaceFiles"],
      ["projectOwnedFiles", "projectOwnedFiles"],
      ["mixedAgentMergeFiles", "mixedAgentMergeFiles"],
      ["blockedManualFiles", "blockedManualFiles"],
      ["unchangedFiles", "unchangedFiles"],
    ]) {
      expect(result.report[reportField]).toBe(result.plan[planField]);
    }
    expect(
      result.report.payloadGroups.filter((group) => group.unresolvedCount).map((group) => group.id),
    ).toEqual([
      "project-templates",
      "common-workflow",
      "docs-writing-workflow",
      "code-workflow",
      "publish-package",
      "github-setup",
    ]);
    expect(
      result.report.payloadGroups.find((group) => group.id === "project-templates"),
    ).toMatchObject({
      unresolvedCount: 2,
      categoryCounts: { PROJECT_OWNED: 1, BLOCKED_MANUAL: 1 },
    });
    expect(
      result.report.payloadGroups.find((group) => group.id === "common-workflow"),
    ).toMatchObject({
      unresolvedCount: 1,
      entries: [
        expect.objectContaining({
          targetRelative: ".codex/rules/agent-operating-contract.md",
          resultCategory: "BLOCKED_MANUAL",
        }),
      ],
    });
    expect(
      result.report.payloadGroups.find((group) => group.id === "docs-writing-workflow"),
    ).toMatchObject({
      unresolvedCount: 1,
    });
    expect(result.report.payloadGroups.find((group) => group.id === "code-workflow")).toMatchObject(
      {
        unresolvedCount: 1,
      },
    );
    expect(
      result.report.payloadGroups.find((group) => group.id === "publish-package"),
    ).toMatchObject({
      unresolvedCount: 4,
      categoryCounts: { PROJECT_OWNED: 1, BLOCKED_MANUAL: 3 },
    });
    expect(result.report.payloadGroups.find((group) => group.id === "github-setup")).toMatchObject({
      unresolvedCount: 1,
    });
    expect(result.report.projectOwnedPreserved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetRelative: ".codex/config/publish-cli-theme.json",
          resultCategory: "PROJECT_OWNED",
        }),
        expect.objectContaining({
          targetRelative: ".codex/project/project-guideline.md",
          resultCategory: "PROJECT_OWNED",
        }),
      ]),
    );
    expect(output.messages).toContainEqual(["INFO", "Payload review groups:"]);
    expect(
      output.messages.some(
        ([level, message]) =>
          level === "INFO" &&
          message.startsWith("Docs / writing workflow: 1 unresolved review item(s)"),
      ),
    ).toBe(true);
    expect(output.messages).toContainEqual([
      "WARNING",
      "Review these publish workflow differences together. This grouping is report-only; it does not change replacement authorization, ownership, package alias behavior, or publishing behavior.",
    ]);
    expect(output.messages).toContainEqual([
      "INFO",
      "- [BLOCKED_MANUAL] .codex/scripts/publish-changes.mjs",
    ]);
    expect(output.messages).toContainEqual(["INFO", "Project-owned preserved differences: 2."]);
    expect(output.messages).toContainEqual(["INFO", "Existing conflict policy still applies."]);
    expect(output.messages).toContainEqual(["INFO", "No target files were changed."]);
    expect(output.messages).toContainEqual(["INFO", "Publish package aliases:"]);
    expect(
      output.messages.some(
        ([level, message]) =>
          level === "SUCCESS" &&
          message ===
            `Dry-run completed: ${result.plan.safeAddFiles} SAFE_ADD, ` +
              `${result.plan.kitManagedReplaceFiles} KIT_MANAGED_REPLACE, ` +
              `${result.plan.projectOwnedFiles} PROJECT_OWNED, ` +
              `${result.plan.mixedAgentMergeFiles} MIXED_AGENT_MERGE, ` +
              `${result.plan.blockedManualFiles} BLOCKED_MANUAL, ` +
              `${result.plan.unchangedFiles} unchanged, ${result.plan.total} total.`,
      ),
    ).toBe(true);

    for (const [target, contents] of before) {
      expect(await readFile(resolve(fixture.targetRoot, target), "utf8")).toBe(contents);
    }
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/foundation-kit/installation-manifest.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(lstat(resolve(fixture.targetRoot, ".codex/backups"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("reports the bootstrap subset and dependency guards as advisory-only dry-run output", async () => {
    const fixture = await workspace("bootstrap-payload-advisory");
    const output = createOutput();
    for (const [sourceRelative, targetRelative] of [
      ["rules/agent-operating-contract.md", ".codex/rules/agent-operating-contract.md"],
      ["rules/skill-and-output-efficiency.md", ".codex/rules/skill-and-output-efficiency.md"],
      ["rules/task-execution-classification.md", ".codex/rules/task-execution-classification.md"],
      ["skills/core/execute-plan/SKILL.md", ".codex/skills/core/execute-plan/SKILL.md"],
      ["skills/meta/plan-with-context/SKILL.md", ".codex/skills/meta/plan-with-context/SKILL.md"],
    ]) {
      await writeMappedDifference(fixture, sourceRelative, targetRelative);
    }
    await writeFixtureSource(fixture, "skills/meta/project-memory/SKILL.md");
    await writeMappedDifference(
      fixture,
      "skills/meta/grilling/SKILL.md",
      ".codex/skills/meta/grilling/SKILL.md",
    );

    const result = await run(fixture, { output });
    expect(result.report.bootstrapAdvisory).toEqual({
      detected: true,
      criticalTargets: BOOTSTRAP_CRITICAL_TARGETS,
      dependencyGuardTargets: BOOTSTRAP_DEPENDENCY_GUARD_TARGETS,
    });
    expect(output.messages).toContainEqual([
      "WARNING",
      "Bootstrap-critical workflow differences detected: 5.",
    ]);
    for (const target of BOOTSTRAP_CRITICAL_TARGETS) {
      expect(output.messages).toContainEqual(["INFO", `- ${target}`]);
      expect(await readFile(resolve(fixture.targetRoot, target), "utf8")).toBe("target fixture\n");
    }
    expect(output.messages).toContainEqual([
      "WARNING",
      "Bootstrap dependency guards missing or different: 2.",
    ]);
    expect(output.messages).toContainEqual([
      "INFO",
      "Review/adopt this bootstrap slice before relying on target-repository installed workflow authority.",
    ]);
    expect(output.messages).toContainEqual([
      "INFO",
      "Use current source-kit planning/execution authority for that review.",
    ]);
    expect(output.messages).toContainEqual([
      "INFO",
      "This is advisory only. No replacement is authorized.",
    ]);
    expect(output.messages).toContainEqual(["INFO", "Existing conflict policy still applies."]);
    expect(output.messages).toContainEqual(["INFO", "No target files were changed."]);
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/skills/meta/project-memory/SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("applies a fresh install, preserves executable mode, and omits source-only files", async () => {
    const fixture = await workspace("fresh-apply");
    await writeFile(resolve(fixture.targetRoot, "package.json"), '{"private":true}\n');
    const result = await run(fixture, { options: { apply: true } });

    expect(result.report.mode).toBe("apply");
    expect(result.report).toMatchObject({
      requestedProjectMode: "auto",
      effectiveProjectMode: "existing",
      detectedSignals: ["package.json"],
      conflictPolicy: "no-conflicts",
    });
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "agent instructions\n",
    );
    expect(
      await readFile(
        resolve(fixture.targetRoot, ".codex/skills/meta/meta-example/SKILL.md"),
        "utf8",
      ),
    ).toBe("meta skill\n");
    expect(
      await readFile(
        resolve(fixture.targetRoot, ".codex/skills/core/core-example/SKILL.md"),
        "utf8",
      ),
    ).toBe("core skill\n");
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/skills/optional-example/SKILL.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      (await lstat(resolve(fixture.targetRoot, ".codex/scripts/publish-changes.mjs"))).mode & 0o111,
    ).not.toBe(0);
    expect(JSON.parse(await readFile(resolve(fixture.targetRoot, "package.json"), "utf8"))).toEqual(
      { private: true, scripts: PUBLISH_PACKAGE_ALIASES },
    );
    await expect(
      lstat(resolve(fixture.targetRoot, "scripts/install-foundation-kit.mjs")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/scripts/publish-changes.sh")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/scripts/shared/command-runner.mjs")),
    ).resolves.toBeTruthy();
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/scripts/shared/git-client.mjs")),
    ).resolves.toBeTruthy();
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/scripts/lib/workflow-common.sh")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(lstat(resolve(fixture.targetRoot, "archive"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("does not create a missing package.json and reports the skipped aliases", async () => {
    const fixture = await workspace("aliases-missing-package");
    const output = createOutput();
    const result = await run(fixture, { options: { apply: true }, output });

    await expect(lstat(resolve(fixture.targetRoot, "package.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(result.report.publishAliases).toMatchObject({
      status: "skipped",
      skippedReason: "package-json-missing",
      applied: false,
      rawFallbackCommand: "node .codex/scripts/publish-changes.mjs",
    });
    expect(output.messages).toContainEqual([
      "SKIPPED",
      "Publish aliases not installed: package.json is missing.",
    ]);
  });

  it("does not repair invalid package.json and reports the skipped aliases", async () => {
    const fixture = await workspace("aliases-invalid-package");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    const invalid = '{"private":true';
    await writeFile(packagePath, invalid);
    const result = await run(fixture, { options: { apply: true } });

    expect(await readFile(packagePath, "utf8")).toBe(invalid);
    expect(result.report.publishAliases).toMatchObject({
      status: "skipped",
      skippedReason: "package-json-invalid",
      applied: false,
    });
  });

  it.each([
    ["non-object root", "[]\n", "package-json-non-object"],
    ["non-object scripts", '{"private":true,"scripts":[]}\n', "package-json-scripts-non-object"],
  ])("preserves package.json with %s", async (_label, contents, skippedReason) => {
    const fixture = await workspace(`aliases-${skippedReason}`);
    const packagePath = resolve(fixture.targetRoot, "package.json");
    await writeFile(packagePath, contents);
    const result = await run(fixture, { options: { apply: true } });

    expect(await readFile(packagePath, "utf8")).toBe(contents);
    expect(result.report.publishAliases).toMatchObject({
      status: "skipped",
      skippedReason,
      applied: false,
    });
  });

  it("creates scripts, preserves formatting convention, backs up package.json, and excludes it from the installation manifest", async () => {
    const fixture = await workspace("aliases-create-scripts");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    const original = '{\n\t"name": "fixture",\n\t"private": true\n}\n';
    await writeFile(packagePath, original);
    const originalSha256 = await hashFile(packagePath);
    const result = await run(fixture, { options: { apply: true } });

    const installedContents = await readFile(packagePath, "utf8");
    expect(installedContents).toContain('\n\t"scripts": {');
    expect(installedContents.endsWith("\n")).toBe(true);
    expect(JSON.parse(installedContents)).toEqual({
      name: "fixture",
      private: true,
      scripts: PUBLISH_PACKAGE_ALIASES,
    });
    expect(result.report.publishAliases).toMatchObject({
      status: "ready",
      added: Object.keys(PUBLISH_PACKAGE_ALIASES),
      applied: true,
    });

    const backupRoot = resolve(fixture.targetRoot, result.report.backupRelative);
    expect(await readFile(resolve(backupRoot, "package.json"), "utf8")).toBe(original);
    const backupManifest = JSON.parse(await readFile(resolve(backupRoot, "manifest.json"), "utf8"));
    expect(backupManifest.supplementalEntries).toEqual([
      expect.objectContaining({ target: "package.json", originalSha256 }),
    ]);
    expect(backupManifest.completedSupplementalTargets).toEqual(["package.json"]);

    const installationManifest = JSON.parse(
      await readFile(
        resolve(fixture.targetRoot, ".codex/foundation-kit/installation-manifest.json"),
        "utf8",
      ),
    );
    expect(installationManifest.files["package.json"]).toBeUndefined();
  });

  it("adds only missing aliases while preserving unrelated scripts", async () => {
    const fixture = await workspace("aliases-missing-only");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    await writeFile(
      packagePath,
      `${JSON.stringify({ private: true, scripts: { test: "vitest" } }, null, 2)}\n`,
    );
    await run(fixture, { options: { apply: true } });

    const installed = JSON.parse(await readFile(packagePath, "utf8"));
    expect(installed.scripts).toEqual({ test: "vitest", ...PUBLISH_PACKAGE_ALIASES });
  });

  it("does not write package.json when every alias is already current", async () => {
    const fixture = await workspace("aliases-current");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    await writeFile(
      packagePath,
      `${JSON.stringify({ private: true, scripts: PUBLISH_PACKAGE_ALIASES }, null, 2)}\n`,
    );
    const before = await lstat(packagePath);
    const original = await readFile(packagePath, "utf8");
    const result = await run(fixture, { options: { apply: true } });
    const after = await lstat(packagePath);

    expect(await readFile(packagePath, "utf8")).toBe(original);
    expect(after.ino).toBe(before.ino);
    expect(result.report.publishAliases).toMatchObject({
      status: "no-changes",
      added: [],
      alreadyCurrent: Object.keys(PUBLISH_PACKAGE_ALIASES),
      applied: false,
    });
  });

  it("does not write package.json when conflicts exist but no safe aliases are missing", async () => {
    const fixture = await workspace("aliases-conflicts-only");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    const scripts = {
      ...PUBLISH_PACKAGE_ALIASES,
      "publish:merge-pr:auto": "node scripts/custom-publish.js --auto",
    };
    await writeFile(packagePath, `${JSON.stringify({ private: true, scripts }, null, 2)}\n`);
    const before = await lstat(packagePath);
    const original = await readFile(packagePath, "utf8");
    const result = await run(fixture, { options: { apply: true } });
    const after = await lstat(packagePath);

    expect(await readFile(packagePath, "utf8")).toBe(original);
    expect(after.ino).toBe(before.ino);
    expect(result.report.publishAliases).toMatchObject({
      status: "no-changes",
      added: [],
      skippedConflicts: ["publish:merge-pr:auto"],
      applied: false,
    });
  });

  it("reports conflicts in dry-run and apply, preserves them, and adds other missing aliases", async () => {
    const fixture = await workspace("aliases-conflict");
    const output = createOutput();
    const packagePath = resolve(fixture.targetRoot, "package.json");
    const custom = "node scripts/custom-publish.js";
    const original = `${JSON.stringify({ private: true, scripts: { "publish:changes": custom } }, null, 2)}\n`;
    await writeFile(packagePath, original);

    const dryRun = await run(fixture, { output });
    expect(await readFile(packagePath, "utf8")).toBe(original);
    expect(dryRun.report.publishAliases).toMatchObject({
      added: ["publish:pr-only", "publish:merge-pr", "publish:merge-pr:auto"],
      skippedConflicts: ["publish:changes"],
      applied: false,
    });
    expect(output.messages).toContainEqual([
      "WARNING",
      "Skipped conflicting alias: publish:changes",
    ]);
    expect(output.messages).toContainEqual(["INFO", `Existing value: ${custom}`]);

    const applied = await run(fixture, { options: { apply: true }, output: createOutput() });
    const installed = JSON.parse(await readFile(packagePath, "utf8"));
    expect(installed.scripts["publish:changes"]).toBe(custom);
    for (const name of ["publish:pr-only", "publish:merge-pr", "publish:merge-pr:auto"]) {
      expect(installed.scripts[name]).toBe(PUBLISH_PACKAGE_ALIASES[name]);
    }
    expect(applied.report.publishAliases.applied).toBe(true);
  });

  it("detects package.json drift before package or mapped writes", async () => {
    const fixture = await workspace("aliases-drift");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    await writeFile(packagePath, '{"private":true}\n');

    await expect(
      run(fixture, {
        options: { apply: true },
        hooks: {
          afterBackupPrepared: async () => {
            await writeFile(packagePath, '{"private":true,"late":true}\n');
          },
        },
      }),
    ).rejects.toMatchObject({ type: "PLAN_DRIFT" });
    expect(await readFile(packagePath, "utf8")).toBe('{"private":true,"late":true}\n');
    await expect(lstat(resolve(fixture.targetRoot, "AGENTS.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("revalidates package.json immediately before the alias write", async () => {
    const fixture = await workspace("aliases-late-drift");
    const packagePath = resolve(fixture.targetRoot, "package.json");
    await writeFile(packagePath, '{"private":true}\n');

    await expect(
      run(fixture, {
        options: { apply: true },
        hooks: {
          beforePublishAliasesApply: async () => {
            await writeFile(packagePath, '{"private":true,"late":true}\n');
          },
        },
      }),
    ).rejects.toMatchObject({ type: "PLAN_DRIFT" });
    expect(await readFile(packagePath, "utf8")).toBe('{"private":true,"late":true}\n');
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "agent instructions\n",
    );
    const backupManifest = JSON.parse(
      await readFile(
        resolve(fixture.targetRoot, ".codex/backups/install-20260615-123456/manifest.json"),
        "utf8",
      ),
    );
    expect(backupManifest).toMatchObject({
      status: "failed",
      completedSupplementalTargets: [],
    });
  });

  it("safe apply writes only new files and preserves every existing byte", async () => {
    const fixture = await workspace("safe-apply");
    const output = createOutput();
    await mkdir(resolve(fixture.targetRoot, ".codex/project"), { recursive: true });
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "local agents\n");
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project/project-guideline.md"),
      "local memory\n",
    );

    const result = await run(fixture, {
      options: { apply: true, skipConflicts: true },
      output,
      prompts: {
        confirmBackup: async () => {
          throw new Error("safe apply must not prompt");
        },
      },
    });

    expect(result.report).toMatchObject({
      mode: "apply",
      conflictPolicy: "safe-new-files-only",
      backupRelative: "",
      preservedFiles: 1,
      mergeFiles: 1,
    });
    expect(
      result.report.payloadGroups.find((group) => group.id === "project-templates"),
    ).toMatchObject({
      unresolvedCount: 2,
      entries: [
        expect.objectContaining({ targetRelative: ".codex/project/project-guideline.md" }),
        expect.objectContaining({ targetRelative: "AGENTS.md" }),
      ],
    });
    expect(result.report.projectOwnedPreserved).toEqual([
      expect.objectContaining({ targetRelative: ".codex/project/project-guideline.md" }),
    ]);
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe("local agents\n");
    expect(
      await readFile(resolve(fixture.targetRoot, ".codex/project/project-guideline.md"), "utf8"),
    ).toBe("local memory\n");
    expect(
      await readFile(
        resolve(fixture.targetRoot, ".codex/skills/core/core-example/SKILL.md"),
        "utf8",
      ),
    ).toBe("core skill\n");
    await expect(lstat(resolve(fixture.targetRoot, ".codex/backups"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(output.messages).toContainEqual([
      "WARNING",
      "Partial adoption: authorized files were installed; unresolved differences and migration items were preserved for review.",
    ]);
  });

  it("safe apply preserves differing workflow scripts and reports merge review", async () => {
    const fixture = await workspace("safe-workflow-script");
    const output = createOutput();
    const script = resolve(fixture.targetRoot, ".codex/scripts/publish-changes.mjs");
    await mkdir(resolve(script, ".."), { recursive: true });
    await writeFile(script, "project-specific publish workflow\n");

    const result = await run(fixture, {
      options: { apply: true, skipConflicts: true },
      output,
      prompts: {
        confirmBackup: async () => {
          throw new Error("safe apply must not prompt");
        },
      },
    });

    expect(result.report).toMatchObject({
      conflictPolicy: "safe-new-files-only",
      backupRelative: "",
      scriptMergeFiles: 1,
    });
    expect(await readFile(script, "utf8")).toBe("project-specific publish workflow\n");
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/scripts/shared/command-runner.mjs")),
    ).resolves.toBeTruthy();
    await expect(lstat(resolve(fixture.targetRoot, ".codex/backups"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(output.messages).toContainEqual([
      "WARNING",
      expect.stringContaining("[BLOCKED_MANUAL] [SCRIPT-MERGE] .codex/scripts/publish-changes.mjs"),
    ]);
    expect(
      output.messages.some(
        ([level, message]) => level === "SUCCESS" && message.includes("1 BLOCKED_MANUAL"),
      ),
    ).toBe(true);
  });

  it("safe apply skips identical files without classifying them as danger", async () => {
    const fixture = await workspace("safe-identical");
    const output = createOutput();
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "agent instructions\n");
    const result = await run(fixture, {
      options: { apply: true, skipConflicts: true },
      output,
    });

    expect(result.report.identicalFiles).toBe(1);
    expect(result.report.conflicts).toBe(0);
    expect(output.messages.some(([level]) => level === "DANGER")).toBe(false);
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "agent instructions\n",
    );
  });

  it("installs selected optional skills only under engineering", async () => {
    const fixture = await workspace("optional-apply");
    const result = await run(fixture, {
      options: {
        apply: true,
        skipConflicts: true,
        includeOptional: ["optional-example"],
      },
    });

    expect(result.report.selectedOptionalSkills).toEqual(["optional-example"]);
    expect(
      await readFile(
        resolve(fixture.targetRoot, ".codex/skills/engineering/optional-example/SKILL.md"),
        "utf8",
      ),
    ).toBe("optional skill\n");
    for (const forbidden of [
      ".codex/skills/optional/optional-example/SKILL.md",
      ".codex/skills/project/optional-example/SKILL.md",
      ".codex/skills/optional-example/SKILL.md",
    ]) {
      await expect(lstat(resolve(fixture.targetRoot, forbidden))).rejects.toMatchObject({
        code: "ENOENT",
      });
    }
  });

  it("safe apply preserves a differing selected optional skill", async () => {
    const fixture = await workspace("optional-preserve");
    const target = resolve(
      fixture.targetRoot,
      ".codex/skills/engineering/optional-example/SKILL.md",
    );
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, "local optional skill\n");

    const result = await run(fixture, {
      options: {
        apply: true,
        skipConflicts: true,
        includeOptional: ["optional-example"],
      },
    });

    expect(result.report.differentFiles).toBeGreaterThan(0);
    expect(await readFile(target, "utf8")).toBe("local optional skill\n");
  });

  it("replaces only the two allowlisted React optional files with verified backup evidence", async () => {
    const fixture = await workspace("react-managed-replace");
    const selected = ["optional-example", "react-component-patterns"];
    await run(fixture, {
      options: { apply: true, projectMode: "new", includeOptional: selected },
    });

    const reactSkillRelative = ".codex/skills/engineering/react-component-patterns/SKILL.md";
    const reactMetadataRelative = ".codex/skills/engineering/react-component-patterns/metadata.yml";
    const otherRelative = ".codex/skills/engineering/optional-example/SKILL.md";
    const reactSkill = resolve(fixture.targetRoot, reactSkillRelative);
    const reactMetadata = resolve(fixture.targetRoot, reactMetadataRelative);
    const other = resolve(fixture.targetRoot, otherRelative);
    const originalReactSkill = await readFile(reactSkill, "utf8");
    const originalReactMetadata = await readFile(reactMetadata, "utf8");
    const originalOther = await readFile(other, "utf8");
    const preservedMappings = [
      ["project-templates/AGENTS.md", "AGENTS.md", "updated agents\n"],
      [
        "project-templates/project-guideline.md",
        ".codex/project/project-guideline.md",
        "updated project memory\n",
      ],
      ["rules/example.md", ".codex/rules/example.md", "updated rule\n"],
      ["prompts/example.md", ".codex/prompts/example.md", "updated prompt\n"],
      [
        "skills/core/core-example/SKILL.md",
        ".codex/skills/core/core-example/SKILL.md",
        "updated core\n",
      ],
      [
        "skills/meta/meta-example/SKILL.md",
        ".codex/skills/meta/meta-example/SKILL.md",
        "updated meta\n",
      ],
      ["scripts/publish-changes.mjs", ".codex/scripts/publish-changes.mjs", "updated script\n"],
      ["config/example.json", ".codex/config/example.json", '{"updated":true}\n'],
      [
        "config/publish-changes-policy.yml",
        ".codex/config/publish-changes-policy.yml",
        "updateTypes:\n  changed: true\n",
      ],
      [
        "config/publish-cli-theme.json",
        ".codex/config/publish-cli-theme.json",
        '{"levels":{"updated":true}}\n',
      ],
      ["github-settings/example.json", ".codex/github-settings/example.json", '{"updated":true}\n'],
    ];
    const preservedOriginals = new Map();
    for (const [sourceRelative, targetRelative, updated] of preservedMappings) {
      preservedOriginals.set(
        targetRelative,
        await readFile(resolve(fixture.targetRoot, targetRelative), "utf8"),
      );
      await writeFile(resolve(fixture.kitRoot, sourceRelative), updated);
    }

    await writeFile(
      resolve(fixture.kitRoot, "optional-skills/react-component-patterns/SKILL.md"),
      "updated react patterns\n",
    );
    await writeFile(
      resolve(fixture.kitRoot, "optional-skills/react-component-patterns/metadata.yml"),
      originalReactMetadata.replace("React fixture skill.", "Updated React fixture skill."),
    );
    await writeFile(
      resolve(fixture.kitRoot, "optional-skills/optional-example/SKILL.md"),
      "updated non-allowlisted optional skill\n",
    );

    let prompted = false;
    const result = await run(fixture, {
      options: {
        apply: true,
        projectMode: "existing",
        replaceKitManaged: true,
        includeOptional: selected,
      },
      prompts: {
        confirmBackup: async () => {
          prompted = true;
          return true;
        },
      },
    });

    expect(prompted).toBe(true);
    expect(await readFile(reactSkill, "utf8")).toBe("updated react patterns\n");
    expect(await readFile(reactMetadata, "utf8")).toContain("Updated React fixture skill.");
    expect(await readFile(other, "utf8")).toBe(originalOther);
    for (const [, targetRelative] of preservedMappings) {
      expect(await readFile(resolve(fixture.targetRoot, targetRelative), "utf8")).toBe(
        preservedOriginals.get(targetRelative),
      );
    }
    expect(result.report).toMatchObject({
      authorizedManagedReplaceFiles: 2,
      completedManagedReplaceFiles: 2,
      unresolvedReviewItems: expect.any(Number),
    });

    const backupRoot = resolve(fixture.targetRoot, result.report.backupRelative);
    expect(await readFile(resolve(backupRoot, reactSkillRelative), "utf8")).toBe(
      originalReactSkill,
    );
    expect(await readFile(resolve(backupRoot, reactMetadataRelative), "utf8")).toBe(
      originalReactMetadata,
    );
    await expect(readFile(resolve(backupRoot, otherRelative), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });

    const backupManifest = JSON.parse(await readFile(resolve(backupRoot, "manifest.json"), "utf8"));
    expect(backupManifest.entries.map((entry) => entry.target).sort()).toEqual(
      [reactMetadataRelative, reactSkillRelative].sort(),
    );
    expect(backupManifest.status).toBe("completed");
    expect(await hashFile(resolve(backupRoot, reactSkillRelative))).toBe(
      backupManifest.entries.find((entry) => entry.target === reactSkillRelative).originalSha256,
    );

    const installationManifest = JSON.parse(
      await readFile(
        resolve(fixture.targetRoot, ".codex/foundation-kit/installation-manifest.json"),
        "utf8",
      ),
    );
    expect(installationManifest.files[reactSkillRelative].baselineSha256).toBe(
      await hashFile(reactSkill),
    );
    expect(installationManifest.files[reactMetadataRelative].baselineSha256).toBe(
      await hashFile(reactMetadata),
    );
    expect(installationManifest.files[otherRelative].baselineSha256).toBe(await hashFile(other));
  });

  it("replaces neither React file when only one package file is eligible", async () => {
    const fixture = await workspace("react-managed-mixed");
    const selected = ["react-component-patterns"];
    await run(fixture, {
      options: { apply: true, projectMode: "new", includeOptional: selected },
    });

    const skill = resolve(
      fixture.targetRoot,
      ".codex/skills/engineering/react-component-patterns/SKILL.md",
    );
    const metadata = resolve(
      fixture.targetRoot,
      ".codex/skills/engineering/react-component-patterns/metadata.yml",
    );
    const metadataSource = resolve(
      fixture.kitRoot,
      "optional-skills/react-component-patterns/metadata.yml",
    );
    await writeFile(skill, "local React patterns\n");
    const localSkill = await readFile(skill, "utf8");
    const originalMetadata = await readFile(metadata, "utf8");
    const manifestPath = resolve(
      fixture.targetRoot,
      ".codex/foundation-kit/installation-manifest.json",
    );
    const originalManifest = await readFile(manifestPath, "utf8");
    await writeFile(
      resolve(fixture.kitRoot, "optional-skills/react-component-patterns/SKILL.md"),
      "upstream React patterns\n",
    );
    await writeFile(
      metadataSource,
      (await readFile(metadataSource, "utf8")).replace(
        "React fixture skill.",
        "Updated React fixture skill.",
      ),
    );

    const output = createOutput();
    let prompted = false;
    const result = await run(fixture, {
      options: {
        apply: true,
        projectMode: "existing",
        replaceKitManaged: true,
        includeOptional: selected,
      },
      output,
      prompts: {
        confirmBackup: async () => {
          prompted = true;
          return true;
        },
      },
    });

    expect(prompted).toBe(false);
    expect(await readFile(skill, "utf8")).toBe(localSkill);
    expect(await readFile(metadata, "utf8")).toBe(originalMetadata);
    expect(await readFile(manifestPath, "utf8")).toBe(originalManifest);
    expect(result.report).toMatchObject({
      managedReplacementPackageEligible: false,
      authorizedManagedReplaceFiles: 0,
      completedManagedReplaceFiles: 0,
    });
    expect(output.messages).toContainEqual([
      "WARNING",
      "React canary package not eligible: both package files must be eligible KIT_MANAGED_REPLACE entries; neither package file will be replaced.",
    ]);
  });

  it("restores both React files and preserves the manifest after partial replacement failure", async () => {
    const fixture = await workspace("react-managed-partial");
    const selected = ["react-component-patterns"];
    await run(fixture, {
      options: { apply: true, projectMode: "new", includeOptional: selected },
    });
    const manifestPath = resolve(
      fixture.targetRoot,
      ".codex/foundation-kit/installation-manifest.json",
    );
    const skillRelative = ".codex/skills/engineering/react-component-patterns/SKILL.md";
    const metadataRelative = ".codex/skills/engineering/react-component-patterns/metadata.yml";
    const originalSkill = await readFile(resolve(fixture.targetRoot, skillRelative), "utf8");
    const originalMetadata = await readFile(resolve(fixture.targetRoot, metadataRelative), "utf8");
    const originalManifest = await readFile(manifestPath, "utf8");
    await writeFile(
      resolve(fixture.kitRoot, "optional-skills/react-component-patterns/SKILL.md"),
      "updated React patterns\n",
    );
    const metadataSource = resolve(
      fixture.kitRoot,
      "optional-skills/react-component-patterns/metadata.yml",
    );
    await writeFile(
      metadataSource,
      (await readFile(metadataSource, "utf8")).replace(
        "React fixture skill.",
        "Updated React fixture skill.",
      ),
    );

    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          replaceKitManaged: true,
          includeOptional: selected,
        },
        hooks: {
          beforeCopy: async ({ completedTargets }) => {
            if (completedTargets.length === 1) {
              throw new Error("injected second replacement failure");
            }
          },
        },
      }),
    ).rejects.toThrow("injected second replacement failure");

    expect(await readFile(resolve(fixture.targetRoot, skillRelative), "utf8")).toBe(originalSkill);
    expect(await readFile(resolve(fixture.targetRoot, metadataRelative), "utf8")).toBe(
      originalMetadata,
    );
    expect(await readFile(manifestPath, "utf8")).toBe(originalManifest);
    const backupManifest = JSON.parse(
      await readFile(
        resolve(fixture.targetRoot, ".codex/backups/install-20260615-123456/manifest.json"),
        "utf8",
      ),
    );
    expect(backupManifest).toMatchObject({ status: "rolled-back", completedTargets: [] });
  });

  it("restores both React files and the prior manifest when manifest persistence fails", async () => {
    const fixture = await workspace("react-managed-manifest-failure");
    const selected = ["react-component-patterns"];
    await run(fixture, {
      options: { apply: true, projectMode: "new", includeOptional: selected },
    });
    const skillRelative = ".codex/skills/engineering/react-component-patterns/SKILL.md";
    const metadataRelative = ".codex/skills/engineering/react-component-patterns/metadata.yml";
    const skill = resolve(fixture.targetRoot, skillRelative);
    const metadata = resolve(fixture.targetRoot, metadataRelative);
    const manifest = resolve(
      fixture.targetRoot,
      ".codex/foundation-kit/installation-manifest.json",
    );
    const originalSkill = await readFile(skill, "utf8");
    const originalMetadata = await readFile(metadata, "utf8");
    const originalManifest = await readFile(manifest, "utf8");
    await writeFile(
      resolve(fixture.kitRoot, "optional-skills/react-component-patterns/SKILL.md"),
      "updated React patterns\n",
    );
    const metadataSource = resolve(
      fixture.kitRoot,
      "optional-skills/react-component-patterns/metadata.yml",
    );
    await writeFile(
      metadataSource,
      (await readFile(metadataSource, "utf8")).replace(
        "React fixture skill.",
        "Updated React fixture skill.",
      ),
    );

    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          replaceKitManaged: true,
          includeOptional: selected,
        },
        hooks: {
          beforeInstallationManifestWrite: async () => {
            throw new Error("injected manifest persistence failure");
          },
        },
      }),
    ).rejects.toThrow("injected manifest persistence failure");

    expect(await readFile(skill, "utf8")).toBe(originalSkill);
    expect(await readFile(metadata, "utf8")).toBe(originalMetadata);
    expect(await readFile(manifest, "utf8")).toBe(originalManifest);
    const backupManifest = JSON.parse(
      await readFile(
        resolve(fixture.targetRoot, ".codex/backups/install-20260615-123456/manifest.json"),
        "utf8",
      ),
    );
    expect(backupManifest).toMatchObject({ status: "rolled-back", completedTargets: [] });
  });

  it("safe apply leaves optional migration collisions for review", async () => {
    const fixture = await workspace("optional-migration-review");
    await mkdir(resolve(fixture.targetRoot, ".codex/skills/meta/optional-example"), {
      recursive: true,
    });
    const result = await run(fixture, {
      options: {
        apply: true,
        skipConflicts: true,
        includeOptional: ["optional-example"],
      },
    });

    expect(result.report.migrationReviews).toBe(2);
    await expect(
      lstat(resolve(fixture.targetRoot, ".codex/skills/engineering/optional-example")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("safe apply cannot overwrite a target created after revalidation", async () => {
    const fixture = await workspace("safe-race");
    let lateTarget = "";
    await expect(
      run(fixture, {
        options: { apply: true, skipConflicts: true },
        hooks: {
          beforeCopy: async ({ entry, completedTargets }) => {
            if (completedTargets.length > 0) return;
            lateTarget = resolve(fixture.targetRoot, entry.targetRelative);
            await mkdir(resolve(lateTarget, ".."), { recursive: true });
            await writeFile(lateTarget, "created during apply\n");
          },
        },
      }),
    ).rejects.toMatchObject({ type: "TARGET_ALREADY_EXISTS" });
    expect(await readFile(lateTarget, "utf8")).toBe("created during apply\n");
  });

  it("blocks existing-project replacement before prompting, staging, or target writes", async () => {
    const fixture = await workspace("cancel-conflict");
    const output = createOutput();
    let prompted = false;
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          overwriteConflicts: true,
        },
        prompts: {
          confirmBackup: async () => {
            prompted = true;
          },
        },
        output,
        runId: "not-created",
      }),
    ).rejects.toMatchObject({ type: "EXISTING_PROJECT_REPLACEMENT_BLOCKED" });
    expect(prompted).toBe(false);
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
    await expect(
      lstat(
        resolve(fixture.repoRoot, "dev_locals/workflow-tmp/install-foundation-kit/not-created"),
      ),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(output.messages).toContainEqual([
      "DANGER",
      "Install blocked: broad existing-project replacement is not allowed; only exact eligible React canary files can use --replace-kit-managed.",
    ]);
  });

  it("blocks existing-like conflicts before prompting, staging, backup, or target writes", async () => {
    const fixture = await workspace("existing-blocked");
    const output = createOutput();
    let prompted = false;
    let staged = false;
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");

    let error;
    try {
      await run(fixture, {
        options: { apply: true, projectMode: "existing" },
        output,
        prompts: {
          confirmBackup: async () => {
            prompted = true;
          },
        },
        runId: "must-not-stage",
        hooks: {
          afterStaging: async () => {
            staged = true;
          },
        },
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ type: "CONFLICT_REVIEW_REQUIRED" });
    expect(prompted).toBe(false);
    expect(staged).toBe(false);
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
    await expect(lstat(resolve(fixture.targetRoot, ".codex/backups"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      lstat(
        resolve(fixture.repoRoot, "dev_locals/workflow-tmp/install-foundation-kit/must-not-stage"),
      ),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(output.messages).toContainEqual(["INFO", "Conflict policy: manual-review-required"]);
    expect(output.messages).toContainEqual([
      "DANGER",
      "Install blocked: existing-project differences include mixed or manual-risk entries that require manual review; no existing target files were replaced.",
    ]);
  });

  it("does not treat --show-diff as existing-project overwrite authorization", async () => {
    const fixture = await workspace("show-diff-blocked");
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    await expect(
      run(fixture, {
        options: { apply: true, projectMode: "existing", showDiff: true },
      }),
    ).rejects.toMatchObject({ type: "CONFLICT_REVIEW_REQUIRED" });
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
  });

  it("does not let explicit overwrite bypass existing-project classification", async () => {
    const fixture = await workspace("existing-overwrite");
    const output = createOutput();
    let prompted = false;
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    const script = resolve(fixture.targetRoot, ".codex/scripts/publish-changes.mjs");
    await mkdir(resolve(script, ".."), { recursive: true });
    await writeFile(script, "project-specific publish workflow\n");
    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          overwriteConflicts: true,
        },
        output,
        prompts: {
          confirmBackup: async () => {
            prompted = true;
          },
        },
      }),
    ).rejects.toMatchObject({ type: "EXISTING_PROJECT_REPLACEMENT_BLOCKED" });

    expect(prompted).toBe(false);
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
    expect(await readFile(script, "utf8")).toBe("project-specific publish workflow\n");
    await expect(lstat(resolve(fixture.targetRoot, ".codex/backups"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("reports auto resolution and review choices during a zero-write conflict dry-run", async () => {
    const fixture = await workspace("auto-dry-run");
    const output = createOutput();
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    const result = await run(fixture, { output });

    expect(result.report).toMatchObject({
      mode: "dry-run",
      requestedProjectMode: "auto",
      effectiveProjectMode: "existing",
      detectedSignals: ["AGENTS.md"],
      conflictPolicy: "manual-review-required",
    });
    expect(await readdir(fixture.targetRoot)).toEqual(["AGENTS.md"]);
    expect(output.messages).toContainEqual([
      "WARNING",
      "Use --project-mode new only when you intentionally want the new-project overwrite workflow.",
    ]);
  });

  it("prepares and verifies backups before replacing conflicts", async () => {
    const fixture = await workspace("backup");
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    const result = await run(fixture, {
      options: { apply: true, projectMode: "new" },
    });
    expect(
      result.report.payloadGroups.find((group) => group.id === "project-templates"),
    ).toMatchObject({
      unresolvedCount: 0,
      entries: [],
    });
    expect(result.report.backupRelative).toBe(".codex/backups/install-20260615-123456");
    const backupRoot = resolve(fixture.targetRoot, result.report.backupRelative);
    expect(await readFile(resolve(backupRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
    const manifest = JSON.parse(await readFile(resolve(backupRoot, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({
      version: 1,
      status: "completed",
      completedTargets: expect.arrayContaining(["AGENTS.md"]),
    });
    expect(JSON.stringify(manifest)).not.toContain(fixture.root);
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "agent instructions\n",
    );
  });

  it("leaves mapped target paths untouched when staging or backup preparation fails", async () => {
    const staging = await workspace("staging-failure");
    await expect(
      run(staging, {
        options: { apply: true, projectMode: "new" },
        hooks: {
          afterStaging: async () => {
            throw new Error("injected staging failure");
          },
        },
      }),
    ).rejects.toThrow("injected staging failure");
    expect(await readdir(staging.targetRoot)).toEqual([]);

    const backup = await workspace("backup-failure");
    await writeFile(resolve(backup.targetRoot, "AGENTS.md"), "existing\n");
    await expect(
      run(backup, {
        options: { apply: true, projectMode: "new" },
        hooks: {
          afterBackupPrepared: async () => {
            throw new Error("injected backup failure");
          },
        },
      }),
    ).rejects.toThrow("injected backup failure");
    expect(await readFile(resolve(backup.targetRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
    await expect(lstat(resolve(backup.targetRoot, ".codex/backups"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("aborts before downstream writes when target or source drifts after staging", async () => {
    const targetDrift = await workspace("target-drift");
    await expect(
      run(targetDrift, {
        options: { apply: true, projectMode: "new" },
        hooks: {
          afterStaging: async ({ roots }) => {
            await writeFile(resolve(roots.targetRoot, "AGENTS.md"), "late target change\n");
          },
        },
      }),
    ).rejects.toThrow("Source, target, policy, or installation manifest changed");
    expect(await readFile(resolve(targetDrift.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "late target change\n",
    );
    await expect(
      lstat(resolve(targetDrift.targetRoot, ".codex/project/project-guideline.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });

    const sourceDrift = await workspace("source-drift");
    await expect(
      run(sourceDrift, {
        options: { apply: true, projectMode: "new" },
        hooks: {
          afterStaging: async ({ roots }) => {
            await writeFile(
              resolve(roots.kitRoot, "project-templates/AGENTS.md"),
              "late source change\n",
            );
          },
        },
      }),
    ).rejects.toThrow("Source, target, policy, or installation manifest changed");
    expect(await readdir(sourceDrift.targetRoot)).toEqual([]);
  });

  it("revalidates after backup materialization before mapped writes", async () => {
    const fixture = await workspace("post-backup-drift");
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "new",
        },
        hooks: {
          afterBackupMaterialized: async ({ roots }) => {
            await writeFile(resolve(roots.targetRoot, "AGENTS.md"), "changed after backup\n");
          },
        },
      }),
    ).rejects.toThrow("Source, target, policy, or installation manifest changed");
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "changed after backup\n",
    );
    expect((await readdir(resolve(fixture.targetRoot, ".codex/backups"))).length).toBe(1);
  });

  it("records partial progress and preserves the complete backup on copy failure", async () => {
    const fixture = await workspace("partial");
    const output = createOutput();
    await mkdir(resolve(fixture.targetRoot, ".codex/project"), { recursive: true });
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing agents\n");
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project/project-guideline.md"),
      "existing guideline\n",
    );
    await expect(
      run(fixture, {
        options: { apply: true, projectMode: "new" },
        output,
        hooks: {
          beforeCopy: async ({ completedTargets }) => {
            if (completedTargets.length === 1) throw new Error("injected copy failure");
          },
        },
      }),
    ).rejects.toThrow("injected copy failure");

    const [backupName] = await readdir(resolve(fixture.targetRoot, ".codex/backups"));
    const backupRoot = resolve(fixture.targetRoot, ".codex/backups", backupName);
    expect(await readFile(resolve(backupRoot, "AGENTS.md"), "utf8")).toBe("existing agents\n");
    expect(await readFile(resolve(backupRoot, ".codex/project/project-guideline.md"), "utf8")).toBe(
      "existing guideline\n",
    );
    const manifest = JSON.parse(await readFile(resolve(backupRoot, "manifest.json"), "utf8"));
    expect(manifest.status).toBe("failed");
    expect(manifest.completedTargets).toHaveLength(1);
    expect(output.messages).toContainEqual([
      "DANGER",
      "Partial apply: 1 mapped file(s) completed before failure.",
    ]);
    expect(output.messages).toContainEqual([
      "INFO",
      "Prepared backup retained at: .codex/backups/install-20260615-123456",
    ]);
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/foundation-kit/installation-manifest.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("treats missing diff as a non-blocking preview warning", async () => {
    const fixture = await workspace("missing-diff");
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    const output = createOutput();
    const result = await run(fixture, {
      options: { showDiff: true },
      output,
      commandRunner: commandRunner({
        ok: false,
        exitCode: null,
        stdout: "",
        stderr: "spawn diff ENOENT",
      }),
    });
    expect(result.report.mode).toBe("dry-run");
    expect(output.messages).toContainEqual([
      "WARNING",
      "diff -u preview unavailable for AGENTS.md; continuing without preview.",
    ]);
  });
});
