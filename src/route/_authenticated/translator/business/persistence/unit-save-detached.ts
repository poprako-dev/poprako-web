import type { DraftRecord } from "./draft-record";
import type { DraftStore } from "./draft-store";
import { createSaveBatches } from "./draft-reconcile";

export async function persistDetachedDraft(
  store: DraftStore | undefined,
  id: string,
  sent: DraftRecord,
): Promise<void> {
  if (!store) return;
  const cached = store.getState().drafts[id];
  const draft = structuredClone(cached ?? sent);
  draft.pending.push(
    ...createSaveBatches(draft.units, draft.pending.at(-1)?.target ?? draft.baseline),
  );
  try {
    const saved = await store.write(id, draft);
    if (store.getState().drafts[id] === cached) store.update(id, saved);
  } catch {
    // The memory buffer survives an unmount when storage is unavailable.
  }
}
