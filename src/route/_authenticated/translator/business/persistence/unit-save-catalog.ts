import type { UnitInfo } from "../unit/unit";
import type { SaveBatch } from "./draft-record";
import { replayEdits } from "./draft-sequence";

/** Retain acknowledged hidden content separately from the visible save baseline. */
export class UnitSaveCatalog {
  private readonly units = new Map<string, UnitInfo>();
  private pending: readonly SaveBatch[] | undefined;
  private projected: ReadonlyMap<string, UnitInfo> | undefined;

  reset(units: UnitInfo[]): void {
    this.units.clear();
    this.remember(units);
  }

  remember(units: UnitInfo[]): void {
    for (const unit of units) this.units.set(unit.id, unit);
    this.projected = undefined;
  }

  project(pending: readonly SaveBatch[]): ReadonlyMap<string, UnitInfo> {
    if (this.pending === pending && this.projected) return this.projected;
    const projected = new Map(this.units);
    for (const batch of pending) {
      const changed = replayEdits([...projected.values()], batch.diff, batch.target);
      for (const unit of changed) projected.set(unit.id, unit);
    }
    this.pending = pending;
    this.projected = projected;
    return projected;
  }

  acknowledge(batch: SaveBatch): void {
    this.remember([...this.project([batch]).values()]);
  }

  preferred(): UnitInfo[] {
    return [...this.units.values()];
  }
}
