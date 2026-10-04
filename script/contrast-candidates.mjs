import { candidate } from "./contrast-candidate.mjs";
import { colorChange, minimumContrast } from "./contrast-color.mjs";
import { roles } from "./contrast-contract.mjs";

const output = new URL("../test-resource/generated/contrast/", import.meta.url);
await Deno.mkdir(output, { recursive: true });
const report = roles.map((role) => {
  const minimum = role.minimum ?? 4.5;
  const css = candidate(role.original, role.backgrounds, minimum);
  return {
    ...role,
    candidate: css,
    ...colorChange(role.original, css),
    beforeRatio: minimumContrast(role.original, role.backgrounds),
    afterRatio: minimumContrast(css, role.backgrounds),
    minimum,
  };
});
await Deno.writeTextFile(
  new URL("candidates.json", output),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report.map((row) => `${row.token}: ${row.candidate};`).join("\n"));
console.log("Validated suggestions only; application CSS was not changed.");
