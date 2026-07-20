import { InstallerError } from "./errors.mjs";

export function parseCliOptions(argv) {
  const options = {
    target: "",
    apply: false,
    includeOptional: [],
    kitProfile: "",
    verbose: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--target") {
      options.target = argv[++index] ?? "";
      if (!options.target)
        throw new InstallerError("INVALID_ARGUMENT", "--target requires a path.");
    } else if (value === "--apply") options.apply = true;
    else if (value === "--include-optional") {
      const name = argv[++index];
      if (!name || name.startsWith("--"))
        throw new InstallerError("INVALID_ARGUMENT", "--include-optional requires a skill name.");
      options.includeOptional.push(name);
    } else if (value === "--kit-profile") {
      const profile = argv[++index];
      if (profile !== "docs")
        throw new InstallerError(
          "INVALID_ARGUMENT",
          `Unsupported kit profile: ${profile || "missing"}. Expected docs.`,
        );
      options.kitProfile = profile;
    } else if (value === "--verbose") options.verbose = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new InstallerError("INVALID_ARGUMENT", `Unknown option: ${value}`);
  }
  if (!options.help && !options.target)
    throw new InstallerError("INVALID_ARGUMENT", "--target is required.");
  options.includeOptional = [...new Set(options.includeOptional)];
  if (options.kitProfile && options.includeOptional.length) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--kit-profile docs cannot be combined with --include-optional.",
    );
  }
  return options;
}

export function usage() {
  return [
    "Usage:",
    "  node scripts/install-foundation-kit.mjs --target PATH [--apply] [options]",
    "",
    "Default mode is dry-run. --apply replaces the selected Kit-owned payload while preserving",
    ".codex/project-memory/ and .codex/project-specific/.",
    "",
    "Options:",
    "  --target PATH             Required downstream project root",
    "  --apply                   Apply the prepared install or update plan",
    "  --include-optional NAME   Include one optional skill; repeat to select more",
    "  --kit-profile docs        Install the non-code docs profile instead of the complete kit",
    "  --verbose                 Print DEBUG output",
    "  -h, --help                Show this help",
  ].join("\n");
}
