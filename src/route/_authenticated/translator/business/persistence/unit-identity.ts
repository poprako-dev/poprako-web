import { normalizeUnitIndexes, type UnitInfo } from "../unit/unit";
import type { DraftRecord } from "./draft-record";

/** Identity comparison uses permanent IDs; live editors keep their existing React keys. */
export function unitIdentityResolver(
  identities: ReadonlyMap<string, string>,
  preferred: UnitInfo[] = [],
): (id: string) => string {
  const display = new Map<string, string>();
  for (const unit of preferred) {
    const permanent = identities.get(unit.id) ?? unit.id;
    if (!display.has(permanent)) display.set(permanent, unit.id);
  }
  return (id) => {
    const permanent = identities.get(id) ?? id;
    return display.get(permanent) ?? permanent;
  };
}
export function identifyUnits(units: UnitInfo[], resolve: (id: string) => string): UnitInfo[] {
  const unique = new Map<string, UnitInfo>();
  for (const unit of units) {
    const id = resolve(unit.id);
    if (!unique.has(id)) unique.set(id, id === unit.id ? unit : { ...unit, id });
  }
  return normalizeUnitIndexes([...unique.values()]);
}
export function identifyDraft(draft: DraftRecord, preferred: UnitInfo[] = []): DraftRecord {
  const resolve = unitIdentityResolver(new Map(draft.identities), preferred);
  return {
    ...draft,
    baseline: identifyUnits(draft.baseline, resolve),
    units: identifyUnits(draft.units, resolve),
    // diff and wire are immutable requests. Only projection metadata changes identity.
    pending: draft.pending.map((batch) => ({
      ...batch,
      target: identifyUnits(batch.target, resolve),
    })),
  };
}
