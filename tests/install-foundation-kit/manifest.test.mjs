import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runInstallerFlow } from "../../scripts/install-foundation-kit/flow.mjs";
import { hashFile } from "../../scripts/install-foundation-kit/fs-safe.mjs";
import {
  INSTALLATION_MANIFEST_RELATIVE,
  manifestPayloadSha256,
  validateInstallationManifest,
} from "../../scripts/install-foundation-kit/installation-manifest.mjs";
import { buildInstallPlan } from "../../scripts/install-foundation-kit/planner.mjs";
import { commandRunner, createOutput, createTestWorkspace } from "./helpers.mjs";

const fixtures = [];

async function workspace(name) {
  const fixture = await createTestWorkspace(name);
  fixtures.push(fixture);
  return fixture;
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => fixture.cleanup()));
});

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
    kitProfile: "",
    verbose: false,
    help: false,
    ...overrides,
  };
}

async function run(fixture, overrides = {}) {
  return runInstallerFlow({
    repoRoot: fixture.repoRoot,
    options: options(fixture.targetRoot, overrides.options),
    output: overrides.output ?? createOutput(),
    prompts: overrides.prompts ?? { confirmBackup: async () => true },
    commandRunner: overrides.commandRunner ?? commandRunner(),
    now: () => new Date("2026-06-21T12:34:56Z"),
    runId: overrides.runId ?? "manifest-test",
    hooks: overrides.hooks,
  });
}

async function readManifest(targetRoot) {
  return JSON.parse(await readFile(resolve(targetRoot, INSTALLATION_MANIFEST_RELATIVE), "utf8"));
}

