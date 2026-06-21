import { InstallerError } from "./errors.mjs";

const PROJECT_MODES = new Set(["auto", "new", "existing"]);

export function parseCliOptions(argv) {
  const options = {
    target: "",
    apply: false,
    showDiff: false,
    projectMode: "auto",
    overwriteConflicts: false,
    skipConflicts: false,
    includeOptional: [],
    verbose: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--target") {
      index += 1;
      if (!argv[index]) {
        throw new InstallerError("INVALID_ARGUMENT", "--target requires a path.");
      }
      options.target = argv[index];
    } else if (value === "--apply") {
      options.apply = true;
    } else if (value === "--show-diff") {
      options.showDiff = true;
    } else if (value === "--project-mode") {
      index += 1;
      const mode = argv[index];
      if (!mode) {
        throw new InstallerError("INVALID_ARGUMENT", "--project-mode requires a value.");
      }
      if (!PROJECT_MODES.has(mode)) {
        throw new InstallerError(
          "INVALID_ARGUMENT",
          `Unsupported project mode: ${mode}. Expected auto, new, or existing.`,
        );
      }
      options.projectMode = mode;
    } else if (value === "--overwrite-conflicts") {
      options.overwriteConflicts = true;
    } else if (value === "--skip-conflicts") {
      options.skipConflicts = true;
    } else if (value === "--include-optional") {
      index += 1;
      const name = argv[index];
      if (!name || name.startsWith("--")) {
        throw new InstallerError("INVALID_ARGUMENT", "--include-optional requires a skill name.");
      }
      options.includeOptional.push(name);
    } else if (value === "--verbose") {
      options.verbose = true;
    } else if (value === "--help" || value === "-h") {
      options.help = true;
    } else {
      throw new InstallerError("INVALID_ARGUMENT", `Unknown option: ${value}`);
    }
  }

  if (!options.help && !options.target) {
    throw new InstallerError("INVALID_ARGUMENT", "--target is required.");
  }
  if (options.skipConflicts && !options.apply) {
    throw new InstallerError("INVALID_ARGUMENT", "--skip-conflicts requires --apply.");
  }
  if (options.skipConflicts && options.overwriteConflicts) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--skip-conflicts and --overwrite-conflicts are mutually exclusive.",
    );
  }
  if (options.skipConflicts && options.projectMode === "new") {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--skip-conflicts cannot be combined with --project-mode new.",
    );
  }
  options.includeOptional = [...new Set(options.includeOptional)];
  return options;
}

export function usage() {
  return [
    "Usage:",
    "  node scripts/install-foundation-kit.mjs --target PATH [--apply] [options]",
    "",
    "Default mode is dry-run. No target files are written unless --apply is provided.",
    "",
    "Options:",
    "  --target PATH             Required downstream project root",
    "  --apply                   Apply the prepared install plan",
    "  --project-mode MODE       auto (default), new, or existing",
    "  --overwrite-conflicts     Retained for new-project workflows; existing-project replacement is blocked in WI-1",
    "  --skip-conflicts          With --apply, write safe new files and preserve every existing target",
    "  --include-optional NAME   Include one optional skill; repeat to select more",
    "  --show-diff               Preview conflicts with diff -u when available; does not authorize overwrite",
    "  --verbose                 Print DEBUG output",
    "  -h, --help                Show this help",
    "",
    "Direct pnpm examples (no extra -- separator):",
    "  pnpm install:node --target /path/to/project --apply --skip-conflicts",
    "  pnpm install:node --target /path/to/project --include-optional react-component-patterns",
  ].join("\n");
}
