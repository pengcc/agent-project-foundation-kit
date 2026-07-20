import { PublishError } from "../shared/errors.mjs";

const TEMPLATE_PATH_PATTERNS = [
  /(^|\/)\.env\.(example|sample|template)$/i,
  /\.(example|sample)(\/|$)/i,
  /\.(example|sample)$/i,
];

const DANGEROUS_PATH_RULES = [
  ["env-file", /(^|\/)\.env($|\.)/i],
  ["env-suffix-file", /(^|\/)[^/]+\.env$/i],
  ["private-key-file", /\.(pem|key)$/i],
  ["ssh-private-key-file", /(^|\/)(id_rsa|id_ed25519)$/],
  ["npmrc-token-file", /(^|\/)\.npmrc$/i],
  ["pypirc-token-file", /(^|\/)\.pypirc$/i],
  ["netrc-token-file", /(^|\/)\.netrc$/i],
  ["credentials-json-file", /(^|\/)credentials\.json$/i],
  ["service-account-json-file", /(^|\/)(service-account[^/]*|[^/]*-service-account)\.json$/i],
];

export const SECRET_FINDING_LEVEL = Object.freeze({
  HIGH_CONFIDENCE: "high-confidence blocker",
  REVIEW_REQUIRED: "review-required",
});

const HIGH_CONFIDENCE_CONTENT_RULES = [
  ["anthropic-api-key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
  ["openai-api-key", /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ["github-token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g],
  ["github-fine-grained-token", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ["slack-token", /\bxox[abpr]-[A-Za-z0-9-]{20,}\b/g],
  ["stripe-live-secret-key", /\b(?:sk_live|rk_live)_[A-Za-z0-9]{20,}\b/g],
  ["aws-access-key-id", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["google-api-key", /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ["private-key-block", /-----BEGIN [A-Z0-9 ]{0,40}PRIVATE KEY-----/g],
  [
    "credential-bearing-url",
    /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqps?|https?):\/\/[^\s:/@"']+:[^\s/@"']+@[^\s"'`]+/gi,
  ],
];

const CREDENTIAL_LITERAL_PATTERN =
  /(?:^|[\s,{;])(?:["'])?(api[_-]?key|secret|token|password)(?:["'])?\s*[:=]\s*(?:(["'])([^"'`\r\n]+)\2|(\$\{[^}\r\n]+})|(\$[A-Za-z_][A-Za-z0-9_]*)|([^\s"'`#]+))/gi;

const PLACEHOLDER_VALUE_PATTERN =
  /^(?:x+|_+|-+|\*+|<[^>]+>|\$\{[^}]+}|\$[A-Za-z_][A-Za-z0-9_]*|your[-_]?.*|example.*|sample.*|placeholder.*|dummy.*|fake.*|test.*|changeme|change-me|replace[_-]?me|redacted|not[_-]?a[_-]?secret)$/i;

export function isTemplatePath(path) {
  return TEMPLATE_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function redact() {
  return "[REDACTED]";
}

function isPlaceholderValue(value) {
  const normalized = value.trim().replace(/^["']|["']$/g, "");
  return PLACEHOLDER_VALUE_PATTERN.test(normalized);
}

function isSyntheticPasswordFixture(path, value) {
  const fixturePath = /(^|\/)(?:__tests__|tests?|fixtures?)(\/|$)|\.(?:test|spec)\.[^/]+$/i.test(
    path,
  );
  return fixturePath && /^(?:Valid|Example|Sample|Fake|Test)Password\d*[!@#$%^&*_-]*$/i.test(value);
}

function isRealisticPassword(value) {
  if (value.length < 12) return false;
  const characterClasses = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(value),
  ).length;
  return characterClasses >= 2 || value.length >= 20;
}

function isMeaningfulGenericCredential(value) {
  return value.length >= 12 && !isPlaceholderValue(value);
}

function matchesHighConfidenceContent(value) {
  return HIGH_CONFIDENCE_CONTENT_RULES.some(([, pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

function addFinding(findings, finding) {
  findings.push({
    ...finding,
    preview: finding.type === "path" ? "[path blocked]" : redact(),
  });
}

export function scanSecretSafety({ files = [], diff = "" } = {}) {
  const findings = [];
  for (const file of files) {
    const path = file.path || file;
    if (!path || isTemplatePath(path) || file.status === "D") continue;
    for (const [rule, pattern] of DANGEROUS_PATH_RULES) {
      if (pattern.test(path)) {
        addFinding(findings, {
          level: SECRET_FINDING_LEVEL.HIGH_CONFIDENCE,
          type: "path",
          path,
          rule,
        });
      }
    }
  }

  let currentPath = "";
  for (const rawLine of diff.split("\n")) {
    const diffMatch = rawLine.match(/^diff --git a\/.+ b\/(.+)$/);
    if (diffMatch) {
      currentPath = diffMatch[1];
      continue;
    }
    const fileMatch = rawLine.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      currentPath = fileMatch[1];
      continue;
    }
    if (!rawLine.startsWith("+") || rawLine.startsWith("+++ ")) continue;
    if (isTemplatePath(currentPath)) continue;
    const line = rawLine.slice(1);
    if (!line) continue;

    for (const [rule, pattern] of HIGH_CONFIDENCE_CONTENT_RULES) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        const value = match[1] || match[0];
        if (isPlaceholderValue(value)) continue;
        addFinding(findings, {
          level: SECRET_FINDING_LEVEL.HIGH_CONFIDENCE,
          type: "content",
          path: currentPath || "(diff)",
          rule,
        });
      }
    }

    CREDENTIAL_LITERAL_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(CREDENTIAL_LITERAL_PATTERN)) {
      const identifier = match[1].toLowerCase().replace(/[-_]/g, "");
      const value = (match[3] ?? match[4] ?? match[5] ?? match[6]).trim();
      if (isPlaceholderValue(value)) continue;
      if (matchesHighConfidenceContent(value)) continue;
      if (identifier === "password") {
        if (isSyntheticPasswordFixture(currentPath, value) || !isRealisticPassword(value)) {
          continue;
        }
        addFinding(findings, {
          level: SECRET_FINDING_LEVEL.HIGH_CONFIDENCE,
          type: "content",
          path: currentPath || "(diff)",
          rule: "hard-coded-password",
        });
        continue;
      }
      if (!isMeaningfulGenericCredential(value)) continue;
      addFinding(findings, {
        level: SECRET_FINDING_LEVEL.REVIEW_REQUIRED,
        type: "content",
        path: currentPath || "(diff)",
        rule: "generic-credential-literal",
      });
    }
  }

  return findings;
}

function renderFindings(findings) {
  return findings
    .map((finding) => `- ${finding.path}: ${finding.rule} (${finding.preview})`)
    .join("\n");
}

export async function assertSecretSafePublishScope({
  git,
  state,
  confirmed,
  output,
  acknowledgeSecretReview = false,
}) {
  output?.step("Secret safety guard");
  const diff = state.hasUncommitted
    ? await git.diff(["--cached", state.compareRef])
    : await git.diff([`${state.compareRef}...${confirmed.head.head}`]);
  return assertSecretSafeScope({
    files: confirmed.scope.files,
    diff,
    output,
    acknowledgeSecretReview,
  });
}

export async function assertSecretSafeScope({
  files = [],
  diff = "",
  output,
  acknowledgeSecretReview = false,
  standalone = false,
}) {
  const findings = scanSecretSafety({
    files,
    diff,
  });
  const highConfidenceFindings = findings.filter(
    (finding) => finding.level === SECRET_FINDING_LEVEL.HIGH_CONFIDENCE,
  );
  const reviewRequiredFindings = findings.filter(
    (finding) => finding.level === SECRET_FINDING_LEVEL.REVIEW_REQUIRED,
  );

  if (reviewRequiredFindings.length) {
    output?.warning(
      standalone
        ? [
            "Review-required credential-like values were found in the confirmed safety scope.",
            "Resolve them before continuing; safety:guard does not support acknowledgement.",
            renderFindings(reviewRequiredFindings),
          ].join("\n")
        : [
            "Review-required credential-like values were found in the confirmed publish scope.",
            "Review them locally. Continue only by explicitly supplying --acknowledge-secret-review.",
            renderFindings(reviewRequiredFindings),
          ].join("\n"),
    );
  }

  if (highConfidenceFindings.length) {
    const message = standalone
      ? [
          "Secret-safety guard blocked because the confirmed safety scope contains high-confidence secrets or dangerous credential paths.",
          "High-confidence findings cannot be overridden. Remove the secret from the scope and rotate it if necessary.",
          renderFindings(highConfidenceFindings),
        ].join("\n")
      : [
          "Publish blocked because the confirmed publish scope contains high-confidence secrets or dangerous credential paths.",
          "High-confidence findings cannot be overridden. Remove the secret from the publish scope and rotate it if necessary.",
          renderFindings(highConfidenceFindings),
        ].join("\n");
    output?.danger(message);
    throw new PublishError("SECRET_SAFETY_BLOCKED", message, {
      findings,
      highConfidenceFindings,
      reviewRequiredFindings,
    });
  }

  if (reviewRequiredFindings.length && !acknowledgeSecretReview) {
    const message = standalone
      ? [
          "Secret-safety guard blocked by review-required credential-like values.",
          "Replace them with scanner-safe fixtures or remove them from the scope before continuing.",
          renderFindings(reviewRequiredFindings),
        ].join("\n")
      : [
          "Publish blocked pending explicit review of credential-like values.",
          "After reviewing the redacted findings locally, rerun with --acknowledge-secret-review to continue.",
          renderFindings(reviewRequiredFindings),
        ].join("\n");
    throw new PublishError("SECRET_SAFETY_REVIEW_REQUIRED", message, {
      findings,
      highConfidenceFindings,
      reviewRequiredFindings,
    });
  }

  if (reviewRequiredFindings.length) {
    output?.success(
      "Review-required findings were explicitly acknowledged; secret scanning remained enabled.",
    );
  } else {
    output?.success(
      `No secret-safety findings detected in confirmed ${standalone ? "safety" : "publish"} scope.`,
    );
  }
  return {
    findings,
    highConfidenceFindings,
    reviewRequiredFindings,
    reviewAcknowledged: reviewRequiredFindings.length > 0 && acknowledgeSecretReview,
  };
}
