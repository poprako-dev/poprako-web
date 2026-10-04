import Color from "colorjs.io";

/** @param {string | Color} foreground @param {string | Color} background */
export function composite(foreground, background) {
  const front = new Color(foreground).to("srgb");
  const back = new Color(background).to("srgb");
  const alpha = front.alpha + back.alpha * (1 - front.alpha);
  const coords = /** @type {[number, number, number]} */ (
    [0, 1, 2].map((index) =>
      alpha === 0
        ? 0
        : ((front.coords[index] ?? 0) * front.alpha +
            (back.coords[index] ?? 0) * back.alpha * (1 - front.alpha)) /
          alpha,
    )
  );
  return new Color("srgb", coords, alpha);
}

/** @param {string | Color} foreground @param {string | Color} background */
export function contrast(foreground, background) {
  const back = new Color(background);
  if (back.alpha !== 1) throw new Error("Resolve the background stack before calculating contrast");
  return composite(foreground, back).contrast(back, "WCAG21");
}

/** @param {string | Color} color @param {string[]} backgrounds */
export function minimumContrast(color, backgrounds) {
  if (backgrounds.length === 0) throw new Error("A color role needs at least one background");
  return Math.min(...backgrounds.map((background) => contrast(color, background)));
}

/** @param {Color} color */
export function exactCss(color) {
  const [l, c, h] = color.to("oklch").coords;
  const lightness = l ?? 0;
  const chroma = c ?? 0;
  const hue = h ?? 0;
  return `oklch(${lightness.toFixed(9)} ${chroma.toFixed(9)} ${(Number.isFinite(hue)
    ? hue
    : 0
  ).toFixed(9)})`;
}

/** @param {string} before @param {string} after */
export function colorChange(before, after) {
  const original = new Color(before);
  const corrected = new Color(after);
  return {
    before,
    after,
    deltaEOK: corrected.deltaEOK(original),
    alphaChange: corrected.alpha - original.alpha,
    inSrgb: corrected.inGamut("srgb", { epsilon: 0 }),
  };
}
