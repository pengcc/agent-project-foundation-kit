import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { InstallerError } from "../../scripts/install-foundation-kit/errors.mjs";
import { runInstallerFlow } from "../../scripts/install-foundation-kit/flow.mjs";
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

  it("applies a fresh install, preserves executable mode, and omits source-only files", async () => {
    const fixture = await workspace("fresh-apply");
    await writeFile(resolve(fixture.targetRoot, "package.json"), '{"private":true}\n');
    const originalPackage = await readFile(resolve(fixture.targetRoot, "package.json"), "utf8");
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
    expect(await readFile(resolve(fixture.targetRoot, "package.json"), "utf8")).toBe(
      originalPackage,
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
      "Partial adoption: safe new files were installed; existing differences and migration items were preserved for review.",
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
      "[SCRIPT-MERGE] .codex/scripts/publish-changes.mjs differs; target scripts may contain project-specific workflow, publish, CI, or local automation changes.",
    ]);
    expect(
      output.messages.some(
        ([level, message]) => level === "SUCCESS" && message.includes("1 script merge"),
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

  it("cancels conflicts before runtime staging or target writes", async () => {
    const fixture = await workspace("cancel-conflict");
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          overwriteConflicts: true,
        },
        prompts: prompts({ accept: false }),
        runId: "not-created",
      }),
    ).rejects.toThrow("Confirmation token did not match");
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe("existing\n");
    await expect(
      lstat(
        resolve(fixture.repoRoot, "dev_locals/workflow-tmp/install-foundation-kit/not-created"),
      ),
    ).rejects.toMatchObject({ code: "ENOENT" });
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

  it("keeps warning, typed confirmation, backup, and overwrite with explicit authorization", async () => {
    const fixture = await workspace("existing-overwrite");
    const output = createOutput();
    let prompted = false;
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    const script = resolve(fixture.targetRoot, ".codex/scripts/publish-changes.mjs");
    await mkdir(resolve(script, ".."), { recursive: true });
    await writeFile(script, "project-specific publish workflow\n");
    const result = await run(fixture, {
      options: {
        apply: true,
        projectMode: "existing",
        overwriteConflicts: true,
      },
      output,
      prompts: {
        confirmBackup: async () => {
          prompted = true;
          return true;
        },
      },
    });

    expect(prompted).toBe(true);
    expect(result.report).toMatchObject({
      effectiveProjectMode: "existing",
      conflictPolicy: "explicit-backup-and-overwrite",
      backupRelative: ".codex/backups/install-20260615-123456",
    });
    expect(output.messages).toContainEqual([
      "DANGER",
      "Conflicts may contain important existing-project context.",
    ]);
    expect(output.messages).toContainEqual([
      "DANGER",
      "[SCRIPT-MERGE] .codex/scripts/publish-changes.mjs differs; target scripts may contain project-specific workflow, publish, CI, or local automation changes.",
    ]);
    expect(
      await readFile(
        resolve(
          fixture.targetRoot,
          result.report.backupRelative,
          ".codex/scripts/publish-changes.mjs",
        ),
        "utf8",
      ),
    ).toBe("project-specific publish workflow\n");
    expect(await readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).toBe(
      "agent instructions\n",
    );
    expect(await readFile(script, "utf8")).toBe('console.log("publish");\n');
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
    ).rejects.toThrow("Source or target state changed");
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
    ).rejects.toThrow("Source or target state changed");
    expect(await readdir(sourceDrift.targetRoot)).toEqual([]);
  });

  it("revalidates after backup materialization before mapped writes", async () => {
    const fixture = await workspace("post-backup-drift");
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    await expect(
      run(fixture, {
        options: {
          apply: true,
          projectMode: "existing",
          overwriteConflicts: true,
        },
        hooks: {
          afterBackupMaterialized: async ({ roots }) => {
            await writeFile(resolve(roots.targetRoot, "AGENTS.md"), "changed after backup\n");
          },
        },
      }),
    ).rejects.toThrow("Source or target state changed");
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
