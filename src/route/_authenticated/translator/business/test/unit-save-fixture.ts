import {
  normalizeUnitIndexes,
  type UnitInfo,
} from "@/route/_authenticated/translator/business/unit/unit";
import type {
  SaveUnits,
  CreatedUnitId,
  UnitCreateOp,
  UnitDiff,
  UnitOp,
  UnitPatchOp,
  UnitSaveResult,
} from "@/route/_authenticated/translator/business/contract/type";

type ResolveUnitId = (id: string) => string;

function createdUnitFromOp(op: UnitCreateOp, id: string, index: number): UnitInfo {
  return {
    id,
    index,
    ...op.coord,
    isBubble: op.isBubble,
    isFlagged: op.isFlagged,
    isProofread: op.revision?.isProofread ?? false,
    translatedText: op.translation?.translatedText,
    proofreadText: op.revision?.proofreadText,
  };
}

function appendCreatedUnits(units: UnitInfo[], ops: UnitOp[], idOf: ResolveUnitId): UnitInfo[] {
  for (const op of ops) {
    if (op.edit === "create") {
      units.push(createdUnitFromOp(op, idOf(op.localId), units.length));
    }
  }
  return units;
}

function patchedUnit(unit: UnitInfo, op: UnitPatchOp): UnitInfo {
  return {
    ...unit,
    ...op.coord,
    isBubble: op.isBubble ?? unit.isBubble,
    isFlagged: op.isFlagged ?? unit.isFlagged,
    translatedText:
      op.translation.type === "skip"
        ? unit.translatedText
        : op.translation.type === "clear"
          ? undefined
          : op.translation.value.translatedText,
    proofreadText:
      op.revision.type === "skip"
        ? unit.proofreadText
        : op.revision.type === "clear"
          ? undefined
          : op.revision.value.proofreadText,
    isProofread:
      op.revision.type === "skip"
        ? unit.isProofread
        : op.revision.type === "clear"
          ? false
          : op.revision.value.isProofread,
  };
}

function applyUnitOperation(units: UnitInfo[], op: UnitOp, idOf: ResolveUnitId): void {
  const id = idOf(op.edit === "create" ? op.localId : op.id);
  if (op.edit === "delete") {
    const remaining = units.filter((unit) => unit.id !== id);
    units.splice(0, units.length, ...remaining);
    return;
  }

  const position = units.findIndex((unit) => unit.id === id);
  const unit = units[position];
  if (!unit) return;
  if (op.edit === "patch") {
    units[position] = patchedUnit(unit, op);
    if (op.nextId.type === "skip") return;
  }
  moveUnit(units, position, op, idOf);
}

function moveUnit(
  units: UnitInfo[],
  position: number,
  op: UnitCreateOp | UnitPatchOp,
  idOf: ResolveUnitId,
): void {
  const next =
    op.edit === "create" ? op.nextId : op.nextId.type === "assign" ? op.nextId.value : undefined;
  const moved = units.splice(position, 1)[0];
  if (!moved) return;
  position = next === undefined ? -1 : units.findIndex((item) => item.id === idOf(next));
  units.splice(position === -1 ? units.length : position, 0, moved);
}

function applyUnitOperations(units: UnitInfo[], ops: UnitOp[], idOf: ResolveUnitId): UnitInfo[] {
  for (const op of ops) applyUnitOperation(units, op, idOf);
  return units;
}

function createCreatedUnitIds(diff: UnitDiff): CreatedUnitId[] {
  return diff.ops.flatMap((op) =>
    op.edit === "create" ? [{ localId: op.localId, unitId: crypto.randomUUID() }] : [],
  );
}

export function createUnitSaveFixture(pages: Map<string, UnitInfo[]>): SaveUnits {
  const receipts = new Map<string, UnitSaveResult>();
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (pageId, diff, saveId) => {
    const previous = receipts.get(saveId);
    if (previous) return previous;
    const createdUnitIds = createCreatedUnitIds(diff);
    const identities = new Map(createdUnitIds.map(({ localId, unitId }) => [localId, unitId]));
    const idOf = (id: string): string => identities.get(id) ?? id;
    const units = appendCreatedUnits([...(pages.get(pageId) ?? [])], diff.ops, idOf);
    applyUnitOperations(units, diff.ops, idOf);
    pages.set(pageId, normalizeUnitIndexes(units));
    const result = { createdUnitIds };
    receipts.set(saveId, result);
    return result;
  };
}
