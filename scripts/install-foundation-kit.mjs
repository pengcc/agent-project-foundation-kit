#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createOutput } from "../kit/repo-tools/scripts/shared/output.mjs";
import { loadOutputTheme } from "../kit/repo-tools/scripts/shared/output-theme.mjs";
import { parseCliOptions, usage } from "./install-foundation-kit/cli-options.mjs";
import { InstallerError } from "./install-foundation-kit/errors.mjs";
import { runInstallerFlow } from "./install-foundation-kit/flow.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

export function assertSupportedRuntime(version = process.versions.node) {
  const major = Number(version.split(".")[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new InstallerError(
      "UNSUPPORTED_RUNTIME",
      `Node.js 24 or newer is required; current version is ${version}.`,
    );
  }
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseCliOptions(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  assertSupportedRuntime();

  const { theme, warning, source } = await loadOutputTheme({
    path: resolve(repoRoot, "kit", "config", "publish-cli-theme.json"),
  });
  const output = createOutput({ verbose: options.verbose, theme });
  if (warning) output.warning(warning);
  output.debug(`Theme source: ${source}`);
  const abortController = new AbortController();
  const abort = () => abortController.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  try {
    return await runInstallerFlow({
      repoRoot,
      options,
      output,
      signal: abortController.signal,
    });
  } finally {
    process.off("SIGINT", abort);
    process.off("SIGTERM", abort);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const type = error instanceof InstallerError ? error.type : "UNEXPECTED_ERROR";
    createOutput().error(`${type}: ${error.message}`);
    process.exitCode = error?.type === "INVALID_ARGUMENT" ? 2 : 1;
  });
}
