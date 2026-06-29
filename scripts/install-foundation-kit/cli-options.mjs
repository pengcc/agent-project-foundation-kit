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
    replaceKitManaged: false,
    includeOptional: [],
    kitProfile: "",
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
    } else if (value === "--replace-kit-managed") {
      options.replaceKitManaged = true;
    } else if (value === "--include-optional") {
      index += 1;
      const name = argv[index];
      if (!name || name.startsWith("--")) {
        throw new InstallerError("INVALID_ARGUMENT", "--include-optional requires a skill name.");
      }
      options.includeOptional.push(name);
    } else if (value === "--kit-profile") {
      index += 1;
      const profile = argv[index];
      if (!profile || profile.startsWith("--")) {
        throw new InstallerError("INVALID_ARGUMENT", "--kit-profile requires a value.");
      }
      if (profile !== "docs") {
        throw new InstallerError(
          "INVALID_ARGUMENT",
          `Unsupported kit profile: ${profile}. Expected docs.`,
        );
      }
      options.kitProfile = profile;
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
  if (options.replaceKitManaged && !options.apply) {
    throw new InstallerError("INVALID_ARGUMENT", "--replace-kit-managed requires --apply.");
  }
  if (options.replaceKitManaged && options.projectMode !== "existing") {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--replace-kit-managed requires --project-mode existing.",
    );
  }
  if (options.replaceKitManaged && (options.skipConflicts || options.overwriteConflicts)) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--replace-kit-managed is mutually exclusive with --skip-conflicts and --overwrite-conflicts.",
    );
  }
  options.includeOptional = [...new Set(options.includeOptional)];
  if (options.kitProfile && options.includeOptional.length) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--kit-profile docs cannot be combined with --include-optional.",
    );
  }
  if (options.kitProfile && options.replaceKitManaged) {
    throw new InstallerError(
      "INVALID_ARGUMENT",
      "--kit-profile docs cannot be combined with --replace-kit-managed.",
    );
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
    "  --overwrite-conflicts     Retained for broad new-project replacement only",
    "  --skip-conflicts          With --apply, write safe new files and preserve every existing target",
    "  --replace-kit-managed     With explicit existing mode and --apply, replace only the two allowlisted React optional files",
    "  --include-optional NAME   Include one optional skill; repeat to select more",
    "  --kit-profile docs        Install the non-code docs profile instead of the complete kit",
    "  --show-diff               Preview conflicts with diff -u when available; does not authorize overwrite",
    "  --verbose                 Print DEBUG output",
    "  -h, --help                Show this help",
    "",
    "Direct pnpm examples (no extra -- separator):",
    "  pnpm install:node --target /path/to/project --apply --skip-conflicts",
    "  pnpm install:node --target /path/to/project --include-optional react-component-patterns",
    "  pnpm install:node --target /path/to/project --kit-profile docs",
  ].join("\n");
}