async function writeManifest(targetRoot, manifest) {
  const path = resolve(targetRoot, INSTALLATION_MANIFEST_RELATIVE);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function installFresh(fixture) {
  return run(fixture, { options: { apply: true, projectMode: "new" } });
}

describe("installation manifest", () => {
  it("validates deterministic schema-v1 records", () => {
    const first = {
      "z/file.md": {
        source: "rules/z.md",
        ownership: "kit-managed",
        mode: "full-file",
        baselineSha256: "a".repeat(64),
      },
      "a/file.md": {
        source: "rules/a.md",
        ownership: "kit-managed",
        mode: "full-file",
        baselineSha256: "b".repeat(64),
      },
    };
    const second = Object.fromEntries(Object.entries(first).reverse());
    expect(manifestPayloadSha256(first)).toBe(manifestPayloadSha256(second));
    const result = validateInstallationManifest({
      schemaVersion: 1,
      payloadSha256: manifestPayloadSha256(first),
      files: first,
    });
    expect(result.status).toBe("valid");
    expect(Object.keys(result.manifest.files)).toEqual(["a/file.md", "z/file.md"]);
    expect(
      validateInstallationManifest({
        schemaVersion: 1,
        payloadSha256: manifestPayloadSha256({
          "../escape": {
            source: "rules/a.md",
            ownership: "kit-managed",
            mode: "full-file",
            baselineSha256: "a".repeat(64),
          },
        }),
        files: {
          "../escape": {
            source: "rules/a.md",
            ownership: "kit-managed",
            mode: "full-file",
            baselineSha256: "a".repeat(64),
          },
        },
      }).status,
    ).toBe("invalid");
  });

  it("creates a stable manifest after fresh apply without claiming project-owned seeds", async () => {
    const fixture = await workspace("manifest-fresh");
    const result = await installFresh(fixture);
    const manifest = await readManifest(fixture.targetRoot);

    expect(result.report.installationManifestRelative).toBe(INSTALLATION_MANIFEST_RELATIVE);
    expect(result.report.installationManifestStatus).toBe("valid");
    expect(validateInstallationManifest(manifest).status).toBe("valid");
    expect(manifest.files).toHaveProperty(".codex/rules/example.md");
    expect(manifest.files).toHaveProperty(".codex/scripts/publish-changes.mjs");
    expect(manifest.files).not.toHaveProperty("AGENTS.md");
    expect(manifest.files).not.toHaveProperty(".codex/project/project-guideline.md");
    expect(manifest.files).not.toHaveProperty(".codex/config/example.json");
    expect(JSON.stringify(manifest)).not.toContain(fixture.root);
  });

  it("records only selected docs files without adding profile metadata", async () => {
    const fixture = await workspace("manifest-docs-profile");
    const commonSource = resolve(fixture.kitRoot, "rules/agent-operating-contract.md");
    await mkdir(resolve(commonSource, ".."), { recursive: true });
    await writeFile(commonSource, "common workflow\n");

    await run(fixture, {
      options: { apply: true, projectMode: "new", kitProfile: "docs" },
    });
    const manifest = await readManifest(fixture.targetRoot);

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest).not.toHaveProperty("kitProfile");
    expect(manifest).not.toHaveProperty("selectedPayloadGroups");
    expect(manifest.files).toHaveProperty(".codex/rules/agent-operating-contract.md");
    expect(manifest.files).toHaveProperty(".codex/scripts/publish-changes.mjs");
    expect(manifest.files).not.toHaveProperty(".codex/rules/example.md");
    expect(manifest.files).not.toHaveProperty(".codex/github-settings/example.json");
  });

  it("preserves prior out-of-profile manifest records without treating them as obsolete", async () => {
    const fixture = await workspace("manifest-docs-profile-preserve");
    await installFresh(fixture);
    const before = await readManifest(fixture.targetRoot);
    expect(before.files).toHaveProperty(".codex/rules/example.md");

    const plan = await buildInstallPlan({ ...fixture, kitProfile: "docs" });
    expect(plan.entries.some((entry) => entry.targetRelative === ".codex/rules/example.md")).toBe(
      false,
    );
    expect(plan.entries.some((entry) => entry.mappingState === "source-no-longer-mapped")).toBe(
      false,
    );

    await run(fixture, {
      options: { apply: true, projectMode: "new", kitProfile: "docs" },
    });
    const after = await readManifest(fixture.targetRoot);
    expect(after.files[".codex/rules/example.md"]).toEqual(before.files[".codex/rules/example.md"]);
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/rules/example.md"), "utf8"),
    ).resolves.toBe("rule\n");
  });

  it("adopts exact normal managed files only during apply", async () => {
    const fixture = await workspace("manifest-adopt");
    const rule = resolve(fixture.targetRoot, ".codex/rules/example.md");
    const script = resolve(fixture.targetRoot, ".codex/scripts/publish-changes.mjs");
    const memory = resolve(fixture.targetRoot, ".codex/project/project-guideline.md");
    await mkdir(resolve(rule, ".."), { recursive: true });
    await mkdir(resolve(script, ".."), { recursive: true });
    await mkdir(resolve(memory, ".."), { recursive: true });
    await writeFile(rule, "rule\n");
    await writeFile(script, 'console.log("publish");\n');
    await writeFile(memory, "guideline\n");

    const dryRun = await run(fixture);
    expect(
      dryRun.plan.entries.find((entry) => entry.targetRelative === ".codex/rules/example.md"),
    ).toMatchObject({ baselineStatus: "adoptable", action: "skip-identical" });
    await expect(
      readFile(resolve(fixture.targetRoot, INSTALLATION_MANIFEST_RELATIVE)),
    ).rejects.toMatchObject({ code: "ENOENT" });

    await run(fixture, { options: { apply: true, skipConflicts: true } });
    const manifest = await readManifest(fixture.targetRoot);
    expect(manifest.files).toHaveProperty(".codex/rules/example.md");
    expect(manifest.files).not.toHaveProperty(".codex/scripts/publish-changes.mjs");
    expect(manifest.files).not.toHaveProperty(".codex/project/project-guideline.md");
  });

  it("classifies source-only, target-only, and concurrent changes from the baseline", async () => {
    const sourceOnly = await workspace("manifest-source-only");
    await installFresh(sourceOnly);
    await writeFile(resolve(sourceOnly.kitRoot, "rules/example.md"), "new source rule\n");
    let plan = await buildInstallPlan(sourceOnly);
    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/rules/example.md"),
    ).toMatchObject({
      resultCategory: "KIT_MANAGED_REPLACE",
      reasonCode: "target-equals-installed-baseline",
      action: "managed-replace-review",
    });

    const targetOnly = await workspace("manifest-target-only");
    await installFresh(targetOnly);
    await writeFile(resolve(targetOnly.targetRoot, ".codex/rules/example.md"), "local rule\n");
    plan = await buildInstallPlan(targetOnly);
    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/rules/example.md"),
    ).toMatchObject({
      resultCategory: "MIXED_AGENT_MERGE",
      reasonCode: "target-changed-from-baseline",
      action: "agent-merge",
    });

    const concurrent = await workspace("manifest-concurrent");
    await installFresh(concurrent);
    await writeFile(resolve(concurrent.targetRoot, ".codex/rules/example.md"), "local rule\n");
    await writeFile(resolve(concurrent.kitRoot, "rules/example.md"), "new source rule\n");
    plan = await buildInstallPlan(concurrent);
    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/rules/example.md"),
    ).toMatchObject({
      resultCategory: "MIXED_AGENT_MERGE",
      reasonCode: "source-and-target-changed-from-baseline",
    });
  });

  it("keeps managed replacement report-only in existing mode", async () => {
    const fixture = await workspace("manifest-existing-replace-blocked");
    await installFresh(fixture);
    const target = resolve(fixture.targetRoot, ".codex/rules/example.md");
    const original = await readFile(target, "utf8");
    await writeFile(resolve(fixture.kitRoot, "rules/example.md"), "new source rule\n");

    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          overwriteConflicts: true,
        },
      }),
    ).rejects.toMatchObject({ type: "EXISTING_PROJECT_REPLACEMENT_BLOCKED" });
    expect(await readFile(target, "utf8")).toBe(original);

    const before = await readManifest(fixture.targetRoot);
    await run(fixture, { options: { apply: true, skipConflicts: true } });
    expect(await readFile(target, "utf8")).toBe(original);
    expect(await readManifest(fixture.targetRoot)).toEqual(before);
  });

  it("retains the explicit new-project replacement path and records completed managed bytes", async () => {
    const fixture = await workspace("manifest-new-replace");
    await installFresh(fixture);
    const target = resolve(fixture.targetRoot, ".codex/rules/example.md");
    await writeFile(resolve(fixture.kitRoot, "rules/example.md"), "new source rule\n");

    await run(fixture, { options: { apply: true, projectMode: "new" } });
    expect(await readFile(target, "utf8")).toBe("new source rule\n");
    const manifest = await readManifest(fixture.targetRoot);
    expect(manifest.files[".codex/rules/example.md"].baselineSha256).toBe(await hashFile(target));
  });

  it("blocks missing manifested targets and removed source mappings", async () => {
    const missing = await workspace("manifest-missing-target");
    await installFresh(missing);
    await rm(resolve(missing.targetRoot, ".codex/rules/example.md"));
    let plan = await buildInstallPlan(missing);
    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/rules/example.md"),
    ).toMatchObject({
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "manifested-target-missing",
      action: "blocked",
    });
    await run(missing, { options: { apply: true, projectMode: "new" } });
    await expect(
      readFile(resolve(missing.targetRoot, ".codex/rules/example.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });

    const obsolete = await workspace("manifest-obsolete");
    await installFresh(obsolete);
    await rm(resolve(obsolete.kitRoot, "rules/example.md"));
    plan = await buildInstallPlan(obsolete);
    expect(
      plan.entries.find((entry) => entry.targetRelative === ".codex/rules/example.md"),
    ).toMatchObject({
      mappingState: "source-no-longer-mapped",
      resultCategory: "BLOCKED_MANUAL",
      reasonCode: "source-no-longer-mapped",
    });
  });

  it("reports invalid manifests and blocks apply before target writes", async () => {
    const fixture = await workspace("manifest-invalid");
    const output = createOutput();
    await installFresh(fixture);
    await writeFile(resolve(fixture.targetRoot, INSTALLATION_MANIFEST_RELATIVE), "{not json\n");
    await writeFile(resolve(fixture.kitRoot, "rules/new.md"), "new rule\n");

    const dryRun = await run(fixture);
    expect(dryRun.plan.installationManifest.status).toBe("invalid");
    expect(dryRun.plan.entries.every((entry) => entry.resultCategory === "BLOCKED_MANUAL")).toBe(
      true,
    );
    await expect(
      run(fixture, { options: { apply: true, skipConflicts: true }, output }),
    ).rejects.toMatchObject({ type: "INVALID_INSTALLATION_MANIFEST" });
    expect(output.messages).toContainEqual([
      "DANGER",
      "Install blocked: the installation manifest is invalid or conflicts with source policy; no target files were written.",
    ]);
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/rules/new.md")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects manifest ownership claims that conflict with source policy", async () => {
    const fixture = await workspace("manifest-policy-conflict");
    await installFresh(fixture);
    const manifest = await readManifest(fixture.targetRoot);
    manifest.files["AGENTS.md"] = {
      source: "project-templates/AGENTS.md",
      ownership: "kit-managed",
      mode: "full-file",
      baselineSha256: await hashFile(resolve(fixture.targetRoot, "AGENTS.md")),
    };
    manifest.payloadSha256 = manifestPayloadSha256(manifest.files);
    await writeManifest(fixture.targetRoot, manifest);

    const plan = await buildInstallPlan(fixture);
    expect(plan.installationManifest).toMatchObject({ status: "invalid" });
    expect(plan.installationManifest.issues).toContain(
      "Manifest claims a source-policy project or mixed path: AGENTS.md",
    );
  });

  it("validates manifest policy against full mappings before docs-profile filtering", async () => {
    const fixture = await workspace("manifest-docs-profile-policy-conflict");
    await installFresh(fixture);
    const manifest = await readManifest(fixture.targetRoot);
    manifest.files[".codex/config/example.json"] = {
      source: "config/example.json",
      ownership: "kit-managed",
      mode: "full-file",
      baselineSha256: await hashFile(resolve(fixture.targetRoot, ".codex/config/example.json")),
    };
    manifest.payloadSha256 = manifestPayloadSha256(manifest.files);
    await writeManifest(fixture.targetRoot, manifest);

    const plan = await buildInstallPlan({ ...fixture, kitProfile: "docs" });
    expect(
      plan.entries.some((entry) => entry.targetRelative === ".codex/config/example.json"),
    ).toBe(false);
    expect(plan.installationManifest).toMatchObject({ status: "invalid" });
    expect(plan.installationManifest.issues).toContain(
      "Manifest claims a source-policy project or mixed path: .codex/config/example.json",
    );
    expect(plan.entries.every((entry) => entry.resultCategory === "BLOCKED_MANUAL")).toBe(true);
  });

  it("detects manifest and adoption-candidate drift before baseline write", async () => {
    const manifestDrift = await workspace("manifest-plan-drift");
    await expect(
      run(manifestDrift, {
        options: { apply: true, projectMode: "new" },
        hooks: {
          afterStaging: async ({ roots }) => {
            await writeManifest(roots.targetRoot, {
              schemaVersion: 1,
              payloadSha256: manifestPayloadSha256({}),
              files: {},
            });
          },
        },
      }),
    ).rejects.toThrow("installation manifest changed after planning");

    const targetDrift = await workspace("manifest-adoption-drift");
    const output = createOutput();
    const rule = resolve(targetDrift.targetRoot, ".codex/rules/example.md");
    await mkdir(resolve(rule, ".."), { recursive: true });
    await writeFile(rule, "rule\n");
    await expect(
      run(targetDrift, {
        options: { apply: true, skipConflicts: true },
        output,
        hooks: {
          beforeInstallationManifestWrite: async () => {
            await writeFile(rule, "changed before manifest write\n");
          },
        },
      }),
    ).rejects.toThrow("Target changed before installation manifest update");
    expect(await readFile(rule, "utf8")).toBe("changed before manifest write\n");
    await expect(
      readFile(resolve(targetDrift.targetRoot, INSTALLATION_MANIFEST_RELATIVE)),
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      output.messages.some(
        ([level, message]) => level === "DANGER" && message.startsWith("Partial apply:"),
      ),
    ).toBe(true);
  });
});
