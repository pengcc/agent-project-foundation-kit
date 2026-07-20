import { describe, expect, it, vi } from "vitest";
import { parseCliOptions } from "../../kit/repo-tools/scripts/publish-changes/cli-options.mjs";
import {
  assertSecretSafePublishScope,
  SECRET_FINDING_LEVEL,
  scanSecretSafety,
} from "../../kit/repo-tools/scripts/publish-changes/secret-safety.mjs";

function addedFileDiff(path, lines) {
  return [
    `diff --git a/${path} b/${path}`,
    `+++ b/${path}`,
    ...lines.map((line) => `+${line}`),
  ].join("\n");
}

function guardInput(diff, acknowledgeSecretReview = false) {
  return {
    git: { diff: vi.fn(async () => diff) },
    state: { hasUncommitted: false, compareRef: "origin/main" },
    confirmed: { head: { head: "confirmed-head" }, scope: { files: [] } },
    output: {
      step: vi.fn(),
      warning: vi.fn(),
      danger: vi.fn(),
      success: vi.fn(),
    },
    acknowledgeSecretReview,
  };
}

describe("publish secret safety scanning", () => {
  it("keeps dangerous paths and provider tokens as high-confidence blockers", () => {
    const providerToken = `sk-proj-${"A".repeat(24)}`;
    const findings = scanSecretSafety({
      files: [{ path: ".env", status: "A" }],
      diff: addedFileDiff("src/config.ts", [`export const token = "${providerToken}";`]),
    });

    expect(findings.map(({ rule }) => rule)).toEqual(
      expect.arrayContaining(["env-file", "openai-api-key"]),
    );
    expect(findings.every(({ level }) => level === SECRET_FINDING_LEVEL.HIGH_CONFIDENCE)).toBe(
      true,
    );
    expect(findings.every(({ preview }) => !preview.includes(providerToken))).toBe(true);
  });

  it("allows template paths, deleted paths, placeholders, and synthetic test passwords", () => {
    expect(
      scanSecretSafety({
        files: [
          { path: ".env.example", status: "A" },
          { path: ".env", status: "D" },
        ],
        diff: [
          addedFileDiff(".env.example", ['PASSWORD="documented-placeholder-value"']),
          addedFileDiff("src/__tests__/fixture.test.ts", [
            'const fixture = { password: "ValidPassword1" };',
          ]),
        ].join("\n"),
      }),
    ).toEqual([]);
  });

  it("classifies realistic hard-coded passwords and credential-bearing URLs as blockers", () => {
    const password = ["Correct", "Horse", "42!"].join("");
    const url = ["postgres://service:", password, "@db.example.test/app"].join("");
    const findings = scanSecretSafety({
      diff: addedFileDiff("src/config.ts", [
        `const password = "${password}";`,
        `const databaseUrl = "${url}";`,
      ]),
    });

    expect(findings.map(({ rule }) => rule)).toEqual(
      expect.arrayContaining(["hard-coded-password", "credential-bearing-url"]),
    );
    expect(findings.every(({ preview }) => preview === "[REDACTED]")).toBe(true);
  });

  it("requires explicit acknowledgement for generic credential literals", async () => {
    const value = ["opaque", "credential", "value", "42"].join("");
    const diff = addedFileDiff("src/config.ts", [`export const token = "${value}";`]);
    const unacknowledged = guardInput(diff);

    await expect(assertSecretSafePublishScope(unacknowledged)).rejects.toMatchObject({
      type: "SECRET_SAFETY_REVIEW_REQUIRED",
    });
    expect(unacknowledged.output.warning).toHaveBeenCalledWith(
      expect.stringContaining("[REDACTED]"),
    );
    expect(unacknowledged.output.warning.mock.calls.flat().join("\n")).not.toContain(value);

    const acknowledged = guardInput(diff, true);
    await expect(assertSecretSafePublishScope(acknowledged)).resolves.toMatchObject({
      reviewAcknowledged: true,
    });
  });

  it("detects unquoted env and YAML credential assignments", () => {
    const value = ["opaque", "credential", "value", "42"].join("");
    const findings = scanSecretSafety({
      diff: addedFileDiff("config/runtime.yml", [`TOKEN=${value}`, `token: ${value}`]),
    });

    expect(findings).toHaveLength(2);
    expect(findings.every(({ rule }) => rule === "generic-credential-literal")).toBe(true);
    expect(findings.every(({ level }) => level === SECRET_FINDING_LEVEL.REVIEW_REQUIRED)).toBe(
      true,
    );
    expect(findings.every(({ preview }) => preview === "[REDACTED]")).toBe(true);
  });

  it("retains unquoted placeholder, synthetic fixture, and high-confidence deduplication", () => {
    const providerToken = `sk-proj-${"A".repeat(24)}`;
    const findings = scanSecretSafety({
      diff: [
        addedFileDiff("src/config.ts", ["TOKEN=placeholder-value", `TOKEN=${providerToken}`]),
        addedFileDiff("tests/fixture.yml", ["password: ValidPassword1"]),
      ].join("\n"),
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      level: SECRET_FINDING_LEVEL.HIGH_CONFIDENCE,
      rule: "openai-api-key",
    });
  });

  it("never lets acknowledgement override a high-confidence finding", async () => {
    const password = ["Correct", "Horse", "42!"].join("");
    await expect(
      assertSecretSafePublishScope(
        guardInput(addedFileDiff("src/config.ts", [`const password = "${password}";`]), true),
      ),
    ).rejects.toMatchObject({ type: "SECRET_SAFETY_BLOCKED" });
  });

  it("scopes acknowledgement and standalone safety mode options", () => {
    expect(parseCliOptions(["--acknowledge-secret-review"]).acknowledgeSecretReview).toBe(true);
    expect(
      parseCliOptions(["--mode", "pr-review", "--acknowledge-secret-review"])
        .acknowledgeSecretReview,
    ).toBe(true);
    expect(() =>
      parseCliOptions(["--acknowledge-secret-review", "--acknowledge-secret-review"]),
    ).toThrow("only once");
    expect(() =>
      parseCliOptions(["--mode", "pr-merge", "12", "--acknowledge-secret-review"]),
    ).toThrow("publish or pr-review");
    expect(parseCliOptions(["--mode", "safety-guard"]).mode).toBe("safety-guard");
    expect(() => parseCliOptions(["--mode", "safety-guard", "--show-diff"])).toThrow(
      "only --verbose and --help",
    );
  });
});
