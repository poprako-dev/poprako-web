import { normalizeUnitIndexes, type UnitInfo } from "../unit/unit";
import { buildUnitDiff } from "./unit-diff";

function mergeFields(base: UnitInfo, local: UnitInfo, remote: UnitInfo): UnitInfo {
  const translationChanged = local.translatedText !== base.translatedText;
  const revisionChanged = local.proofreadText !== base.proofreadText;
  return {
    ...remote,
    xCoord: local.xCoord === base.xCoord ? remote.xCoord : local.xCoord,
    yCoord: local.yCoord === base.yCoord ? remote.yCoord : local.yCoord,
    isBubble: local.isBubble === base.isBubble ? remote.isBubble : local.isBubble,
    isFlagged: local.isFlagged === base.isFlagged ? remote.isFlagged : local.isFlagged,
    isProofread: local.isProofread === base.isProofread ? remote.isProofread : local.isProofread,
    translatedText: translationChanged ? local.translatedText : remote.translatedText,
    translatorId: translationChanged ? local.translatorId : remote.translatorId,
    translatorCommnet: translationChanged ? local.translatorCommnet : remote.translatorCommnet,
    proofreadText: revisionChanged ? local.proofreadText : remote.proofreadText,
    proofreaderId: revisionChanged ? local.proofreaderId : remote.proofreaderId,
    proofreaderComment: revisionChanged ? local.proofreaderComment : remote.proofreaderComment,
  };
}
/** Preserve input made during asynchronous work without replaying bundled HTTP fields. */
export function mergeUnitVersions(
  base: UnitInfo[],
  local: UnitInfo[],
  remote: UnitInfo[],
): UnitInfo[] {
  const bases = new Map(base.map((u) => [u.id, u]));
  const locals = new Map(local.map((u) => [u.id, u]));
  const merged = remote.flatMap((u) => {
    const before = bases.get(u.id),
      current = locals.get(u.id);
    if (before && !current) return [];
    return [before && current ? mergeFields(before, current, u) : u];
  });
  for (const u of local) {
    const before = bases.get(u.id);
    if (!merged.some((r) => r.id === u.id) && (!before || buildUnitDiff([u], [before]).ops.length))
      merged.push(u);
  }
  const oldOrder = base.filter((u) => locals.has(u.id)).map((u) => u.id);
  const newOrder = local.filter((u) => bases.has(u.id)).map((u) => u.id);
  if (local.some((u) => !bases.has(u.id)) || oldOrder.some((id, i) => id !== newOrder[i])) {
    let anchor: string | undefined;
    for (const u of [...local].reverse()) {
      const index = merged.findIndex((r) => r.id === u.id);
      if (index < 0) continue;
      const moved = merged.splice(index, 1)[0];
      if (!moved) continue;
      const next = merged.findIndex((r) => r.id === anchor);
      merged.splice(next < 0 ? merged.length : next, 0, moved);
      anchor = u.id;
    }
  }
  return normalizeUnitIndexes(merged);
}
