import { createOutput, OUTPUT_LEVELS } from "../../kit/scripts/shared/output.mjs";
import { loadOutputTheme } from "../../kit/scripts/shared/output-theme.mjs";

const themePath = new URL("../../kit/config/publish-cli-theme.json", import.meta.url);
const { theme, source, warning } = await loadOutputTheme({ path: themePath });
const output = createOutput({ verbose: true, theme });

if (warning) output.warning(warning);
output.info(`Theme source: ${source}`);

for (const level of OUTPUT_LEVELS) {
  const label = level[0] + level.slice(1).toLowerCase();
  output.write(level, `${label} label color preview`);
}
