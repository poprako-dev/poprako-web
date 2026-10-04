/** Machine-readable evidence is captured by contrast:check; no whitelist is consulted.
 * @param {string} storyId @param {unknown} evidence
 */
export function emitStoryEvidence(storyId, evidence) {
  if (typeof __CONTRAST_EVIDENCE__ !== "undefined" && __CONTRAST_EVIDENCE__) {
    console.warn("CONTRAST_STORY_EVIDENCE " + JSON.stringify({ storyId, evidence }));
  }
}
/// <reference path="./contrast-browser-globals.d.ts" />
