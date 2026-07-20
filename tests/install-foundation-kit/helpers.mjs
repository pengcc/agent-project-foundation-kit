import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const TEST_ROOT = resolve(
  import.meta.dirname,
  "..",
  "..",
  "dev_locals",
  "test-runs",
  "install-foundation-kit-node",
);

export async function createTestWorkspace(name) {
  await mkdir(TEST_ROOT, { recursive: true });
  const root = await mkdtemp(resolve(TEST_ROOT, `${name}-`));
  const repoRoot = resolve(root, "source repo");
  const targetRoot = resolve(root, "target project");
  await mkdir(repoRoot, { recursive: true });
  await mkdir(targetRoot, { recursive: true });
  await createFixtureKit(repoRoot);
  return {
    root,
    repoRoot,
    kitRoot: resolve(repoRoot, "kit"),
    targetRoot,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

export async function createFixtureKit(repoRoot) {
  const kitRoot = resolve(repoRoot, "kit");
  const optionalSkillsDirectory = "codex/optional-skills";
  const files = {
    "AGENTS.md": "agent instructions\n",
    "codex/project-memory/guideline.md": "guideline\n",
    "codex/project-memory/decisions.md": "decisions\n",
    "codex/project-memory/lessons-learned.md": "lessons\n",
    "codex/project-specific/agent-guidance.md": "guidance\n",
    "codex/skills/meta/meta-example/SKILL.md": "meta skill\n",
    "codex/skills/core/core-example/SKILL.md": "core skill\n",
    "codex/prompts/example.md": "prompt\n",
    "codex/prompts/force-initialize-project-context.md": "initialize\n",
    "codex/rules/example.md": "rule\n",
    "repo-tools/config/example.json": '{"enabled":true}\n',
    "repo-tools/config/publish-changes-policy.yml": "updateTypes: {}\n",
    "repo-tools/config/publish-cli-theme.json": '{"levels":{}}\n',
    "repo-tools/github-settings/example.json": '{"private":true}\n',
    "repo-tools/scripts/publish-changes.mjs": 'console.log("publish");\n',
    "repo-tools/scripts/shared/command-runner.mjs": "export function createCommandRunner() {}\n",
    "repo-tools/scripts/shared/git-client.mjs": "export function createGitClient() {}\n",
    [`${optionalSkillsDirectory}/optional-example/SKILL.md`]: "optional skill\n",
    [`${optionalSkillsDirectory}/optional-example/metadata.yml`]: [
      "name: optional-example",
      "description: Optional fixture skill.",
      "category: optional",
      "required: false",
      "invocation: model",
      "depends_on: []",
      "version: 0.1.0",
      "",
    ].join("\n"),
    [`${optionalSkillsDirectory}/react-component-patterns/SKILL.md`]: "react patterns\n",
    [`${optionalSkillsDirectory}/react-component-patterns/metadata.yml`]: [
      "name: react-component-patterns",
      "description: React fixture skill.",
      "category: optional",
      "required: false",
      "invocation: model",
      "depends_on: []",
      "version: 0.1.0",
      "",
    ].join("\n"),
  };
  for (const [relative, contents] of Object.entries(files)) {
    const path = resolve(kitRoot, relative);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, contents, "utf8");
  }
  await chmod(resolve(kitRoot, "repo-tools/scripts/publish-changes.mjs"), 0o755);
  return kitRoot;
}

export function createOutput() {
  const messages = [];
  const add = (level) => (message) => messages.push([level, message]);
  return {
    messages,
    step: add("STEP"),
    info: add("INFO"),
    warning: add("WARNING"),
    error: add("ERROR"),
    danger: add("DANGER"),
    prompt: add("PROMPT"),
    success: add("SUCCESS"),
    skipped: add("SKIPPED"),
    debug: add("DEBUG"),
  };
}

export function commandRunner(result = { ok: true, exitCode: 0, stdout: "", stderr: "" }) {
  return { run: async () => ({ ...result }) };
}
