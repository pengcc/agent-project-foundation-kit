#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCliOptions, usage } from "./publish-changes/cli-options.mjs";
import { runPublishFlow } from "./publish-changes/flow.mjs";
import { runMergePrFlow } from "./publish-changes/merge-pr-flow.mjs";
import { loadPolicy } from "./publish-changes/policy.mjs";
import { runPrOnlyFlow } from "./publish-changes/pr-only-flow.mjs";
import { createPrompts } from "./publish-changes/prompts.mjs";
import { createCommandRunner } from "./shared/command-runner.mjs";
import { PublishError } from "./shared/errors.mjs";
import { createGhClient } from "./shared/gh-client.mjs";
import { createGitClient } from "./shared/git-client.mjs";
import { createOutput } from "./shared/output.mjs";
import { loadOutputTheme } from "./shared/output-theme.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));

export function assertSupportedRuntime(version = process.versions.node) {
  const major = Number(version.split(".")[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new PublishError(
      "UNSUPPORTED_RUNTIME",
      `Node.js 24 or newer is required; current version is ${version}.`,
    );
  }
}

export async function main(argv = process.argv.slice(2)) {
  assertSupportedRuntime();
  const options = parseCliOptions(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const themePath = resolve(scriptDir, "..", "config", "publish-cli-theme.json");
  const {
    theme,
    source: themeSource,
    warning: themeWarning,
  } = await loadOutputTheme({
    path: themePath,
  });
  const output = createOutput({ verbose: options.verbose, theme });
  if (themeWarning) output.warning(themeWarning);
  output.debug(`Theme source: ${themeSource}`);
  const prompts = createPrompts({
    formatPrompt: (message) => output.format("PROMPT", message),
    warning: output.warning,
  });
  const commandRunner = createCommandRunner();
  const git = createGitClient(commandRunner, process.cwd());
  const gh = createGhClient(commandRunner, process.cwd());
  try {
    if (options.mode === "pr-only") {
      await runPrOnlyFlow({ git, gh, prompts, output, options });
      return;
    }
    if (options.mode === "merge-pr") {
      await runMergePrFlow({ git, gh, prompts, output, options });
      return;
    }
    const policyPath =
      options.policyPath || resolve(scriptDir, "..", "config", "publish-changes-policy.yml");
    const { policy, source } = await loadPolicy({ path: policyPath, output });
    output.debug(`Policy source: ${source}`);
    await runPublishFlow({ git, gh, prompts, output, policy, options });
  } finally {
    prompts.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const type = error instanceof PublishError ? error.type : "UNEXPECTED_ERROR";
    createOutput().error(`${type}: ${error.message}`);
    process.exitCode = 1;
  });
}
