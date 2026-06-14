import { readFile } from 'node:fs/promises';
import { PublishError } from '../shared/errors.mjs';

const CLASSIFICATIONS = ['small_safe', 'normal', 'significant'];
const POLICY_KEYS = [
  'allow_auto_merge',
  'allow_immediate_merge',
  'require_validation',
  'allow_not_run',
  'require_manual_review',
  'require_typed_confirmation',
  'poll_after_auto_merge',
  'refresh_default_branch_after_verified_merge',
];

export const DEFAULT_POLICY = Object.freeze({
  version: 1,
  classifications: {
    small_safe: {
      allow_auto_merge: true,
      allow_immediate_merge: false,
      require_validation: false,
      allow_not_run: false,
      require_manual_review: false,
      require_typed_confirmation: false,
      poll_after_auto_merge: true,
      refresh_default_branch_after_verified_merge: true,
    },
    normal: {
      allow_auto_merge: true,
      allow_immediate_merge: false,
      require_validation: true,
      allow_not_run: true,
      require_manual_review: true,
      require_typed_confirmation: true,
      poll_after_auto_merge: true,
      refresh_default_branch_after_verified_merge: true,
    },
    significant: {
      allow_auto_merge: false,
      allow_immediate_merge: false,
      require_validation: true,
      allow_not_run: false,
      require_manual_review: true,
      require_typed_confirmation: true,
      poll_after_auto_merge: true,
      refresh_default_branch_after_verified_merge: true,
    },
  },
});

function copyDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_POLICY));
}

export function validatePolicy(policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    throw new PublishError('MALFORMED_POLICY', 'Policy must be a YAML object.');
  }
  const rootKeys = Object.keys(policy);
  const unknownRoot = rootKeys.filter((key) => !['version', 'classifications'].includes(key));
  if (unknownRoot.length) {
    throw new PublishError('MALFORMED_POLICY', `Unknown policy key(s): ${unknownRoot.join(', ')}`);
  }
  if (policy.version !== 1) {
    throw new PublishError('MALFORMED_POLICY', `Unsupported policy version: ${policy.version}`);
  }
  if (!policy.classifications || typeof policy.classifications !== 'object') {
    throw new PublishError('MALFORMED_POLICY', 'Policy classifications are required.');
  }

  const unknownClassifications = Object.keys(policy.classifications).filter(
    (key) => !CLASSIFICATIONS.includes(key),
  );
  if (unknownClassifications.length) {
    throw new PublishError(
      'MALFORMED_POLICY',
      `Unknown classification(s): ${unknownClassifications.join(', ')}`,
    );
  }

  for (const classification of CLASSIFICATIONS) {
    const values = policy.classifications[classification];
    if (!values || typeof values !== 'object') {
      throw new PublishError('MALFORMED_POLICY', `Missing classification: ${classification}`);
    }
    const unknownKeys = Object.keys(values).filter((key) => !POLICY_KEYS.includes(key));
    if (unknownKeys.length) {
      throw new PublishError(
        'MALFORMED_POLICY',
        `Unknown ${classification} key(s): ${unknownKeys.join(', ')}`,
      );
    }
    for (const key of POLICY_KEYS) {
      if (typeof values[key] !== 'boolean') {
        throw new PublishError(
          'MALFORMED_POLICY',
          `${classification}.${key} must be a boolean.`,
        );
      }
    }
  }

  if (policy.classifications.significant.allow_not_run) {
    throw new PublishError('MALFORMED_POLICY', 'Significant updates cannot allow NOT_RUN.');
  }
  if (!policy.classifications.normal.require_validation) {
    throw new PublishError('MALFORMED_POLICY', 'Normal updates must require structured validation.');
  }
  if (!policy.classifications.significant.require_validation) {
    throw new PublishError(
      'MALFORMED_POLICY',
      'Significant updates must require structured validation.',
    );
  }
  if (!policy.classifications.significant.require_manual_review) {
    throw new PublishError(
      'MALFORMED_POLICY',
      'Significant updates must require manual review before scripted merge.',
    );
  }
  if (!policy.classifications.significant.require_typed_confirmation) {
    throw new PublishError(
      'MALFORMED_POLICY',
      'Significant updates must require typed merge confirmation.',
    );
  }
  for (const classification of ['normal', 'significant']) {
    const values = policy.classifications[classification];
    if ((values.allow_auto_merge || values.allow_immediate_merge) && !values.require_manual_review) {
      throw new PublishError(
        'MALFORMED_POLICY',
        `${classification} scripted merge modes must require manual review.`,
      );
    }
  }
  return policy;
}

export async function loadPolicy({
  path,
  output,
  readFileImpl = readFile,
  yamlLoader,
} = {}) {
  if (!path) return { policy: copyDefaults(), source: 'built-in' };

  let text;
  try {
    text = await readFileImpl(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      output?.warning(`Policy not found at ${path}; using built-in conservative defaults.`);
      return { policy: copyDefaults(), source: 'built-in-missing' };
    }
    throw new PublishError('MALFORMED_POLICY', `Could not read policy: ${error.message}`);
  }

  let parse = yamlLoader;
  if (parse === undefined) {
    try {
      ({ parse } = await import('yaml'));
    } catch {
      parse = null;
    }
  }
  if (!parse) {
    output?.warning(
      'YAML parser unavailable; external policy was ignored and conservative defaults are active.',
    );
    return { policy: copyDefaults(), source: 'built-in-no-yaml' };
  }

  try {
    return { policy: validatePolicy(parse(text)), source: path };
  } catch (error) {
    if (error instanceof PublishError) throw error;
    throw new PublishError('MALFORMED_POLICY', `Could not parse policy: ${error.message}`);
  }
}
