import { candidate } from "./contrast-candidate.mjs";
import { composite, contrast, minimumContrast, colorChange } from "./contrast-color.mjs";
import Color from "colorjs.io";

/** @param {unknown} value @param {string} message */
function assert(value, message) {
  if (!value) throw new Error(message);
}

Deno.test("contrast uses rendered alpha and requires an opaque background", () => {
  assert(contrast("#000", "#fff") === 21, "WCAG endpoints");
  assert(contrast("rgb(0 0 0 / 50%)", "#fff") < 4.5, "transparent ink must not pass as black");
  const stack = composite("rgb(0 0 0 / 50%)", composite("rgb(255 255 255 / 50%)", "#000"));
  assert(Math.abs((stack.coords[0] ?? 0) - 0.25) < 1e-8, "nested backgrounds use source-over");
  let rejected = false;
  try {
    contrast("#000", "rgb(255 255 255 / 50%)");
  } catch {
    rejected = true;
  }
  assert(rejected, "unresolved alpha cannot silently pass");
});

Deno.test(
  "candidate preserves passing colors and validates every background after serialization",
  () => {
    assert(
      candidate("#626b63", ["#fff", "#f7f8f6"]) === "#626b63",
      "passing ink remains unchanged",
    );
    const backgrounds = ["#fff", "#f0f4e8", "#edf7f2"];
    const css = candidate("#88b04b", backgrounds);
    assert(minimumContrast(css, backgrounds) >= 4.5, "all contexts must pass");
    const original = new Color("#88b04b").to("oklch");
    const corrected = new Color(css).to("oklch");
    assert(Math.abs((corrected.coords[2] ?? 0) - (original.coords[2] ?? 0)) < 1e-5, "keep hue");
    assert(
      (corrected.coords[1] ?? 0) <= (original.coords[1] ?? 0) + 1e-7,
      "do not increase chroma",
    );
    assert(corrected.inGamut("srgb", { epsilon: 0 }), "serialized CSS remains in sRGB");
  },
);

Deno.test("alpha and color difference are reported separately and impossible pairs fail", () => {
  const change = colorChange("rgb(0 0 0 / 40%)", "rgb(0 0 0 / 76%)");
  assert(
    change.deltaEOK === 0 && Math.abs(change.alphaChange - 0.36) < 1e-8,
    "alpha is not Delta E",
  );
  let rejected = false;
  try {
    candidate("#888", ["#000", "#fff"], 7);
  } catch {
    rejected = true;
  }
  assert(rejected, "conflicting backgrounds must fail explicitly");
});
