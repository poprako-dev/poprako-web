/// <reference lib="dom" />
import Color from "colorjs.io";
import { composite, contrast } from "./contrast-color.mjs";
import { targetName, textRects, occlusionEvidence } from "./contrast-visibility.mjs";

export async function settleContrastState() {
  for (let pass = 0; pass < 3; pass++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    for (const animation of document.getAnimations()) {
      const end = animation.effect?.getComputedTiming().endTime;
      if (
        typeof end === "number" &&
        Number.isFinite(end) &&
        animation.playState === "running" &&
        animation.playbackRate !== 0
      )
        animation.finish();
    }
  }
}

/** @param {Color} color @param {number} opacity */
function fade(color, opacity) {
  const faded = new Color(color);
  faded.alpha *= opacity;
  return faded;
}

/** Resolve group opacity after compositing each subtree, never as text alpha alone.
 * @param {Element} element @param {string} ink
 */
export function renderedPair(element, ink) {
  let foreground = new Color(ink);
  let background = new Color("transparent");
  const uncertainties = [];
  for (let node = /** @type {Element | null} */ (element); node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (background.alpha < 1 && style.backgroundImage !== "none") {
      uncertainties.push(`background image on ${targetName(node)}`);
    }
    const layer = new Color(style.backgroundColor);
    foreground = composite(foreground, layer);
    background = composite(background, layer);
    const opacity = Number(style.opacity);
    foreground = fade(foreground, opacity);
    background = fade(background, opacity);
    const externalShadow = layer.alpha === 1 && /^(?:drop-shadow\([^;]+\)\s*)+$/.test(style.filter);
    const identityFilter = style.filter === "none" || style.filter === "blur(0px)";
    if ((!identityFilter && !externalShadow) || style.mixBlendMode !== "normal") {
      uncertainties.push(
        `filter/blend on ${targetName(node)}: ${style.filter}, ${style.mixBlendMode}`,
      );
    }
  }
  foreground = composite(foreground, "#fff");
  background = composite(background, "#fff");
  return { foreground, background, uncertainties };
}

/** The only pseudo-element proof is a bottom underline, disjoint from every glyph box.
 * Arbitrary pseudo positioning/occlusion stays unresolved and fails the audit.
 * @param {Element} element
 */
function pseudoEvidence(element) {
  const evidence = [];
  for (let node = /** @type {Element | null} */ (element); node; node = node.parentElement) {
    for (const pseudo of ["::before", "::after"]) {
      const style = getComputedStyle(node, pseudo);
      if (style.content === "none" || style.content === "normal" || style.display === "none")
        continue;
      const bounds = node.getBoundingClientRect();
      const height = Number.parseFloat(style.height);
      const bottom = Number.parseFloat(style.bottom);
      const rects = textRects(element);
      if (
        style.position !== "absolute" ||
        !Number.isFinite(height) ||
        !Number.isFinite(bottom) ||
        rects.length === 0 ||
        rects.some((rect) => rect.bottom >= bounds.bottom - bottom - height)
      ) {
        throw new Error(`Unresolved pseudo-element ${pseudo} on ${targetName(node)}`);
      }
      evidence.push({
        target: targetName(node),
        pseudo,
        glyphBottom: Math.max(...rects.map((r) => r.bottom)),
        decorationTop: bounds.bottom - bottom - height,
      });
    }
  }
  return evidence;
}

