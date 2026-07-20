import { PublishError } from "../shared/errors.mjs";

export function parseCliOptions(argv) {
  const options = {
    mode: "publish",
    commitMessage: "",
    prTitle: "",
    prTitleExplicit: false,
    prNumber: null,
    yes: false,
    autoMerge: false,
    showDiff: false,
    verbose: false,
    policyPath: "",
    acknowledgeSecretReview: false,
    help: false,
  };
  const positionals = [];
  let acknowledgeSecretReviewSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--show-diff") options.showDiff = true;
    else if (value === "--verbose") options.verbose = true;
    else if (value === "--yes") options.yes = true;
    else if (value === "--auto-merge") options.autoMerge = true;
    else if (value === "--acknowledge-secret-review") {
      if (acknowledgeSecretReviewSeen) {
        throw new PublishError(
          "INVALID_ARGUMENT",
          "--acknowledge-secret-review may be supplied only once.",
        );
      }
      acknowledgeSecretReviewSeen = true;
      options.acknowledgeSecretReview = true;
    } else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--mode") {
      index += 1;
      if (!argv[index]) throw new PublishError("INVALID_ARGUMENT", "--mode requires a value.");
      options.mode = argv[index];
    } else if (value === "--policy") {
      index += 1;
      if (!argv[index]) throw new PublishError("INVALID_ARGUMENT", "--policy requires a path.");
      options.policyPath = argv[index];
    } else if (value.startsWith("-")) {
      throw new PublishError("INVALID_ARGUMENT", `Unknown option: ${value}`);
    } else {
      positionals.push(value);
    }
  }

  if (!["publish", "pr-review", "pr-merge", "safety-guard"].includes(options.mode)) {
    throw new PublishError("INVALID_ARGUMENT", `Unknown publish mode: ${options.mode}`);
  }
  if (options.yes && options.mode !== "pr-merge") {
    throw new PublishError("INVALID_ARGUMENT", "--yes is supported only with pr-merge mode.");
  }
  if (options.autoMerge && options.mode !== "pr-merge") {
    throw new PublishError(
      "INVALID_ARGUMENT",
      "--auto-merge is supported only with pr-merge mode.",
    );
  }
  if (options.policyPath && options.mode !== "publish") {
    throw new PublishError("INVALID_ARGUMENT", "--policy is supported only with publish mode.");
  }
  if (options.acknowledgeSecretReview && !["publish", "pr-review"].includes(options.mode)) {
    throw new PublishError(
      "INVALID_ARGUMENT",
      "--acknowledge-secret-review is supported only with publish or pr-review mode.",
    );
  }
  if (options.mode === "pr-merge") {
    if (options.showDiff || options.policyPath) {
      throw new PublishError(
        "INVALID_ARGUMENT",
        "pr-merge supports only --yes, --auto-merge, --verbose, and --help.",
      );
    }
    if (options.help) return options;
    if (positionals.length !== 1 || !/^[1-9]\d*$/.test(positionals[0])) {
      throw new PublishError(
        "INVALID_ARGUMENT",
        "pr-merge requires exactly one positive integer PR number.",
      );
    }
    options.prNumber = Number(positionals[0]);
    return options;
  }

  if (options.mode === "safety-guard") {
    if (options.showDiff || options.policyPath || positionals.length) {
      throw new PublishError(
        "INVALID_ARGUMENT",
        "safety-guard supports only --verbose and --help.",
      );
    }
    return options;
  }

  if (positionals.length > 2) {
    throw new PublishError(
      "INVALID_ARGUMENT",
      "Expected at most two positional arguments: commit message and PR title.",
    );
  }

  options.prTitleExplicit = positionals.length === 2;
  [options.commitMessage = "", options.prTitle = ""] = positionals;
  if (options.commitMessage && !options.prTitle) options.prTitle = options.commitMessage;
  return options;
}

export function usage() {
  return [
    "Usage:",
    '  node .repo-tools/scripts/publish-changes.mjs [options] ["Commit message"] ["PR title"]',
    '  node .repo-tools/scripts/publish-changes.mjs --mode pr-review [options] ["Commit message"] ["PR title"]',
    "  node .repo-tools/scripts/publish-changes.mjs --mode safety-guard [--verbose]",
    "  node .repo-tools/scripts/publish-changes.mjs --mode pr-merge <pr-number> [--auto-merge] [--yes] [--verbose]",
    "",
    "Options:",
    "  --show-diff    Print the full relevant diff",
    "  --mode MODE    Use publish, pr-review, pr-merge, or safety-guard mode",
    "  --yes          Skip only the pr-merge human confirmation",
    "  --auto-merge   Enable PR auto-merge only when required checks are pending",
    "  --acknowledge-secret-review  Continue after reviewing review-required findings",
    "  --verbose      Print DEBUG output",
    "  --policy PATH  Use a specific YAML policy file",
    "  -h, --help     Show this help",
  ].join("\n");
}
