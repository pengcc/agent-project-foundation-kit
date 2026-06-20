import { resolve } from "node:path";

export async function reportConflicts({
  plan,
  kitRoot,
  targetRoot,
  output,
  showDiff,
  commandRunner,
  overwriteConflicts = false,
}) {
  output.info(
    `Plan: ${plan.writableNewFiles} safe new, ${plan.identicalFiles} identical, ` +
      `${plan.differentFiles} different, ${plan.migrationReviews} migration review, ${plan.total} total mapped file(s).`,
  );
  for (const entry of plan.entries) {
    if (entry.action === "skip-identical") {
      output.debug(`[SKIP] ${entry.targetRelative} (existing-identical)`);
      continue;
    }
    if (entry.action === "preserve") {
      output.info(`[PRESERVE] ${entry.targetRelative} (project-owned memory)`);
    } else if (entry.action === "manual-merge") {
      output.warning(`[MERGE] ${entry.targetRelative} differs; manual merge required.`);
    } else if (entry.action === "migration-review") {
      output.warning(
        `[MIGRATE] ${entry.targetRelative} conflicts with legacy kit-managed path ${entry.collisionPath}.`,
      );
    } else if (entry.action === "review") {
      const label = entry.ownership === "optional" ? "[OPTIONAL] [REVIEW]" : "[REVIEW]";
      const message = `${label} ${entry.targetRelative} differs from ${entry.sourceRelative}.`;
      if (overwriteConflicts) output.danger(message);
      else output.warning(message);
    } else if (entry.ownership === "optional") {
      output.info(`[OPTIONAL] [NEW] ${entry.targetRelative}`);
    } else {
      output.info(`[NEW] ${entry.targetRelative}`);
    }
    if (!showDiff || entry.contentState !== "existing-different") continue;
    const result = await commandRunner.run("diff", [
      "-u",
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