/** @param {Element} element */
export function proveTextContrast(element) {
  const modal = [...document.querySelectorAll("[role=dialog][aria-modal=true]")]
    .filter((dialog) => dialog.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
    .at(-1);
  if (modal && !modal.contains(element) && !element.closest("[role=alert],[aria-live]")) {
    return {
      target: targetName(element),
      foreground: "inactive modal background",
      background: "inactive modal background",
      ratio: null,
      minimum: null,
      geometry: [{ activeModal: targetName(modal), inactive: true }],
      occlusion: [],
    };
  }
  const style = getComputedStyle(element);
  const pair = renderedPair(element, style.color);
  if (pair.uncertainties.length > 0) throw new Error(pair.uncertainties.join("; "));
  const size = Number.parseFloat(style.fontSize);
  const bold = Number.parseInt(style.fontWeight) >= 700;
  const minimum = size >= 24 || (bold && size >= 18.6667) ? 3 : 4.5;
  const ratio = contrast(pair.foreground, pair.background);
  const geometry = pseudoEvidence(element);
  const occlusion = occlusionEvidence(element, (plate) => {
    const pair = renderedPair(plate, getComputedStyle(plate).color);
    return pair.uncertainties.length ? 0 : contrast(pair.foreground, pair.background);
  });
  if (ratio < minimum) throw new Error(`${targetName(element)}: ${ratio.toFixed(3)} < ${minimum}`);
  return {
    target: targetName(element),
    foreground: pair.foreground.toString(),
    background: pair.background.toString(),
    ratio,
    minimum,
    geometry,
    occlusion,
  };
}

/** @param {import("axe-core").AxeResults} results */
export function resolveIncompleteContrast(results) {
  const proofs = [];
  const unresolved = [];
  for (const rule of results.incomplete.filter((entry) => entry.id === "color-contrast")) {
    for (const node of rule.nodes) {
      try {
        if (node.target.length !== 1 || typeof node.target[0] !== "string") {
          throw new Error("Nested/shadow target requires an explicit audit");
        }
        const element = document.querySelector(node.target[0]);
        if (!element) throw new Error(`Missing axe target ${node.target[0]}`);
        proofs.push(proveTextContrast(element));
      } catch (error) {
        unresolved.push({ target: node.target, message: String(error) });
      }
    }
  }
  return { proofs, unresolved };
}

/** Necessary controls/icons are declared at their owning components; decoration is excluded.
 * @param {Document | Element} root
 */
export function auditNonText(root = document) {
  const pairs = [];
  const failures = [];
  const elements = new Set(root.querySelectorAll("[data-contrast]"));
  for (const field of root.querySelectorAll("input,textarea,select")) {
    if (Number.parseFloat(getComputedStyle(field).borderTopWidth) > 0) elements.add(field);
  }
  for (const icon of root.querySelectorAll(
    "button[aria-label] svg,button[title] svg,[role=img] svg",
  ))
    elements.add(icon);
  for (const element of elements) {
    const bounds = element.getBoundingClientRect();
    if (
      !bounds.width ||
      !bounds.height ||
      !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) ||
      element.closest(":disabled,[aria-disabled=true],[inert]")
    )
      continue;
    const style = getComputedStyle(element);
    const kind =
      element.getAttribute("data-contrast") ??
      (element.matches("input,textarea,select") ? "border" : "icon");
    const color =
      kind === "border"
        ? style.borderTopColor
        : kind === "fill"
          ? style.backgroundColor
          : style.color;
    const pair = renderedPair(
      kind === "fill" ? (element.parentElement ?? element) : element,
      color,
    );
    const ratio = contrast(pair.foreground, pair.background);
    const record = {
      target: targetName(element),
      kind,
      color,
      background: pair.background.toString(),
      ratio,
      minimum: 3,
      uncertainties: pair.uncertainties,
    };
    pairs.push(record);
    if (ratio < 3 || pair.uncertainties.length) failures.push(record);
    if (kind === "border" && element.parentElement) {
      const outside = renderedPair(element.parentElement, color);
      const outer = {
        ...record,
        kind: "border-outside",
        background: outside.background.toString(),
        ratio: contrast(outside.foreground, outside.background),
        uncertainties: outside.uncertainties,
      };
      pairs.push(outer);
      if (outer.ratio < 3 || outside.uncertainties.length) failures.push(outer);
    }
  }
  const active = document.activeElement;
  if (active && active.matches(":focus-visible") && active !== document.body) {
    const style = getComputedStyle(active);
    const outline = fade(new Color(style.outlineColor), Number(style.opacity));
    const pair = renderedPair(active.parentElement ?? active, outline.toString());
    // A white separator and dark outline provide a visible edge on light and dark surfaces.
    const darkRatio = contrast(pair.foreground, pair.background);
    const white = fade(new Color("#fff"), Number(style.opacity));
    const lightPair = renderedPair(active.parentElement ?? active, white.toString());
    const lightRatio = contrast(lightPair.foreground, lightPair.background);
    const width = Number.parseFloat(style.outlineWidth);
    const separator = style.boxShadow.includes("rgb(255, 255, 255)");
    const record = {
      target: targetName(active),
      kind: "focus",
      color: style.outlineColor,
      background: pair.background.toString(),
      ratio: separator ? Math.max(darkRatio, lightRatio) : darkRatio,
      minimum: 3,
      uncertainties: pair.uncertainties,
    };
    pairs.push(record);
    if (style.outlineStyle === "none" || width < 2 || record.ratio < 3 || pair.uncertainties.length)
      failures.push(record);
  }
  return { pairs, failures };
}
