/// <reference lib="dom" />
/// <reference path="../contrast-browser-globals.d.ts" />

/** Exercise the auditor's blind-spot handling in the real renderer.
 * @param {import("playwright").Page} page
 */
export async function checkContrastProofs(page) {
  await page.setContent(`<style>
body { background:white; color:black; margin:20px; font:16px monospace }
.group { opacity:.5; background:white } .underline { position:relative; padding:12px; display:inline-block }
.underline::after { content:""; position:absolute; bottom:0; left:0; width:50%; height:2px; background:black }
.covered { position:relative; width:300px; height:40px } .cover { position:absolute; inset:0; background:black; z-index:10 }
[data-sensitive][style] {color:white}
</style><div class="group"><div class="group"><span id="alpha">nested opacity</span></div></div>
<button class="underline"><span id="underline">readable label</span></button>
<div style="pointer-events:none"><span id="transparent-hitbox">visible tooltip</span></div>
<div style="background:linear-gradient(white,black)"><span id="gradient">unresolved gradient</span></div>
<div><span id="sensitive" data-sensitive>attribute-sensitive appearance</span></div>
<div class="covered"><span id="covered">occluded text</span><div class="cover"></div></div>`);
  return page.evaluate(() => {
    /** @param {string} id */
    function element(id) {
      const found = document.getElementById(id);
      if (!found) throw new Error(`Missing auditor fixture ${id}`);
      return found;
    }
    const pair = contrastAudit.renderedPair(element("alpha"), "black");
    const opacity = pair.foreground.to("srgb").coords[0];
    if (opacity === null || Math.abs(opacity - 0.75) > 1e-8)
      throw new Error("Group opacity was flattened incorrectly");
    const underline = contrastAudit.proveTextContrast(element("underline"));
    if (!underline.geometry.length)
      throw new Error("Underline needs an explicit disjoint-geometry proof");
    const tooltip = element("transparent-hitbox");
    const before = tooltip.getAttribute("style");
    contrastAudit.proveTextContrast(tooltip);
    if (tooltip.getAttribute("style") !== before)
      throw new Error("Hit-testing probe leaked a style override");
    for (const id of ["alpha", "gradient", "covered", "sensitive"]) {
      let rejected = false;
      try {
        contrastAudit.proveTextContrast(element(id));
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error(`Unresolved or failing text was accepted: ${id}`);
    }
    return {
      nestedGroupOpacity: true,
      underlineGeometry: true,
      pointerTransparentText: true,
      failuresRejected: ["alpha", "gradient", "covered", "sensitive"],
    };
  });
}
