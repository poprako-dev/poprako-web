import type { UnitInfo } from "../unit/unit";
import type { DraftRecord, SaveBatch } from "./draft-record";
import type { DraftStore } from "./draft-store";
import { buildUnitDiff } from "./unit-diff";
import { unitIdentityResolver } from "./unit-identity";
import type { UnitSaveCatalog } from "./unit-save-catalog";

type PendingState = { dirty: boolean; pendingUnitIds: string[] };

/** Cache by immutable content references; status publications share the same record. */
export class UnitSavePublication {
  private cached: DraftRecord | undefined;
  private identities: ReadonlyMap<string, string> | undefined;
  private projected: DraftRecord | undefined;
  private projectedIdentities: ReadonlyMap<string, string> | undefined;
  private state: PendingState = { dirty: false, pendingUnitIds: [] };
  private retainedPage: string | undefined;
  private retained: DraftRecord | undefined;

  record(
    revision: number,
    units: UnitInfo[],
    baseline: UnitInfo[],
    pending: readonly SaveBatch[],
    identities: ReadonlyMap<string, string>,
  ): DraftRecord {
    const previous = this.cached;
    if (
      previous?.revision === revision &&
      previous.units === units &&
      previous.baseline === baseline &&
      previous.pending === pending &&
      this.identities === identities
    ) {
      return previous;
    }
    this.identities = identities;
    this.cached = { version: 1, revision, units, baseline, pending, identities: [...identities] };
    return this.cached;
  }

  project(
    record: DraftRecord,
    catalog: UnitSaveCatalog,
    identities: ReadonlyMap<string, string>,
  ): PendingState {
    if (this.sameContent(record, identities)) return this.state;
    const baseline = record.pending.at(-1)?.target ?? record.baseline;
    const tail =
      record.units === baseline
        ? { ops: [] }
        : buildUnitDiff(record.units, baseline, catalog.project(record.pending));
    const ops = [...record.pending.flatMap((batch) => batch.diff.ops), ...tail.ops];
    const resolve = ops.length
      ? unitIdentityResolver(identities, [
          ...record.units,
          ...catalog.preferred(),
          ...record.pending.flatMap((batch) => batch.target),
        ])
      : (id: string): string => id;
    this.state = {
      dirty: ops.length > 0,
      pendingUnitIds: [
        ...new Set(ops.map((op) => resolve(op.edit === "create" ? op.localId : op.id))),
      ],
    };
    this.projected = record;
    this.projectedIdentities = identities;
    return this.state;
  }

  private sameContent(record: DraftRecord, identities: ReadonlyMap<string, string>): boolean {
    const previous = this.projected;
    return (
      previous?.units === record.units &&
      previous.baseline === record.baseline &&
      this.projectedIdentities === identities &&
      previous.pending.length === record.pending.length &&
      previous.pending.every(
        (batch, index) =>
          batch.diff === record.pending[index]?.diff &&
          batch.target === record.pending[index].target,
      )
    );
  }

  retain(store: DraftStore | undefined, pageId: string, record: DraftRecord | undefined): void {
    if (this.retainedPage === pageId && this.retained === record) return;
    this.retainedPage = pageId;
    this.retained = record;
    store?.retain(pageId, record);
  }
}
