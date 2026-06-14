import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PublishError } from '../shared/errors.mjs';

const YES = new Set(['y', 'yes']);
const NO = new Set(['', 'n', 'no']);

export async function confirmWithRetry({
  ask,
  warning,
  message,
  maxInvalidAttempts = 2,
}) {
  let invalidAttempts = 0;
  while (invalidAttempts < maxInvalidAttempts) {
    const answer = (await ask(`${message} [y/N] `)).trim().toLowerCase();
    if (YES.has(answer)) return true;
    if (NO.has(answer)) return false;
    invalidAttempts += 1;
    warning(
      `Invalid response "${answer}". Enter y/yes or n/no; empty input defaults to no.`,
    );
  }
  throw new PublishError(
    'USER_CANCELLED',
    `Cancelled after ${maxInvalidAttempts} invalid confirmation responses.`,
  );
}

export function createPrompts({
  inputStream = input,
  outputStream = output,
  formatPrompt = (message) => `[PROMPT] ${message}`,
  warning = (message) => outputStream.write(`[WARNING] ${message}\n`),
} = {}) {
  const readline = createInterface({ input: inputStream, output: outputStream });
  const question = (message) => readline.question(formatPrompt(message));
  return {
    async ask(message) {
      return (await question(message)).trim();
    },
    async confirm(message) {
      return confirmWithRetry({ ask: question, warning, message });
    },
    async typed(message, expected) {
      const answer = await question(`${message}\nType ${expected} to continue: `);
      return answer.trim() === expected;
    },
    close() {
      readline.close();
    },
  };
}

export async function chooseClassification(prompts, recommended = 'normal') {
  const answer = await prompts.ask(
    `Choose update type: 1) Small safe 2) Normal 3) Significant (recommended: ${recommended}) `,
  );
  const mapping = {
    '1': 'small_safe',
    SMALL_SAFE: 'small_safe',
    '2': 'normal',
    NORMAL: 'normal',
    '': recommended,
    '3': 'significant',
    SIGNIFICANT: 'significant',
  };
  const choice = mapping[answer] ?? mapping[answer.toUpperCase()];
  if (!choice) throw new PublishError('USER_CANCELLED', 'Invalid update classification.');
  return choice;
}

export async function chooseValidation(prompts, classification, classificationPolicy) {
  if (classification === 'small_safe') return 'SMALL_SAFE_SCOPE_CONFIRMED';
  if (!classificationPolicy.require_validation) {
    throw new PublishError(
      'POLICY_BLOCKED',
      `${classification} updates cannot skip structured validation.`,
    );
  }
  const allowed = ['DOC_REVIEWED', 'CHECK_PASSED', 'MANUAL_REVIEWED', 'MANUAL_TESTED'];
  if (classificationPolicy.allow_not_run) allowed.push('NOT_RUN');
  const answer = (await prompts.ask(`Type validation code (${allowed.join(', ')}): `)).toUpperCase();
  if (!allowed.includes(answer)) {
    throw new PublishError('POLICY_BLOCKED', `Invalid validation code: ${answer || '<empty>'}`);
  }
  return answer;
}

export async function chooseCompletionMode(
  prompts,
  classification,
  classificationPolicy,
  output,
) {
  const label = classification.toUpperCase();
  const choices = ['1) PR only'];
  if (classificationPolicy.allow_auto_merge) choices.push('2) Enable auto-merge with squash');
  else output?.info(`Auto-merge disabled by policy for ${label}.`);
  if (classificationPolicy.allow_immediate_merge) choices.push('3) Merge immediately with squash');
  else output?.info(`Immediate merge disabled by policy for ${label}.`);
  const answer = await prompts.ask(`Choose completion mode: ${choices.join('  ')} `);
  if (answer === '' || answer === '1') return 'pr_only';
  if (answer === '2' && classificationPolicy.allow_auto_merge) return 'auto';
  if (answer === '3' && classificationPolicy.allow_immediate_merge) return 'immediate';
  if (answer === '2') {
    throw new PublishError('POLICY_BLOCKED', `Auto-merge disabled by policy for ${label}.`);
  }
  if (answer === '3') {
    throw new PublishError('POLICY_BLOCKED', `Immediate merge disabled by policy for ${label}.`);
  }
  throw new PublishError(
    'USER_CANCELLED',
    `Invalid completion mode "${answer || '<empty>'}".`,
  );
}
