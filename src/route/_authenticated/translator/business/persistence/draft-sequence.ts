import type { UnitInfo } from "../unit/unit";
import { normalizeUnitIndexes } from "../unit/unit";
import type { UnitDiff } from "../contract/type";
import { identifyDraft, identifyUnits, unitIdentityResolver } from "./unit-identity";
import type { DraftRecord, SaveBatch } from "./draft-record";

/** Replay uses logical IDs. A repeated creation replaces its local projection. */
export function replayEdits(
  units: UnitInfo[],
  diff: UnitDiff,
  target: UnitInfo[] = [],
  resolve: (id: string) => string = (id) => id,
): UnitInfo[] {
  let result = identifyUnits(units, resolve);
  target = identifyUnits(target, resolve);
  const hidden = new Set<string>();
  // Match the server: register every creation before applying ordered edits.
  for (const op of diff.ops) {
    if (op.edit !== "create" || result.some((u) => u.id === resolve(op.localId))) continue;
    result.push({
      id: resolve(op.localId),
      index: result.length,
      ...op.coord,
      isBubble: op.isBubble,
      isFlagged: op.isFlagged,
      isProofread: op.revision?.isProofread ?? false,
    });
  }
  for (const op of diff.ops) {
    const id = resolve(op.edit === "create" ? op.localId : op.id);
    // A patch restores a tombstone on the server. Retain the corresponding local
    // row too, when an earlier independent batch deleted it from the projection.
    const before = result.find((u) => u.id === id) ?? target.find((u) => u.id === id);
    if (op.edit === "delete") {
      hidden.add(id);
      continue;
    }
    hidden.delete(id);
    let unit: UnitInfo;
    if (op.edit === "create") {
      unit = {
        id,
        index: 0,
        ...op.coord,
        isBubble: op.isBubble,
        isFlagged: op.isFlagged,
        isProofread: op.revision?.isProofread ?? false,
        translatedText: op.translation?.translatedText,
        proofreadText: op.revision?.proofreadText,
      };
    } else {
      if (!before) continue;
      unit = {
        ...before,
        ...op.coord,
        isBubble: op.isBubble ?? before.isBubble,
        isFlagged: op.isFlagged ?? before.isFlagged,
      };
      if (op.translation.type !== "skip")
        unit = {
          ...unit,
          translatedText:
            op.translation.type === "assign" ? op.translation.value.translatedText : undefined,
        };
      if (op.revision.type !== "skip")
        unit = {
          ...unit,
          isProofread: op.revision.type === "assign" ? op.revision.value.isProofread : false,
          proofreadText:
            op.revision.type === "assign" ? op.revision.value.proofreadText : undefined,
        };
    }
    const oldIndex = result.findIndex((u) => u.id === id);
    result = result.filter((u) => u.id !== id);
    const skip = op.edit === "patch" && op.nextId.type === "skip";
    const next =
      op.edit === "create" ? op.nextId : op.nextId.type === "assign" ? op.nextId.value : undefined;
    const anchor = next === undefined ? -1 : result.findIndex((u) => u.id === resolve(next));
    if (!skip && next !== undefined && anchor < 0) throw new Error("草稿排序锚点不存在");
    result.splice(skip && oldIndex >= 0 ? oldIndex : anchor < 0 ? result.length : anchor, 0, unit);
  }
  return normalizeUnitIndexes(result.filter((u) => !hidden.has(u.id)));
}

export function concatenateDraftBatches(
  stored: DraftRecord | undefined,
  own: DraftRecord,
): DraftRecord {
  if (!stored) return projectDraft(structuredClone(own));
  const seen = new Set(stored.pending.map((b) => b.saveId));
  // Never compact across saveIds. Only the unsent tail is compacted by buildUnitDiff.
  const pending = [
    ...stored.pending.map((batch) => {
      const sent = own.pending.find((b) => b.saveId === batch.saveId);
      return batch.wire || !sent?.wire ? batch : { ...batch, wire: sent.wire };
    }),
    ...own.pending.filter((b) => !seen.has(b.saveId)),
  ];
  return projectDraft({
    ...own,
    baseline: stored.baseline,
    pending,
    identities: [...new Map([...stored.identities, ...own.identities])],
  });
}

/** Targets are local projections, not request payloads; preserve every batch boundary. */
export function projectDraft(draft: DraftRecord): DraftRecord {
  draft = identifyDraft(draft);
  const resolve = unitIdentityResolver(new Map(draft.identities));
  let units = draft.baseline;
  const pending = draft.pending.map((batch): SaveBatch => {
    units = replayEdits(units, batch.diff, batch.target, resolve);
    return { ...batch, target: units };
  });
  return { ...draft, pending, units };
}
