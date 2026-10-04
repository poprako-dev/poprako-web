/// <reference lib="dom" />
import Color from "colorjs.io";

/** @param {Element} element */
export function targetName(element) {
  return (
    `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}` +
    `[${element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 60) ?? ""}]`
  );
}

/** Glyph boxes are clipped to every scrolling ancestor and the viewport.
 * @param {Element} element
 */
export function textRects(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const rects = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(walker.currentNode);
    for (const rect of range.getClientRects()) {
      let left = Math.max(0, rect.left);
      let top = Math.max(0, rect.top);
      let right = Math.min(innerWidth, rect.right);
      let bottom = Math.min(innerHeight, rect.bottom);
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const clip = parent.getBoundingClientRect();
        if (/hidden|clip|scroll|auto/.test(style.overflowX)) {
          left = Math.max(left, clip.left);
          right = Math.min(right, clip.right);
        }
        if (/hidden|clip|scroll|auto/.test(style.overflowY)) {
          top = Math.max(top, clip.top);
          bottom = Math.min(bottom, clip.bottom);
        }
      }
      if (right > left && bottom > top)
        rects.push(new DOMRect(left, top, right - left, bottom - top));
    }
  }
  return rects;
}

/** Empty transparent hit boxes do not obscure pixels. Replaced content stays unknown.
 * @param {Element} element @param {number} x @param {number} y
 */
function paintsAt(element, x, y) {
  if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
  const style = getComputedStyle(element);
  if (
    new Color(style.backgroundColor).alpha > 0 ||
    style.backgroundImage !== "none" ||
    /^(IMG|SVG|CANVAS|VIDEO)$/.test(element.tagName)
  )
    return true;
  const rect = element.getBoundingClientRect();
  if (
    x < rect.left + Number.parseFloat(style.borderLeftWidth) ||
    x > rect.right - Number.parseFloat(style.borderRightWidth) ||
    y < rect.top + Number.parseFloat(style.borderTopWidth) ||
    y > rect.bottom - Number.parseFloat(style.borderBottomWidth)
  )
    return true;
  for (const child of element.childNodes) {
    if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(child);
    if (
      [...range.getClientRects()].some(
        (r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom,
      )
    )
      return true;
  }
  return style.boxShadow.includes("inset") || !["none", "blur(0px)"].includes(style.filter);
}

/** Probe paint order with only hit testing changed; restore the exact style immediately.
 * @param {Element} element @param {(plate: Element) => number} plateContrast
 */
export function occlusionEvidence(element, plateContrast) {
  const originalStyle = element.getAttribute("style");
  const originalAppearance = appearance(element);
  try {
    return textRects(element).map((rect) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (element instanceof HTMLElement)
        element.setAttribute("style", `${originalStyle ?? ""};pointer-events:auto!important`);
      if (appearance(element) !== originalAppearance)
        throw new Error(`Hit-testing probe changes appearance of ${targetName(element)}`);
      const stack = document.elementsFromPoint(x, y);
      const transparent = [];
      for (const top of stack) {
        if (element.contains(top) || top.contains(element)) {
          return { x, y, top: targetName(top), transparent };
        }
        if (!paintsAt(top, x, y)) {
          transparent.push(targetName(top));
          continue;
        }
        const plate = top.closest("[data-contrast-plate]");
        if (
          plate &&
          new Color(getComputedStyle(plate).backgroundColor).alpha === 1 &&
          opaqueAncestors(plate) &&
          plateContrast(plate) >= 4.5
        ) {
          return {
            x,
            y,
            top: targetName(top),
            transparent,
            proof: "covered pixels belong to an opaque, readable plate",
          };
        }
        throw new Error(`Unresolved occlusion of ${targetName(element)} by ${targetName(top)}`);
      }
      throw new Error(`No paint-order evidence for ${targetName(element)}`);
    });
  } finally {
    if (originalStyle === null) element.removeAttribute("style");
    else element.setAttribute("style", originalStyle);
  }
}

/** @param {Element} element */
function appearance(element) {
  const style = getComputedStyle(element);
  const bounds = element.getBoundingClientRect();
  return JSON.stringify([
    style.color,
    style.backgroundColor,
    style.backgroundImage,
    style.opacity,
    style.fontSize,
    style.fontWeight,
    style.fontFamily,
    style.lineHeight,
    style.filter,
    style.mixBlendMode,
    style.transform,
    style.clipPath,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
  ]);
}

/** @param {Element} element */
function opaqueAncestors(element) {
  for (let node = /** @type {Element | null} */ (element); node; node = node.parentElement) {
    if (Number(getComputedStyle(node).opacity) !== 1) return false;
  }
  return true;
}
