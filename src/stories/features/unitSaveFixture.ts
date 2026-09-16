import { normalizeUnitIndexes, type UnitInfo } from "@/types/unit";
import type { SaveUnits, UnitSaveResult } from "@/features/BaseTranslator/types/type";

export function createUnitSaveFixture(pages: Map<string, UnitInfo[]>): SaveUnits {
  const receipts = new Map<string, UnitSaveResult>();
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (pageId, diff, saveId) => {
    const previous = receipts.get(saveId);
    if (previous) {return previous;}
    const createdUnitIds = diff.ops.flatMap((op) =>
      op.edit === "create" ? [{ localId: op.localId, unitId: crypto.randomUUID() }] : []
    );
    const identities = new Map(createdUnitIds.map((pair) => [pair.localId, pair.unitId]));
    const idOf = (id: string) => identities.get(id) ?? id;
    let units = [...(pages.get(pageId) ?? [])];
    for (const op of diff.ops) {
      if (op.edit === "create") {
        units.push({
          id: idOf(op.localId),
          index: units.length,
          ...op.coord,
          isBubble: op.isBubble,
          isProofread: op.revision?.isProofread ?? false,
          translatedText: op.translation?.translatedText,
          proofreadText: op.revision?.proofreadText,
        });
      }
    }
    for (const op of diff.ops) {
      const id = idOf(op.edit === "create" ? op.localId : op.id);
      if (op.edit === "delete") {
        units = units.filter((unit) => unit.id !== id);
        continue;
      }
      let position = units.findIndex((unit) => unit.id === id);
      const unit = units[position];
      if (!unit) {continue;}
      if (op.edit === "patch") {
        units[position] = {
          ...unit,
          ...op.coord,
          isBubble: op.isBubble ?? unit.isBubble,
          translatedText: op.translation.type === "skip"
            ? unit.translatedText
            : (op.translation.type === "clear" ? undefined : op.translation.value.translatedText),
          proofreadText: op.revision.type === "skip"
            ? unit.proofreadText
            : (op.revision.type === "clear" ? undefined : op.revision.value.proofreadText),
          isProofread: op.revision.type === "skip"
            ? unit.isProofread
            : (op.revision.type === "clear" ? false : op.revision.value.isProofread),
        };
        if (op.nextId.type === "skip") {continue;}
      }
      const next = op.edit === "create"
        ? op.nextId
        : (op.nextId.type === "assign" ? op.nextId.value : undefined);
      const moved = units.splice(position, 1)[0];
      if (!moved) {continue;}
      position = next === undefined ? -1 : units.findIndex((item) => item.id === idOf(next));
      units.splice(position === -1 ? units.length : position, 0, moved);
    }
    pages.set(pageId, normalizeUnitIndexes(units));
    const result = { createdUnitIds };
    receipts.set(saveId, result);
    return result;
  };
}
