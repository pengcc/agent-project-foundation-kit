import { createOutput, OUTPUT_LEVELS } from '../../kit/scripts/shared/output.mjs';

const output = createOutput({ verbose: true });

for (const level of OUTPUT_LEVELS) {
  const label = level[0] + level.slice(1).toLowerCase();
  output.write(level, `${label} label color preview`);
}
