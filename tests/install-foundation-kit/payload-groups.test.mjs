import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildMappings } from "../../scripts/install-foundation-kit/mapping.mjs";
import {
  BOOTSTRAP_CRITICAL_TARGETS,
  BOOTSTRAP_DEPENDENCY_GUARD_TARGETS,
  buildBootstrapAdvisory,
  buildPayloadGroupReport,
  isBootstrapCriticalTarget,
  isBootstrapDependencyGuardTarget,
  PAYLOAD_GROUP_ORDER,
  payloadGroupFor,
} from "../../scripts/install-foundation-kit/payload-groups.mjs";

function entry(targetRelative, overrides = {}) {
  return {
    sourceRelative: `rules/${targetRelative.split("/").at(-1)}`,
    targetRelative,
    category: "rules",
    mappingState: "current",
    contentState: "existing-different",
    ownership: "kit-managed",
    kind: "reusable",
    action: "review",
    resultCategory: "BLOCKED_MANUAL",
    ...overrides,
  };
}

describe("installer payload reporting groups", () => {
  it.each([
    ["AGENTS.md", "project-templates"],
    [".codex/project/project-guideline.md", "project-templates"],
    [".codex/project/project-decisions.md", "project-templates"],
    [".codex/project/lessons-learned.md", "project-templates"],
    [".codex/rules/agent-operating-contract.md", "common-workflow"],
    [".codex/rules/task-and-change-safety-principles.md", "common-workflow"],
    [".codex/skills/meta/project-memory/SKILL.md", "common-workflow"],
    [".codex/skills/meta/plan-with-context/metadata.yml", "common-workflow"],
    [".codex/skills/meta/product-framing-review/SKILL.md", "common-workflow"],
    [".codex/prompts/force-execute-plan.md", "common-workflow"],
    [".codex/rules/docs-first-policy.md", "docs-writing-workflow"],
    [".codex/skills/meta/handoff/SKILL.md", "docs-writing-workflow"],
    [".codex/prompts/force-writing-great-skills.md", "docs-writing-workflow"],
    [".codex/rules/engineering-quality-principles.md", "code-workflow"],
    [".codex/skills/core/code-review/metadata.yml", "code-workflow"],
    [".codex/prompts/force-codebase-audit.md", "code-workflow"],
    [".codex/skills/core/publish-current-branch/SKILL.md", "publish-package"],
    [".codex/prompts/force-publish-current-branch.md", "publish-package"],
    [".codex/scripts/publish-changes.mjs", "publish-package"],
    [".codex/scripts/publish-changes/final-report.mjs", "publish-package"],
    [".codex/scripts/shared/output.mjs", "publish-package"],
    [".codex/config/publish-changes-policy.yml", "publish-package"],
    [".codex/config/publish-cli-theme.json", "publish-package"],
    [".codex/github-settings/general-settings.required.json", "github-setup"],
  ])("assigns %s exclusively to %s", (targetRelative, expectedGroup) => {
    expect(payloadGroupFor(entry(targetRelative))).toBe(expectedGroup);
  });

  it("assigns selected optional mappings without treating the installed namespace as generic", () => {
    expect(
      payloadGroupFor(
        entry(".codex/skills/engineering/react-component-patterns/SKILL.md", {
          sourceRelative: "optional-skills/react-component-patterns/SKILL.md",
          category: "optional",
          optionalName: "react-component-patterns",
        }),
      ),
    ).toBe("optional-skills");
    expect(payloadGroupFor(entry(".codex/skills/engineering/project-local/SKILL.md"))).toBe(
      "unclassified",
    );
  });

  it("uses the fallback for unknown current entries and all source-no-longer-mapped entries", () => {
    expect(payloadGroupFor(entry(".codex/rules/future-rule.md"))).toBe("unclassified");
    expect(payloadGroupFor(entry(".codex/scripts/future-workflow.mjs"))).toBe("unclassified");
    expect(
      payloadGroupFor(
        entry(".codex/rules/agent-operating-contract.md", {
          mappingState: "source-no-longer-mapped",
        }),
      ),
    ).toBe("unclassified");
  });

  it("covers every current real mapping, including both optional packages", async () => {
    const kitRoot = resolve(import.meta.dirname, "../../kit");
    const mappings = await buildMappings(kitRoot, {
      includeOptional: ["react-component-patterns", "tanstack-router-query-patterns"],
    });
    const assignments = mappings.map((mapping) => ({
      target: mapping.targetRelative,
      group: payloadGroupFor(mapping),
    }));

    expect(assignments.filter((assignment) => assignment.group === "unclassified")).toEqual([]);
    expect(new Set(assignments.map((assignment) => assignment.group))).toEqual(
      new Set(PAYLOAD_GROUP_ORDER.filter((group) => group !== "unclassified")),
    );
  });

  it("builds deterministic unresolved summaries without changing result categories", () => {
    const entries = [
      entry(".codex/rules/future-rule.md", { resultCategory: "BLOCKED_MANUAL" }),
      entry(".codex/skills/core/code-review/SKILL.md", {
        resultCategory: "MIXED_AGENT_MERGE",
        action: "agent-merge",
      }),
      entry(".codex/config/publish-changes-policy.yml", {
        resultCategory: "PROJECT_OWNED",
        ownership: "project-owned",
        kind: "project-config",
        action: "preserve",
      }),
      entry(".codex/rules/docs-first-policy.md", {
        contentState: "new",
        resultCategory: "SAFE_ADD",
        action: "write",
      }),
      entry("AGENTS.md", { resultCategory: "BLOCKED_MANUAL", action: "manual-merge" }),
      entry(".codex/skills/meta/project-memory/SKILL.md", {
        resultCategory: "KIT_MANAGED_REPLACE",
        action: "managed-replace-review",
      }),
    ].reverse();

    const report = buildPayloadGroupReport(entries, {
      completedTargets: ["AGENTS.md"],
    });
    expect(report.groups.map((group) => group.id)).toEqual(PAYLOAD_GROUP_ORDER);
    expect(report.groups.reduce((total, group) => total + group.unresolvedCount, 0)).toBe(4);
    expect(report.groups.find((group) => group.id === "project-templates")).toMatchObject({
      mappedCount: 1,
      unresolvedCount: 0,
    });
    expect(report.groups.find((group) => group.id === "common-workflow")).toMatchObject({
      unresolvedCount: 1,
      categoryCounts: { KIT_MANAGED_REPLACE: 1 },
      entries: [
        expect.objectContaining({
          targetRelative: ".codex/skills/meta/project-memory/SKILL.md",
          resultCategory: "KIT_MANAGED_REPLACE",
        }),
      ],
    });
    expect(report.groups.find((group) => group.id === "docs-writing-workflow")).toMatchObject({
      mappedCount: 1,
      unresolvedCount: 0,
    });
    expect(report.groups.find((group) => group.id === "code-workflow")).toMatchObject({
      categoryCounts: { MIXED_AGENT_MERGE: 1 },
    });
    expect(report.groups.find((group) => group.id === "unclassified")).toMatchObject({
      categoryCounts: { BLOCKED_MANUAL: 1 },
    });
    expect(report.projectOwnedPreserved).toEqual([
      expect.objectContaining({
        targetRelative: ".codex/config/publish-changes-policy.yml",
        resultCategory: "PROJECT_OWNED",
      }),
    ]);
  });

  it("detects the exact ordered bootstrap subset and secondary guards for existing dry-runs", () => {
    const entries = [
      ...BOOTSTRAP_CRITICAL_TARGETS.map((targetRelative, index) =>
        entry(targetRelative, {
          resultCategory: ["BLOCKED_MANUAL", "KIT_MANAGED_REPLACE", "MIXED_AGENT_MERGE"][index % 3],
        }),
      ),
      entry(BOOTSTRAP_DEPENDENCY_GUARD_TARGETS[0], {
        contentState: "new",
        resultCategory: "SAFE_ADD",
        action: "write",
      }),
      entry(BOOTSTRAP_DEPENDENCY_GUARD_TARGETS[1]),
    ].reverse();

    const advisory = buildBootstrapAdvisory({
      entries,
      mode: "dry-run",
      effectiveProjectMode: "existing",
    });
    expect(advisory).toEqual({
      detected: true,
      criticalTargets: BOOTSTRAP_CRITICAL_TARGETS,
      dependencyGuardTargets: BOOTSTRAP_DEPENDENCY_GUARD_TARGETS,
    });
    for (const target of BOOTSTRAP_CRITICAL_TARGETS) {
      expect(isBootstrapCriticalTarget(target)).toBe(true);
    }
    for (const target of BOOTSTRAP_DEPENDENCY_GUARD_TARGETS) {
      expect(isBootstrapDependencyGuardTarget(target)).toBe(true);
    }
  });

  it("does not trigger bootstrap advice for apply, new mode, guard-only, or safe-add states", () => {
    const guardOnly = BOOTSTRAP_DEPENDENCY_GUARD_TARGETS.map((targetRelative) =>
      entry(targetRelative),
    );
    const safeAddCritical = BOOTSTRAP_CRITICAL_TARGETS.map((targetRelative) =>
      entry(targetRelative, {
        contentState: "new",
        resultCategory: "SAFE_ADD",
        action: "write",
      }),
    );

    for (const input of [
      { entries: guardOnly, mode: "dry-run", effectiveProjectMode: "existing" },
      { entries: safeAddCritical, mode: "dry-run", effectiveProjectMode: "existing" },
      {
        entries: [entry(BOOTSTRAP_CRITICAL_TARGETS[0])],
        mode: "apply",
        effectiveProjectMode: "existing",
      },
      {
        entries: [entry(BOOTSTRAP_CRITICAL_TARGETS[0])],
        mode: "dry-run",
        effectiveProjectMode: "new",
      },
    ]) {
      expect(buildBootstrapAdvisory(input)).toEqual({
        detected: false,
        criticalTargets: [],
        dependencyGuardTargets: [],
      });
    }
  });
});
