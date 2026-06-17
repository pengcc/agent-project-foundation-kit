import { PublishError } from '../shared/errors.mjs';

const TEMPLATE_PATH_PATTERNS = [
  /(^|\/)\.env\.(example|sample|template)$/i,
  /\.(example|sample)(\/|$)/i,
  /\.(example|sample)$/i,
];

const DANGEROUS_PATH_RULES = [
  ['env-file', /(^|\/)\.env($|\.)/i],
  ['env-suffix-file', /(^|\/)[^/]+\.env$/i],
  ['private-key-file', /\.(pem|key)$/i],
  ['ssh-private-key-file', /(^|\/)(id_rsa|id_ed25519)$/],
  ['npmrc-token-file', /(^|\/)\.npmrc$/i],
  ['pypirc-token-file', /(^|\/)\.pypirc$/i],
  ['netrc-token-file', /(^|\/)\.netrc$/i],
  ['credentials-json-file', /(^|\/)credentials\.json$/i],
  ['service-account-json-file', /(^|\/)(service-account[^/]*|[^/]*-service-account)\.json$/i],
];

const SECRET_CONTENT_RULES = [
  ['anthropic-api-key', /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
  ['openai-api-key', /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g],
  ['github-fine-grained-token', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ['slack-token', /\bxox[abpr]-[A-Za-z0-9-]{20,}\b/g],
  ['stripe-live-secret-key', /\b(?:sk_live|rk_live)_[A-Za-z0-9]{20,}\b/g],
  ['aws-access-key-id', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['private-key-block', /-----BEGIN [A-Z0-9 ]{0,40}PRIVATE KEY-----/g],
  [
    'credential-assignment',
    /\b(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD)\s*[:=]\s*["']?([^\s"'`#;]{12,})["']?/gi,
  ],
];

const PLACEHOLDER_VALUE_PATTERN =
  /^(?:x+|_+|-+|\*+|<[^>]+>|\$\{[^}]+}|your[-_]?.*|example.*|sample.*|placeholder.*|dummy.*|fake.*|test.*|changeme|change-me|replace[_-]?me|redacted|not[_-]?a[_-]?secret)$/i;

export function isTemplatePath(path) {
  return TEMPLATE_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function redact(value) {
  if (!value) return '[REDACTED]';
  if (value.length <= 8) return '[REDACTED]';
  return `${value.slice(0, 4)}...[REDACTED]...${value.slice(-4)}`;
}

function isPlaceholderValue(value) {
  const normalized = value.trim().replace(/^["']|["']$/g, '');
  return PLACEHOLDER_VALUE_PATTERN.test(normalized);
}

export function scanSecretSafety({ files = [], diff = '' } = {}) {
  const findings = [];
  for (const file of files) {
    const path = file.path || file;
    if (!path || isTemplatePath(path) || file.status === 'D') continue;
    for (const [rule, pattern] of DANGEROUS_PATH_RULES) {
      if (pattern.test(path)) {
        findings.push({
          type: 'path',
          path,
          rule,
          preview: '[path blocked]',
        });
      }
    }
  }

  let currentPath = '';
  for (const rawLine of diff.split('\n')) {
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
    if (!rawLine.startsWith('+') || rawLine.startsWith('+++ ')) continue;
    if (isTemplatePath(currentPath)) continue;
    const line = rawLine.slice(1);
    if (!line) continue;

    for (const [rule, pattern] of SECRET_CONTENT_RULES) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        const value = match[1] || match[0];
        if (isPlaceholderValue(value)) continue;
        findings.push({
          type: 'content',
          path: currentPath || '(diff)',
          rule,
          preview: redact(value),
        });
      }
    }
  }

  return findings;
}

function renderFindings(findings) {
  return findings
    .map(
      (finding) =>
        `- ${finding.path}: ${finding.rule} (${finding.preview})`,
    )
    .join('\n');
}

export async function assertSecretSafePublishScope({
  git,
  state,
  confirmed,
  output,
}) {
  output?.step('Secret safety guard');
  const diff = state.hasUncommitted
    ? await git.diff(['--cached', state.compareRef])
    : await git.diff([`${state.compareRef}...${confirmed.head.head}`]);
  const findings = scanSecretSafety({
    files: confirmed.scope.files,
    diff,
  });
  if (findings.length) {
    const message = [
      'Publish blocked because the confirmed publish scope contains possible secrets or dangerous credential paths.',
      'This lightweight guard can have false positives and false negatives. Review the files locally before publishing.',
      renderFindings(findings),
    ].join('\n');
    output?.danger(message);
    throw new PublishError('SECRET_SAFETY_BLOCKED', message, { findings });
  }
  output?.success('No high-confidence secrets detected in confirmed publish scope.');
  return { findings };
}
