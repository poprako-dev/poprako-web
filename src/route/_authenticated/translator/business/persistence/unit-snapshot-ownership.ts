import { normalizeUnitIndexes, type UnitInfo } from "../unit/unit";

/** UnitInfo fields are scalar values; copy only objects entering from an external owner. */
export class UnitSnapshotOwnership {
  private readonly owned = new WeakSet<UnitInfo>();

  take(units: UnitInfo[]): UnitInfo[] {
    return normalizeUnitIndexes(units).map((unit) => {
      if (this.owned.has(unit)) return unit;
      const owned = { ...unit };
      this.owned.add(owned);
      return owned;
    });
  }
}
