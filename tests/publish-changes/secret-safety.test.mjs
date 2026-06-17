import { describe, expect, it } from 'vitest';
import { scanSecretSafety } from '../../kit/scripts/publish-changes/secret-safety.mjs';

function token(prefix, length = 24) {
  return `${prefix}${'A'.repeat(length)}`;
}

function diffFor(path, line) {
  return [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    '@@ -0,0 +1 @@',
    `+${line}`,
  ].join('\n');
}

function deletionDiffFor(path, line) {
  return [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    '@@ -1 +0,0 @@',
    `-${line}`,
  ].join('\n');
}

describe('publish secret safety scanning', () => {
  it('blocks dangerous credential file paths', () => {
    const findings = scanSecretSafety({
      files: [
        { status: 'A', path: '.env' },
        { status: 'A', path: 'config/service-account-prod.json' },
        { status: 'A', path: 'secrets/id_ed25519' },
      ],
      diff: '',
    });

    expect(findings.map((finding) => finding.rule)).toEqual(
      expect.arrayContaining([
        'env-file',
        'service-account-json-file',
        'ssh-private-key-file',
      ]),
    );
  });

  it('allows obvious template credential paths', () => {
    const findings = scanSecretSafety({
      files: [
        { status: 'A', path: '.env.example' },
        { status: 'A', path: '.env.sample' },
        { status: 'A', path: 'docs/config.example' },
      ],
      diff: '',
    });

    expect(findings).toEqual([]);
  });

  it('allows deleting dangerous credential file paths', () => {
    const findings = scanSecretSafety({
      files: [{ status: 'D', path: '.env' }],
      diff: '',
    });

    expect(findings).toEqual([]);
  });

  it('detects high-confidence provider token patterns without exposing full values', () => {
    const value = token('github_pat_', 32);
    const findings = scanSecretSafety({
      files: [{ status: 'M', path: 'src/config.js' }],
      diff: diffFor('src/config.js', `const value = "${value}";`),
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      path: 'src/config.js',
      rule: 'github-fine-grained-token',
    });
    expect(findings[0].preview).not.toContain(value);
  });

  it('does not scan deleted diff lines for content findings', () => {
    const value = token('ghp_', 24);
    const findings = scanSecretSafety({
      files: [{ status: 'M', path: 'src/config.js' }],
      diff: deletionDiffFor('src/config.js', `const value = "${value}";`),
    });

    expect(findings).toEqual([]);
  });

  it('classifies Anthropic keys before generic OpenAI-style keys', () => {
    const value = token('sk-ant-', 24);
    const findings = scanSecretSafety({
      files: [{ status: 'M', path: 'src/config.js' }],
      diff: diffFor('src/config.js', `const value = "${value}";`),
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      path: 'src/config.js',
      rule: 'anthropic-api-key',
    });
  });

  it('allows placeholder credential assignments', () => {
    const findings = scanSecretSafety({
      files: [{ status: 'M', path: 'README.md' }],
      diff: diffFor('README.md', 'API_KEY=your_api_key_here'),
    });

    expect(findings).toEqual([]);
  });

  it('detects non-placeholder credential assignments', () => {
    const value = token('prod_', 24);
    const findings = scanSecretSafety({
      files: [{ status: 'M', path: 'src/config.js' }],
      diff: diffFor('src/config.js', `API_KEY=${value}`),
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      path: 'src/config.js',
      rule: 'credential-assignment',
    });
    expect(findings[0].preview).not.toContain(value);
  });
});
