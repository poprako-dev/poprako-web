import { createStore, type StoreApi } from "zustand/vanilla";
import { parseDraft, type DraftMap, type DraftRecord } from "./draft-record";
import { createDraftDatabase, limitDraftRows, type DraftDatabase } from "./draft-database";
import { identifyDraft, unitIdentityResolver } from "./unit-identity";
import { concatenateDraftBatches, projectDraft, replayEdits } from "./draft-sequence";

export type DraftState = {
  drafts: DraftMap;
  errors: Record<string, string>;
  recoveryErrors: Record<string, string>;
};
export type DraftStore = StoreApi<DraftState> & {
  ready: Promise<void>;
  readRecovery: () => Promise<DraftMap>;
  update: (pageId: string, record: DraftRecord | undefined) => void;
  write: (pageId: string, record: DraftRecord) => Promise<DraftRecord>;
  acknowledge: (pageId: string, saveId: string, identities: [string, string][]) => Promise<void>;
};

export function createDraftStore(
  userId: string,
  chapterId: string,
  database: DraftDatabase = createDraftDatabase(),
): DraftStore {
  const scope = JSON.stringify([userId, chapterId]);
  const store = createStore<DraftState>(() => ({ drafts: {}, errors: {}, recoveryErrors: {} }));
  function update(pageId: string, record: DraftRecord | undefined): void {
    store.setState((s) => ({
      drafts: Object.fromEntries([
        ...Object.entries(s.drafts).filter(([id]) => id !== pageId),
        ...(record ? [[pageId, structuredClone(record)] as const] : []),
      ]),
    }));
  }
  async function readRecovery(): Promise<DraftMap> {
    try {
      const result = await database.transact((rows) => {
        const drafts: DraftMap = {};
        const recoveryErrors: Record<string, string> = {};
        for (const row of rows.filter((r) => r.scope === scope)) {
          try {
            drafts[row.pageId] = projectDraft(parseDraft(row.raw));
          } catch (error) {
            recoveryErrors[row.pageId] = error instanceof Error ? error.message : String(error);
          }
        }
        return { rows, result: { drafts, recoveryErrors } };
      });
      store.setState({ recoveryErrors: result.recoveryErrors });
      return result.drafts;
    } catch (error) {
      store.setState({
        recoveryErrors: { "*": error instanceof Error ? error.message : String(error) },
      });
      return {};
    }
  }
  const ready = readRecovery().then((drafts) => {
    // Initialization must not replace buffers already owned by a controller.
    store.setState((state) => ({ drafts: { ...drafts, ...state.drafts } }));
  });
  async function write(pageId: string, record: DraftRecord): Promise<DraftRecord> {
    const key = JSON.stringify([userId, chapterId, pageId]);
    // SAFETY: drafts are best-effort. Whole-page LRU, quota, browser clearing and
    // crashes can lose unsynchronized work. Multi-MiB offline editing is not guaranteed.
    async function attempt(): Promise<DraftRecord> {
      return await database.transact((rows) => {
        const previous = rows.find((r) => r.key === key);
        const merged = concatenateDraftBatches(
          previous ? parseDraft(previous.raw) : undefined,
          record,
        );
        const next = [
          ...rows.filter((r) => r.key !== key),
          { key, scope, pageId, raw: JSON.stringify(merged), touched: Date.now() },
        ];
        return { rows: limitDraftRows(next, key), result: merged };
      });
    }
    for (;;) {
      try {
        const merged = await attempt();
        store.setState((s) => ({
          errors: Object.fromEntries(
            Object.entries(s.errors).filter(([id]) => id !== pageId && id !== "*"),
          ),
        }));
        return merged;
      } catch (error) {
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          const removed = await database.transact((rows) => {
            const oldest = rows
              .filter((r) => r.key !== key)
              .sort((a, b) => a.touched - b.touched)[0];
            return { rows: rows.filter((r) => r !== oldest), result: Boolean(oldest) };
          });
          if (removed) continue;
        }
        store.setState((s) => ({
          errors: { ...s.errors, [pageId]: "本地草稿保存失败，修改仍在当前页面" },
        }));
        throw error;
      }
    }
  }
  async function acknowledge(
    pageId: string,
    saveId: string,
    identities: [string, string][],
  ): Promise<void> {
    const key = JSON.stringify([userId, chapterId, pageId]);
    await database.transact((rows) => {
      const row = rows.find((r) => r.key === key);
      if (!row) return { rows, result: undefined };
      const original = parseDraft(row.raw);
      const draft = identifyDraft({
        ...original,
        identities: [...new Map([...original.identities, ...identities])],
      });
      const batch = draft.pending.find((b) => b.saveId === saveId);
      if (!batch) return { rows, result: undefined };
      const pending = draft.pending.filter((b) => b.saveId !== saveId);
      const baseline = replayEdits(
        draft.baseline,
        batch.diff,
        batch.target,
        unitIdentityResolver(new Map(draft.identities)),
      );
      const updated = projectDraft({
        ...draft,
        pending,
        baseline,
        identities: [...new Map([...draft.identities, ...identities])],
      });
      return {
        rows: pending.length
          ? rows.map((r) => (r.key === key ? { ...r, raw: JSON.stringify(updated) } : r))
          : rows.filter((r) => r.key !== key),
        result: undefined,
      };
    });
  }
  return { ...store, ready, readRecovery, update, write, acknowledge };
}
const browserStores = new Map<string, DraftStore>();
export function chapterDraftStore(userId: string, chapterId: string): DraftStore {
  const key = JSON.stringify([userId, chapterId]);
  let store = browserStores.get(key);
  if (!store) {
    store = createDraftStore(userId, chapterId);
    browserStores.set(key, store);
  }
  return store;
}
