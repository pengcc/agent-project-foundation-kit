// Static capability taxonomy for reporting and explicit profile selection.
// Groups never classify ownership or authorize writes.

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

const PAYLOAD_GROUP_LABELS = Object.freeze({
  "project-templates": "Project templates",
  "common-workflow": "Common workflow",
  "docs-writing-workflow": "Docs / writing workflow",
  "code-workflow": "Code workflow",
  "publish-package": "Publish package",
  "github-setup": "GitHub setup",
  "optional-skills": "Optional skills",
  unclassified: "Unclassified",
});

export const BOOTSTRAP_CRITICAL_TARGETS = Object.freeze([
  ".codex/rules/agent-operating-contract.md",
  ".codex/rules/skill-and-output-efficiency.md",
  ".codex/rules/task-execution-classification.md",
  ".codex/skills/core/execute-plan/SKILL.md",
  ".codex/skills/meta/plan-with-context/SKILL.md",
]);

export const BOOTSTRAP_DEPENDENCY_GUARD_TARGETS = Object.freeze([
  ".codex/skills/meta/project-memory/SKILL.md",
  ".codex/skills/meta/grilling/SKILL.md",
]);

const BOOTSTRAP_REVIEW_CATEGORIES = new Set([
  "BLOCKED_MANUAL",
  "KIT_MANAGED_REPLACE",
  "MIXED_AGENT_MERGE",
]);

const REVIEW_CATEGORY_ORDER = Object.freeze([
  "KIT_MANAGED_REPLACE",
  "PROJECT_OWNED",
  "MIXED_AGENT_MERGE",
  "BLOCKED_MANUAL",
]);

const PROJECT_TEMPLATE_TARGETS = new Set([
  "AGENTS.md",
  ".codex/project/project-guideline.md",
  ".codex/project/project-decisions.md",
  ".codex/project/lessons-learned.md",
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

function isCurrentMapping(entry) {
  return entry.mappingState === undefined || entry.mappingState === "current";
}

export function payloadGroupFor(entry) {
  if (!isCurrentMapping(entry)) return "unclassified";

  const target = entry.targetRelative;
  if (PROJECT_TEMPLATE_TARGETS.has(target)) return "project-templates";
  if (entry.category === "optional" || entry.sourceRelative?.startsWith("optional-skills/")) {
    return "optional-skills";
  }
  if (matchesTarget(target, PUBLISH_PACKAGE_TARGETS, PUBLISH_PACKAGE_PREFIXES)) {
    return "publish-package";
  }
  if (target.startsWith(".codex/github-settings/")) return "github-setup";
  if (matchesTarget(target, COMMON_WORKFLOW_TARGETS, COMMON_WORKFLOW_PREFIXES)) {
    return "common-workflow";
  }
  if (matchesTarget(target, DOCS_WRITING_TARGETS, DOCS_WRITING_PREFIXES)) {
    return "docs-writing-workflow";
  }
  if (matchesTarget(target, CODE_WORKFLOW_TARGETS, CODE_WORKFLOW_PREFIXES)) {
    return "code-workflow";
  }
  return "unclassified";
}

export function isBootstrapCriticalTarget(targetRelative) {
  return BOOTSTRAP_CRITICAL_TARGETS.includes(targetRelative);
}

export function isBootstrapDependencyGuardTarget(targetRelative) {
  return BOOTSTRAP_DEPENDENCY_GUARD_TARGETS.includes(targetRelative);
}

function compactEntry(entry) {
  return Object.freeze({
    targetRelative: entry.targetRelative,
    resultCategory: entry.resultCategory,
    ownership: entry.ownership,
    kind: entry.kind,
    action: entry.action,
    optionalName: entry.optionalName ?? "",
  });
}

function emptyCategoryCounts() {
  return Object.fromEntries(REVIEW_CATEGORY_ORDER.map((category) => [category, 0]));
}

function isUnresolvedReviewEntry(entry, completed) {
  return (
    entry.resultCategory &&
    entry.resultCategory !== "SAFE_ADD" &&
    !completed.has(entry.targetRelative)
  );
}

export function buildPayloadGroupReport(entries, { completedTargets = [] } = {}) {
  const completed = new Set(completedTargets);
  const mutableGroups = new Map(
    PAYLOAD_GROUP_ORDER.map((id) => [
      id,
      {
        id,
        label: PAYLOAD_GROUP_LABELS[id],
        mappedCount: 0,
        categoryCounts: emptyCategoryCounts(),
        entries: [],
      },
    ]),
  );
  const projectOwnedPreserved = [];

  for (const entry of entries) {
    const group = mutableGroups.get(payloadGroupFor(entry));
    group.mappedCount += 1;
    if (!isUnresolvedReviewEntry(entry, completed)) continue;

    if (!Object.hasOwn(group.categoryCounts, entry.resultCategory)) {
      group.categoryCounts[entry.resultCategory] = 0;
    }
    group.categoryCounts[entry.resultCategory] += 1;
    const summaryEntry = compactEntry(entry);
    group.entries.push(summaryEntry);
    if (entry.resultCategory === "PROJECT_OWNED") {
      projectOwnedPreserved.push(summaryEntry);
    }
  }

  const groups = PAYLOAD_GROUP_ORDER.map((id) => {
    const group = mutableGroups.get(id);
    group.entries.sort((left, right) => left.targetRelative.localeCompare(right.targetRelative));
    return Object.freeze({
      id: group.id,
      label: group.label,
      mappedCount: group.mappedCount,
      unresolvedCount: group.entries.length,
      categoryCounts: Object.freeze({ ...group.categoryCounts }),
      entries: Object.freeze([...group.entries]),
    });
  });
  projectOwnedPreserved.sort((left, right) =>
    left.targetRelative.localeCompare(right.targetRelative),
  );

  return Object.freeze({
    groups: Object.freeze(groups),
    projectOwnedPreserved: Object.freeze(projectOwnedPreserved),
  });
}

export function buildBootstrapAdvisory({ entries, mode, effectiveProjectMode }) {
  if (mode !== "dry-run" || effectiveProjectMode !== "existing") {
    return Object.freeze({
      detected: false,
      criticalTargets: Object.freeze([]),
      dependencyGuardTargets: Object.freeze([]),
    });
  }

  const currentEntries = new Map(
    entries
      .filter((entry) => isCurrentMapping(entry))
      .map((entry) => [entry.targetRelative, entry]),
  );
  const criticalTargets = BOOTSTRAP_CRITICAL_TARGETS.filter((target) => {
    const entry = currentEntries.get(target);
    return (
      entry?.contentState === "existing-different" &&
      BOOTSTRAP_REVIEW_CATEGORIES.has(entry.resultCategory)
    );
  });
  if (!criticalTargets.length) {
    return Object.freeze({
      detected: false,
      criticalTargets: Object.freeze([]),
      dependencyGuardTargets: Object.freeze([]),
    });
  }

  const dependencyGuardTargets = BOOTSTRAP_DEPENDENCY_GUARD_TARGETS.filter((target) => {
    const entry = currentEntries.get(target);
    return entry && ["new", "existing-different"].includes(entry.contentState);
  });

  return Object.freeze({
    detected: true,
    criticalTargets: Object.freeze(criticalTargets),
    dependencyGuardTargets: Object.freeze(dependencyGuardTargets),
  });
}
