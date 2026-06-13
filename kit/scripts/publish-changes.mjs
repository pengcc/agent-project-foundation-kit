#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCommandRunner } from './shared/command-runner.mjs';
import { createGitClient } from './shared/git-client.mjs';
import { createGhClient } from './shared/gh-client.mjs';
import { createOutput } from './shared/output.mjs';
import { PublishError } from './shared/errors.mjs';
import { parseCliOptions, usage } from './publish-changes/cli-options.mjs';
import { loadPolicy } from './publish-changes/policy.mjs';
import { createPrompts } from './publish-changes/prompts.mjs';
import { runPublishFlow } from './publish-changes/flow.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));

export function assertSupportedRuntime(version = process.versions.node) {
  const major = Number(version.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new PublishError(
      'UNSUPPORTED_RUNTIME',
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

  const output = createOutput({ verbose: options.verbose });
  const prompts = createPrompts();
  const commandRunner = createCommandRunner();
  const git = createGitClient(commandRunner, process.cwd());
  const gh = createGhClient(commandRunner, process.cwd());
  const policyPath =
    options.policyPath || resolve(scriptDir, '..', 'config', 'publish-changes-policy.yml');

  try {
    const { policy, source } = await loadPolicy({ path: policyPath, output });
    output.debug(`Policy source: ${source}`);
    await runPublishFlow({ git, gh, prompts, output, policy, options });
  } finally {
    prompts.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const type = error instanceof PublishError ? error.type : 'UNEXPECTED_ERROR';
    process.stderr.write(`[ERROR] ${type}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
