import type { DraftRecord } from "./draft-record";
import { concatenateDraftBatches } from "./draft-sequence";
import { identifyDraft, identifyUnits, unitIdentityResolver } from "./unit-identity";
import { mergeUnitVersions } from "./merge-unit-versions";

/** Stored batches precede this client's batches; its unsealed input stays field-granular. */
export function recoverDraft(stored: DraftRecord, own?: DraftRecord): DraftRecord {
  if (!own) return identifyDraft(stored);
  const merged = identifyDraft(concatenateDraftBatches(stored, own), own.units);
  const resolve = unitIdentityResolver(new Map(merged.identities), own.units);
  const tailBase = own.pending.at(-1)?.target ?? own.baseline;
  return {
    ...merged,
    units: mergeUnitVersions(
      identifyUnits(tailBase, resolve),
      identifyUnits(own.units, resolve),
      merged.units,
    ),
  };
}
