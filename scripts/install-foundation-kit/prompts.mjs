import { createInterface } from 'node:readline/promises';
import { InstallerError } from './errors.mjs';

export const CONFIRM_TOKEN = 'INSTALL_WITH_BACKUP';

export function createInstallerPrompts({
  input = process.stdin,
  output = process.stdout,
  formatPrompt = (message) => message,
} = {}) {
  const readline = createInterface({
    input,
    output,
    terminal: Boolean(input.isTTY && output.isTTY),
  });
  return {
    async confirmBackup() {
      const answer = await readline.question(
        formatPrompt(`Type ${CONFIRM_TOKEN} to continue: `),
      );
      if (answer !== CONFIRM_TOKEN) {
        throw new InstallerError(
          'USER_CANCELLED',
          'Confirmation token did not match. Aborting without changes.',
        );
      }
      return true;
    },
    close() {
      readline.close();
    },
  };
}
