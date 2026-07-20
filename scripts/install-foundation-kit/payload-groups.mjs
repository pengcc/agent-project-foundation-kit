// Static capability taxonomy for reporting and explicit profile selection.

export const PAYLOAD_GROUP_ORDER = Object.freeze([
  "project-templates",
  "common-workflow",
  "docs-writing-workflow",
  "code-workflow",
  "publish-package",
  "github-setup",
  "optional-skills",
  "unclassified",
]);

const PROJECT_TEMPLATE_TARGETS = new Set([
  "AGENTS.md",
  ".codex/project-memory/guideline.md",
  ".codex/project-memory/decisions.md",
  ".codex/project-memory/lessons-learned.md",
  ".codex/project-specific/agent-guidance.md",
]);

const COMMON_WORKFLOW_TARGETS = new Set([
  ".codex/rules/agent-operating-contract.md",
  ".codex/rules/skill-and-output-efficiency.md",
  ".codex/rules/skill-invocation-and-dependency-boundaries.md",
  ".codex/rules/task-and-change-safety-principles.md",
  ".codex/rules/task-execution-classification.md",
  ".codex/prompts/force-execute-plan.md",
  ".codex/prompts/force-initialize-project-context.md",
  ".codex/prompts/force-plan-with-context.md",
]);

const COMMON_WORKFLOW_PREFIXES = Object.freeze([
  ".codex/skills/meta/agent-roles-and-capabilities/",
  ".codex/skills/meta/grilling/",
  ".codex/skills/meta/initialize-project-context/",
  ".codex/skills/meta/plan-with-context/",
  ".codex/skills/meta/product-framing-review/",
  ".codex/skills/meta/project-memory/",
  ".codex/skills/meta/update-project-memory/",
  ".codex/skills/core/execute-plan/",
]);

const DOCS_WRITING_TARGETS = new Set([
  ".codex/rules/docs-first-policy.md",
  ".codex/prompts/force-grill-me.md",
  ".codex/prompts/force-handoff.md",
  ".codex/prompts/force-writing-great-skills.md",
]);

const DOCS_WRITING_PREFIXES = Object.freeze([
  ".codex/skills/meta/docs-first-research/",
  ".codex/skills/meta/grill-me/",
  ".codex/skills/meta/handoff/",
  ".codex/skills/meta/writing-great-skills/",
  ".codex/skills/core/to-work-items/",
]);

const CODE_WORKFLOW_TARGETS = new Set([
  ".codex/rules/engineering-quality-principles.md",
  ".codex/prompts/force-code-review.md",
  ".codex/prompts/force-codebase-audit.md",
  ".codex/prompts/force-project-architecture-plan.md",
  ".codex/prompts/force-ui-design-basics.md",
]);

const CODE_WORKFLOW_PREFIXES = Object.freeze([
  ".codex/skills/core/acceptance-review/",
  ".codex/skills/core/code-review/",
  ".codex/skills/core/codebase-audit/",
  ".codex/skills/core/diagnose/",
  ".codex/skills/core/project-architecture-plan/",
  ".codex/skills/core/ui-design-basics/",
]);

const PUBLISH_PACKAGE_TARGETS = new Set([
  ".codex/prompts/force-publish-current-branch.md",
  ".codex/config/publish-changes-policy.yml",
  ".codex/config/publish-cli-theme.json",
  ".codex/scripts/publish-changes.mjs",
  ".codex/scripts/shared/command-runner.mjs",
  ".codex/scripts/shared/errors.mjs",
  ".codex/scripts/shared/gh-client.mjs",
  ".codex/scripts/shared/git-client.mjs",
  ".codex/scripts/shared/output-theme.mjs",
  ".codex/scripts/shared/output.mjs",
]);

const PUBLISH_PACKAGE_PREFIXES = Object.freeze([
  ".codex/skills/core/publish-current-branch/",
  ".codex/scripts/publish-changes/",
]);

function matchesTarget(target, exactTargets, prefixes) {
  return exactTargets.has(target) || prefixes.some((prefix) => target.startsWith(prefix));
}

export function payloadGroupFor(entry) {
  const target = entry.targetRelative;
  if (PROJECT_TEMPLATE_TARGETS.has(target)) return "project-templates";
  if (entry.category === "optional" || entry.sourceRelative?.startsWith("optional-skills/"))
    return "optional-skills";
  if (matchesTarget(target, PUBLISH_PACKAGE_TARGETS, PUBLISH_PACKAGE_PREFIXES))
    return "publish-package";
  if (target.startsWith(".codex/github-settings/")) return "github-setup";
  if (matchesTarget(target, COMMON_WORKFLOW_TARGETS, COMMON_WORKFLOW_PREFIXES))
    return "common-workflow";
  if (matchesTarget(target, DOCS_WRITING_TARGETS, DOCS_WRITING_PREFIXES))
    return "docs-writing-workflow";
  if (matchesTarget(target, CODE_WORKFLOW_TARGETS, CODE_WORKFLOW_PREFIXES)) return "code-workflow";
  return "unclassified";
}
