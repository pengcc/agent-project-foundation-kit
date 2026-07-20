import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runInstallerFlow } from "../../scripts/install-foundation-kit/flow.mjs";
import { PUBLISH_PACKAGE_ALIASES } from "../../scripts/install-foundation-kit/publish-aliases.mjs";
import { createOutput, createTestWorkspace } from "./helpers.mjs";

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function workspace(name) {
  const fixture = await createTestWorkspace(name);
  cleanups.push(fixture.cleanup);
  return fixture;
}

function options(target, overrides = {}) {
  return {
    target,
    apply: false,
    includeOptional: [],
    kitProfile: "",
    verbose: false,
    help: false,
    ...overrides,
  };
}

async function run(fixture, overrides = {}, hooks = {}) {
  const output = createOutput();
  const result = await runInstallerFlow({
    repoRoot: fixture.repoRoot,
    options: options(fixture.targetRoot, overrides),
    output,
    signal: new AbortController().signal,
    runId: `test-${Date.now()}-${Math.random()}`,
    hooks,
  });
  return { ...result, output };
}

async function exists(path) {
  return Boolean(await lstat(path).catch(() => null));
}

describe("foundation kit install/update flow", () => {
  it("fresh install creates the approved structure and never creates legacy project memory", async () => {
    const fixture = await workspace("fresh");
    const result = await run(fixture, { apply: true });

    await expect(readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).resolves.toBe(
      "agent instructions\n",
    );
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-memory/guideline.md"), "utf8"),
    ).resolves.toBe("guideline\n");
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-memory/decisions.md"), "utf8"),
    ).resolves.toBe("decisions\n");
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-memory/lessons-learned.md"), "utf8"),
    ).resolves.toBe("lessons\n");
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-specific/agent-guidance.md"), "utf8"),
    ).resolves.toBe("guidance\n");
    expect(await exists(resolve(fixture.targetRoot, ".codex/project"))).toBe(false);
    expect(result.report.preservedFiles).toBe(0);
  });

  it("normal apply replaces Kit-owned content, removes obsolete files, and preserves repository-owned content", async () => {
    const fixture = await workspace("update");
    await run(fixture, { apply: true, includeOptional: ["optional-example"] });

    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "downstream edit\n");
    await writeFile(
      resolve(fixture.targetRoot, ".codex/skills/core/core-example/SKILL.md"),
      "downstream skill edit\n",
    );
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project-memory/guideline.md"),
      "repository facts\n",
    );
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project-specific/agent-guidance.md"),
      "repository guidance\n",
    );
    await mkdir(resolve(fixture.targetRoot, ".codex/project-specific/skills/local"), {
      recursive: true,
    });
    await writeFile(
      resolve(fixture.targetRoot, ".codex/project-specific/skills/local/SKILL.md"),
      "local\n",
    );
    await writeFile(resolve(fixture.targetRoot, ".codex/rules/removed-from-kit.md"), "obsolete\n");
    await mkdir(resolve(fixture.targetRoot, ".codex/foundation-kit"), { recursive: true });
    await writeFile(
      resolve(fixture.targetRoot, ".codex/foundation-kit/installation-manifest.json"),
      "{}\n",
    );

    const result = await run(fixture, { apply: true });

    await expect(readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).resolves.toBe(
      "agent instructions\n",
    );
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/skills/core/core-example/SKILL.md"), "utf8"),
    ).resolves.toBe("core skill\n");
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-memory/guideline.md"), "utf8"),
    ).resolves.toBe("repository facts\n");
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-specific/agent-guidance.md"), "utf8"),
    ).resolves.toBe("repository guidance\n");
    await expect(
      readFile(
        resolve(fixture.targetRoot, ".codex/project-specific/skills/local/SKILL.md"),
        "utf8",
      ),
    ).resolves.toBe("local\n");
    expect(await exists(resolve(fixture.targetRoot, ".codex/rules/removed-from-kit.md"))).toBe(
      false,
    );
    expect(
      await exists(
        resolve(fixture.targetRoot, ".codex/skills/engineering/optional-example/SKILL.md"),
      ),
    ).toBe(false);
    expect(
      await exists(resolve(fixture.targetRoot, ".codex/skills/engineering/optional-example")),
    ).toBe(false);
    expect(await exists(resolve(fixture.targetRoot, ".codex/foundation-kit"))).toBe(false);
    expect(result.report.replacedFiles).toBeGreaterThan(0);
    expect(result.report.removedFiles).toBeGreaterThanOrEqual(3);
    expect(result.report.preservedFiles).toBe(4);
    await expect(
      readFile(
        resolve(
          fixture.targetRoot,
          result.report.backupRelative,
          ".codex/skills/meta/meta-example/SKILL.md",
        ),
        "utf8",
      ),
    ).resolves.toBe("meta skill\n");
  });

  it("keeps package.json augmentation separate and preserves conflicting aliases", async () => {
    const fixture = await workspace("package-aliases");
    await writeFile(
      resolve(fixture.targetRoot, "package.json"),
      `${JSON.stringify({ name: "target", scripts: { "publish:changes": "custom-command" } }, null, 2)}\n`,
    );

    const result = await run(fixture, { apply: true });
    const packageValue = JSON.parse(
      await readFile(resolve(fixture.targetRoot, "package.json"), "utf8"),
    );
    expect(packageValue.name).toBe("target");
    expect(packageValue.scripts["publish:changes"]).toBe("custom-command");
    for (const [name, command] of Object.entries(PUBLISH_PACKAGE_ALIASES)) {
      if (name !== "publish:changes") expect(packageValue.scripts[name]).toBe(command);
    }
    expect(result.report.publishAliases.skippedConflicts).toEqual(["publish:changes"]);
    expect(result.report.publishAliases.applied).toBe(true);
  });

  it("dry-run reports replacement and preservation without target writes", async () => {
    const fixture = await workspace("dry-run");
    await mkdir(resolve(fixture.targetRoot, ".codex/project-memory"), { recursive: true });
    await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "existing\n");
    await writeFile(resolve(fixture.targetRoot, ".codex/project-memory/guideline.md"), "keep\n");

    const result = await run(fixture);
    await expect(readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).resolves.toBe(
      "existing\n",
    );
    await expect(
      readFile(resolve(fixture.targetRoot, ".codex/project-memory/guideline.md"), "utf8"),
    ).resolves.toBe("keep\n");
    expect(result.report.replacedFiles).toBe(1);
    expect(result.report.preservedFiles).toBe(1);
  });

  it("detects target drift after staging before applying", async () => {
    const fixture = await workspace("drift");
    await expect(
      run(
        fixture,
        { apply: true },
        {
          afterStaging: async () => {
            await writeFile(resolve(fixture.targetRoot, "AGENTS.md"), "appeared after plan\n");
          },
        },
      ),
    ).rejects.toThrow("Source or target state changed after planning");
    await expect(readFile(resolve(fixture.targetRoot, "AGENTS.md"), "utf8")).resolves.toBe(
      "appeared after plan\n",
    );
  });

  it("replaces selected Kit-owned roots as complete bounded units", async () => {
    const fixture = await workspace("bounded-root-replacement");
    await run(fixture, { apply: true });

    await run(
      fixture,
      { apply: true },
      {
        beforeApply: async () => {
          await writeFile(
            resolve(fixture.targetRoot, ".codex/rules/appeared-after-check.md"),
            "stale\n",
          );
        },
      },
    );

    expect(await exists(resolve(fixture.targetRoot, ".codex/rules/appeared-after-check.md"))).toBe(
      false,
    );
  });
});
