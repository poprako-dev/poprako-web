import type {
  UnitDiff,
  UnitSaveResult,
} from "@/route/_authenticated/translator/business/contract/type";

export class UnitSaveProtocolError extends Error {}

export function acceptCreatedIds(
  diff: UnitDiff,
  result: UnitSaveResult | undefined,
  identities: Map<string, string>,
): void {
  if (!Array.isArray(result?.createdUnitIds)) {
    throw new UnitSaveProtocolError("保存响应缺少创建结果，请检查服务器版本");
  }
  const expected = new Set(diff.ops.flatMap((op) => (op.edit === "create" ? [op.localId] : [])));
  const seen = new Set(
    [...identities]
      .filter(([local]) => !expected.has(local))
      .filter(([local, remote]) => local !== remote)
      .map(([, remote]) => remote),
  );
  for (const pair of result.createdUnitIds) {
    if (!expected.delete(pair.localId) || !pair.unitId || seen.has(pair.unitId)) {
      throw new UnitSaveProtocolError("保存响应包含无效或重复的 Unit ID");
    }
    seen.add(pair.unitId);
  }
  if (expected.size > 0) {
    throw new UnitSaveProtocolError("保存响应缺少新建 Unit 的永久 ID");
  }
  for (const pair of result.createdUnitIds) {
    identities.set(pair.localId, pair.unitId);
  }
}

export function wireUnitDiff(diff: UnitDiff, identities: Map<string, string>): UnitDiff {
  const created = new Set(diff.ops.flatMap((op) => (op.edit === "create" ? [op.localId] : [])));
  const remoteId = (id: string): string => (created.has(id) ? id : (identities.get(id) ?? id));
  return {
    ops: diff.ops.map((op) => {
      if (op.edit === "delete") return { ...op, id: remoteId(op.id) };
      if (op.edit === "create") {
        return {
          ...op,
          nextId: op.nextId === undefined ? undefined : remoteId(op.nextId),
        };
      }
      return {
        ...op,
        id: remoteId(op.id),
        nextId:
          op.nextId.type === "assign"
            ? { type: "assign" as const, value: remoteId(op.nextId.value) }
            : op.nextId,
      };
    }),
  };
}
