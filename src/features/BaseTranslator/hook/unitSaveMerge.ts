import { isUnitSame, normalizeUnitIndexes, unitId, type UnitInfo } from "@/types/unit";
import type { UnitDiff, UnitSaveResult } from "../types/type";

export class UnitSaveProtocolError extends Error {}

export function acceptCreatedIds(
  diff: UnitDiff,
  result: UnitSaveResult | undefined,
  identities: Map<string, string>,
): void {
  if (!Array.isArray(result?.createdUnitIds)) {
    throw new UnitSaveProtocolError("保存响应缺少创建结果，请检查服务器版本");
  }
  const expected = new Set(diff.ops.flatMap((op) => op.edit === "create" ? [op.localId] : []));
  const seen = new Set(identities.values());
  for (const pair of result.createdUnitIds) {
    if (!expected.delete(pair.localId) || !pair.unitId || seen.has(pair.unitId)) {
      throw new UnitSaveProtocolError("保存响应包含无效或重复的 Unit ID");
    }
    seen.add(pair.unitId);
  }
  if (expected.size > 0) {
    throw new UnitSaveProtocolError("保存响应缺少新建 Unit 的永久 ID");
  }
  for (const pair of result.createdUnitIds) {identities.set(pair.localId, pair.unitId);}
}

export function wireUnitDiff(diff: UnitDiff, identities: Map<string, string>): UnitDiff {
  const remoteId = (id: string) => identities.get(id) ?? id;
  return {
    ops: diff.ops.map((op) => {
      if (op.edit === "delete") {return { ...op, id: remoteId(op.id) };}
      if (op.edit === "create") {
        return { ...op, nextId: op.nextId === undefined ? undefined : remoteId(op.nextId) };
      }
      return {
        ...op,
        id: remoteId(op.id),
        nextId: op.nextId.type === "assign"
          ? { type: "assign" as const, value: remoteId(op.nextId.value) }
          : op.nextId,
      };
    }),
  };
}

function mergeUnit(base: UnitInfo, local: UnitInfo, remote: UnitInfo): UnitInfo {
  // Metadata follows the field it describes. Explicit clearing is an edit too.
  const hasTranslationChanged = local.translatedText !== base.translatedText;
  const hasRevisionChanged = local.proofreadText !== base.proofreadText;
  const merged: UnitInfo = {
    ...remote,
    xCoord: local.xCoord === base.xCoord ? remote.xCoord : local.xCoord,
    yCoord: local.yCoord === base.yCoord ? remote.yCoord : local.yCoord,
    isBubble: local.isBubble === base.isBubble ? remote.isBubble : local.isBubble,
    isFlagged: local.isFlagged === base.isFlagged ? remote.isFlagged : local.isFlagged,
    isProofread: local.isProofread === base.isProofread ? remote.isProofread : local.isProofread,
    translatedText: hasTranslationChanged ? local.translatedText : remote.translatedText,
    translatorId: hasTranslationChanged ? local.translatorId : remote.translatorId,
    proofreadText: hasRevisionChanged ? local.proofreadText : remote.proofreadText,
    proofreaderId: hasRevisionChanged ? local.proofreaderId : remote.proofreaderId,
  };
  return isUnitSame(local, merged) && local.index === merged.index ? local : merged;
}

export function mergeSavedUnits(
  baseline: UnitInfo[],
  current: UnitInfo[],
  remote: UnitInfo[],
): UnitInfo[] {
  const saved = new Map(baseline.map((unit) => [unitId(unit), unit]));
  const local = new Map(current.map((unit) => [unitId(unit), unit]));
  const remoteIds = new Set(remote.map((unit) => unitId(unit)));
  for (const unit of current) {
    const base = saved.get(unitId(unit));
    if (base && !remoteIds.has(unitId(unit)) && !isUnitSame(base, unit)) {
      throw new UnitSaveProtocolError("远端已删除正在编辑的文本块，本地修改已保留");
    }
  }
  const merged = remote.flatMap((unit) => {
    const id = unitId(unit);
    const base = saved.get(id);
    const latest = local.get(id);
    if (base && !latest) {return [];}
    return [base && latest ? mergeUnit(base, latest, unit) : unit];
  });
  const baselineOrder = baseline.filter((unit) => local.has(unitId(unit))).map((unit) =>
    unitId(unit)
  );
  const currentOrder = current.filter((unit) => saved.has(unitId(unit))).map((unit) =>
    unitId(unit)
  );
  const hasNewUnits = current.some((unit) => !saved.has(unitId(unit)));
  const hasOrderChanged = baselineOrder.some((id, index) => currentOrder[index] !== id);
  if (hasNewUnits || hasOrderChanged) {
    let anchor: string | undefined;
    for (let index = current.length - 1; index >= 0; index--) {
      const unit = current[index];
      if (!unit) {continue;}
      const id = unitId(unit);
      const oldIndex = merged.findIndex((item) => unitId(item) === id);
      const item = oldIndex === -1 ? unit : merged.splice(oldIndex, 1)[0];
      if (!item || (saved.has(id) && !remoteIds.has(id))) {continue;}
      const nextIndex = merged.findIndex((candidate) => unitId(candidate) === anchor);
      merged.splice(nextIndex === -1 ? merged.length : nextIndex, 0, item);
      anchor = id;
    }
  }
  return normalizeUnitIndexes(merged);
}
