import Color from "colorjs.io";
import { apcach, apcachToCss, crToBg, maxChroma } from "apcach";
import { exactCss, minimumContrast } from "./contrast-color.mjs";

/**
 * Candidate generation only. Reparse the emitted CSS, then validate it independently.
 * Prefer unchanged passing colors, then fixed hue/chroma, then reduced chroma.
 * The bounded lightness search makes no claim of a global optimum.
 * @param {string} original @param {string[]} backgrounds @param {number} minimum
 * @param {"darker" | "lighter"} direction
 */
export function candidate(original, backgrounds, minimum = 4.5, direction = "darker") {
  const source = new Color(original);
  if (minimumContrast(source, backgrounds) >= minimum && source.inGamut("srgb", { epsilon: 0 })) {
    return original;
  }
  const target = minimum + 0.1;
  const [l, c, originalHue] = source.to("oklch").coords;
  const lightness = l ?? 0;
  const chroma = c ?? 0;
  const hue = originalHue !== null && Number.isFinite(originalHue) ? originalHue : 0;
  const seeds = backgrounds.map(
    (background) =>
      new Color(
        apcachToCss(
          apcach(
            crToBg(background, target, "wcag", direction),
            maxChroma(chroma),
            hue,
            100,
            "srgb",
          ),
          "oklch",
        ),
      ),
  );
  const chromas = [
    chroma,
    ...seeds.map((seed) => seed.to("oklch").coords[1] ?? 0),
    ...[0.99, 0.95, 0.9, 0.8, 0.65, 0.5, 0.25, 0].map((factor) => chroma * factor),
  ];
  const valid = [];
  for (const nextChroma of chromas) {
    if (!Number.isFinite(nextChroma) || nextChroma > chroma + 1e-7) continue;
    let previous = lightness;
    for (let step = 1; step <= 1000; step++) {
      const next =
        direction === "darker"
          ? lightness * (1 - step / 1000)
          : lightness + ((1 - lightness) * step) / 1000;
      const trial = new Color("oklch", [next, nextChroma, hue]);
      if (trial.inGamut("srgb", { epsilon: 0 }) && minimumContrast(trial, backgrounds) >= target) {
        let passing = next;
        let failing = previous;
        for (let iteration = 0; iteration < 30; iteration++) {
          const mid = (passing + failing) / 2;
          const refined = new Color("oklch", [mid, nextChroma, hue]);
          if (
            refined.inGamut("srgb", { epsilon: 0 }) &&
            minimumContrast(refined, backgrounds) >= target
          ) {
            passing = mid;
          } else failing = mid;
        }
        const css = exactCss(new Color("oklch", [passing, nextChroma, hue]));
        const serialized = new Color(css);
        if (
          serialized.inGamut("srgb", { epsilon: 0 }) &&
          minimumContrast(serialized, backgrounds) >= minimum
        ) {
          if (nextChroma === chroma) return css;
          valid.push(serialized);
        }
        break;
      }
      previous = next;
    }
  }
  valid.sort((a, b) => a.deltaEOK(source) - b.deltaEOK(source));
  if (!valid[0]) throw new Error(`No validated candidate for ${original}`);
  return exactCss(valid[0]);
}
