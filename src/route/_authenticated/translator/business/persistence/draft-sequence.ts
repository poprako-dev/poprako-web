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
  registerCreatedUnits(result, diff, resolve);
  for (const op of diff.ops) result = replayOperation(result, target, op, resolve, hidden);
  return normalizeUnitIndexes(result.filter((u) => !hidden.has(u.id)));
}

function registerCreatedUnits(
  units: UnitInfo[],
  diff: UnitDiff,
  resolve: (id: string) => string,
): void {
  for (const op of diff.ops) {
    if (op.edit !== "create" || units.some((unit) => unit.id === resolve(op.localId))) continue;
    units.push({
      id: resolve(op.localId),
      index: units.length,
      ...op.coord,
      isBubble: op.isBubble,
      isFlagged: op.isFlagged,
      isProofread: op.revision?.isProofread ?? false,
    });
  }
}

function replayOperation(
  units: UnitInfo[],
  target: UnitInfo[],
  op: UnitDiff["ops"][number],
  resolve: (id: string) => string,
  hidden: Set<string>,
): UnitInfo[] {
  const id = resolve(op.edit === "create" ? op.localId : op.id);
  const before = units.find((unit) => unit.id === id) ?? target.find((unit) => unit.id === id);
  if (op.edit === "delete") {
    hidden.add(id);
    return units;
  }
  hidden.delete(id);
  const unit = applyOperationFields(op, id, before);
  if (!unit) return units;
  return placeOperationUnit(units, op, unit, resolve);
}

function applyOperationFields(
  op: UnitDiff["ops"][number],
  id: string,
  before: UnitInfo | undefined,
): UnitInfo | undefined {
  if (op.edit === "create") {
    return {
      id,
      index: 0,
      ...op.coord,
      isBubble: op.isBubble,
      isFlagged: op.isFlagged,
      isProofread: op.revision?.isProofread ?? false,
      translatedText: op.translation?.translatedText,
      proofreadText: op.revision?.proofreadText,
    };
  }
  if (op.edit !== "patch") return undefined;
  if (!before) return undefined;
  let unit: UnitInfo = {
    ...before,
    ...op.coord,
    isBubble: op.isBubble ?? before.isBubble,
    isFlagged: op.isFlagged ?? before.isFlagged,
  };
  unit = applyTranslationFields(unit, op);
  return applyRevisionFields(unit, op);
}

function applyTranslationFields(
  unit: UnitInfo,
  op: Extract<UnitDiff["ops"][number], { edit: "patch" }>,
): UnitInfo {
  if (op.translation.type === "skip") return unit;
  return {
    ...unit,
    translatedText:
      op.translation.type === "assign" ? op.translation.value.translatedText : undefined,
  };
}

function applyRevisionFields(
  unit: UnitInfo,
  op: Extract<UnitDiff["ops"][number], { edit: "patch" }>,
): UnitInfo {
  if (op.revision.type === "skip") return unit;
  return {
    ...unit,
    isProofread: op.revision.type === "assign" ? op.revision.value.isProofread : false,
    proofreadText: op.revision.type === "assign" ? op.revision.value.proofreadText : undefined,
  };
}

function placeOperationUnit(
  units: UnitInfo[],
  op: UnitDiff["ops"][number],
  unit: UnitInfo,
  resolve: (id: string) => string,
): UnitInfo[] {
  const oldIndex = units.findIndex((item) => item.id === unit.id);
  const result = units.filter((item) => item.id !== unit.id);
  const skip = op.edit === "patch" && op.nextId.type === "skip";
  const next =
    op.edit === "create"
      ? op.nextId
      : op.edit === "patch" && op.nextId.type === "assign"
        ? op.nextId.value
        : undefined;
  const anchor = next === undefined ? -1 : result.findIndex((item) => item.id === resolve(next));
  if (!skip && next !== undefined && anchor < 0) throw new Error("草稿排序锚点不存在");
  result.splice(skip && oldIndex >= 0 ? oldIndex : anchor < 0 ? result.length : anchor, 0, unit);
  return result;
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
