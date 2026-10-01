import { unitId, type UnitInfo } from "../unit/unit";
import { identifyUnits, unitIdentityResolver } from "./unit-identity";
import { buildUnitDiff } from "./unit-diff";
import type { SaveBatch } from "./draft-record";

export function localizeRemote(
  units: UnitInfo[],
  identities: Map<string, string>,
  preferred: UnitInfo[] = [],
): UnitInfo[] {
  return identifyUnits(units, unitIdentityResolver(identities, preferred));
}
export function createSaveBatches(target: UnitInfo[], baseline: UnitInfo[]): SaveBatch[] {
  if (target.length > 100) throw new Error("每页最多 100 个文本块，请减少后重试");
  const diff = buildUnitDiff(target, baseline);
  if (!diff.ops.length) return [];
  if (diff.ops.length <= 100) return [{ saveId: crypto.randomUUID(), diff, target }];
  const deletes = diff.ops.filter((op) => op.edit === "delete");
  const deletedIds = new Set(deletes.map((op) => op.id));
  return [
    {
      saveId: crypto.randomUUID(),
      diff: { ops: deletes },
      target: baseline.filter((u) => !deletedIds.has(unitId(u))),
    },
    {
      saveId: crypto.randomUUID(),
      diff: { ops: diff.ops.filter((op) => op.edit !== "delete") },
      target,
    },
  ];
}
