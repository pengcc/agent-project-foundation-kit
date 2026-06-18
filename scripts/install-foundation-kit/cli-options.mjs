import { InstallerError } from "./errors.mjs";

const PROJECT_MODES = new Set(["auto", "new", "existing"]);

export function parseCliOptions(argv) {
  const options = {
    target: "",
    apply: false,
    showDiff: false,
    projectMode: "auto",
    overwriteConflicts: false,
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
    "  --overwrite-conflicts     Authorize existing-mode conflict replacement; backup and typed confirmation remain required",
    "  --show-diff               Preview conflicts with diff -u when available; does not authorize overwrite",
    "  --verbose                 Print DEBUG output",
    "  -h, --help                Show this help",
  ].join("\n");
}
