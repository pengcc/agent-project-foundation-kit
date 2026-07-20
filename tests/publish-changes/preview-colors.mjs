import { createOutput, OUTPUT_LEVELS } from "../../kit/repo-tools/scripts/shared/output.mjs";
import { loadOutputTheme } from "../../kit/repo-tools/scripts/shared/output-theme.mjs";

const themePath = new URL("../../kit/repo-tools/config/publish-cli-theme.json", import.meta.url);
const { theme, source, warning } = await loadOutputTheme({ path: themePath });
const output = createOutput({ verbose: true, theme });

if (warning) output.warning(warning);
output.info(`Theme source: ${source}`);

for (const level of OUTPUT_LEVELS) {
  const label = level[0] + level.slice(1).toLowerCase();
  output.write(level, `${label} label color preview`);
}

output.command("Command helper preview:", "pnpm pr:merge 101");
