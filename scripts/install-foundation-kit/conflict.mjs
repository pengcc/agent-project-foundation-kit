import { resolve } from 'node:path';

export async function reportConflicts({
  plan,
  kitRoot,
  targetRoot,
  output,
  showDiff,
  commandRunner,
}) {
  const conflicts = plan.entries.filter((entry) => entry.state === 'conflict');
  if (!conflicts.length) return;
  output.danger(`Conflict report: ${conflicts.length} existing target file(s).`);
  output.danger('Existing files require backup-and-replace authorization.');

  for (const entry of conflicts) {
    output.danger(
      `${entry.targetRelative} <- ${entry.sourceRelative} (${entry.contentState})`,
    );
    if (!showDiff) continue;
    const result = await commandRunner.run('diff', [
      '-u',
      resolve(targetRoot, entry.targetRelative),
      resolve(kitRoot, entry.sourceRelative),
    ]);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.exitCode === 0 || result.exitCode === 1) continue;
    output.warning(
      `diff -u preview unavailable for ${entry.targetRelative}; continuing without preview.`,
    );
  }
}
