import { createStore, type StoreApi } from "zustand/vanilla";
import { parseDraft, type DraftMap, type DraftRecord } from "./draft-record";
import {
  createDraftDatabase,
  limitDraftRows,
  type DraftDatabase,
  type DraftRow,
} from "./draft-database";
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
    return await readDraftRecovery(database, scope, store);
  }
  const ready = readRecovery().then((drafts) => {
    // Initialization must not replace buffers already owned by a controller.
    store.setState((state) => ({ drafts: { ...drafts, ...state.drafts } }));
  });
  async function write(pageId: string, record: DraftRecord): Promise<DraftRecord> {
    return await writeDraftRecord(database, userId, chapterId, pageId, scope, record, store);
  }
  async function acknowledge(
    pageId: string,
    saveId: string,
    identities: [string, string][],
  ): Promise<void> {
    await acknowledgeDraft(database, userId, chapterId, pageId, saveId, identities);
  }
  return { ...store, ready, readRecovery, update, write, acknowledge };
}

async function readDraftRecovery(
  database: DraftDatabase,
  scope: string,
  store: StoreApi<DraftState>,
): Promise<DraftMap> {
  try {
    const result = await database.transact((rows) => collectDrafts(rows, scope));
    store.setState({ recoveryErrors: result.recoveryErrors });
    return result.drafts;
  } catch (error) {
    store.setState({ recoveryErrors: { "*": errorMessage(error) } });
    return {};
  }
}

function collectDrafts(
  rows: DraftRow[],
  scope: string,
): {
  rows: DraftRow[];
  result: { drafts: DraftMap; recoveryErrors: Record<string, string> };
} {
  const drafts: DraftMap = {};
  const recoveryErrors: Record<string, string> = {};
  for (const row of rows.filter((item) => item.scope === scope)) {
    try {
      drafts[row.pageId] = projectDraft(parseDraft(row.raw));
    } catch (error) {
      recoveryErrors[row.pageId] = errorMessage(error);
    }
  }
  return { rows, result: { drafts, recoveryErrors } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function writeDraftRecord(
  database: DraftDatabase,
  userId: string,
  chapterId: string,
  pageId: string,
  scope: string,
  record: DraftRecord,
  store: StoreApi<DraftState>,
): Promise<DraftRecord> {
  const key = JSON.stringify([userId, chapterId, pageId]);
  // SAFETY: drafts are best-effort. Whole-page LRU, quota, browser clearing and
  // crashes can lose unsynchronized work. Multi-MiB offline editing is not guaranteed.
  for (;;) {
    try {
      const merged = await attemptDraftWrite(database, key, scope, pageId, record);
      clearDraftError(store, pageId);
      return merged;
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        if (await removeOldestDraft(database, key)) continue;
      }
      setDraftError(store, pageId);
      throw error;
    }
  }
}

async function attemptDraftWrite(
  database: DraftDatabase,
  key: string,
  scope: string,
  pageId: string,
  record: DraftRecord,
): Promise<DraftRecord> {
  return await database.transact((rows) => {
    const previous = rows.find((row) => row.key === key);
    const merged = concatenateDraftBatches(previous ? parseDraft(previous.raw) : undefined, record);
    const next = [
      ...rows.filter((row) => row.key !== key),
      { key, scope, pageId, raw: JSON.stringify(merged), touched: Date.now() },
    ];
    return { rows: limitDraftRows(next, key), result: merged };
  });
}

async function removeOldestDraft(database: DraftDatabase, key: string): Promise<boolean> {
  return await database.transact((rows) => {
    const oldest = rows.filter((row) => row.key !== key).sort((a, b) => a.touched - b.touched)[0];
    return { rows: rows.filter((row) => row !== oldest), result: Boolean(oldest) };
  });
}

function clearDraftError(store: StoreApi<DraftState>, pageId: string): void {
  store.setState((state) => ({
    errors: Object.fromEntries(
      Object.entries(state.errors).filter(([id]) => id !== pageId && id !== "*"),
    ),
  }));
}

function setDraftError(store: StoreApi<DraftState>, pageId: string): void {
  store.setState((state) => ({
    errors: { ...state.errors, [pageId]: "本地草稿保存失败，修改仍在当前页面" },
  }));
}

async function acknowledgeDraft(
  database: DraftDatabase,
  userId: string,
  chapterId: string,
  pageId: string,
  saveId: string,
  identities: [string, string][],
): Promise<void> {
  const key = JSON.stringify([userId, chapterId, pageId]);
  await database.transact((rows) => acknowledgeDraftRows(rows, key, saveId, identities));
}

function acknowledgeDraftRows(
  rows: DraftRow[],
  key: string,
  saveId: string,
  identities: [string, string][],
): { rows: DraftRow[]; result: undefined } {
  const row = rows.find((item) => item.key === key);
  if (!row) return { rows, result: undefined };
  const original = parseDraft(row.raw);
  const draft = identifyDraft({
    ...original,
    identities: [...new Map([...original.identities, ...identities])],
  });
  const batch = draft.pending.find((item) => item.saveId === saveId);
  if (!batch) return { rows, result: undefined };
  return writeAcknowledgedBatch(rows, key, draft, batch, identities);
}

function writeAcknowledgedBatch(
  rows: DraftRow[],
  key: string,
  draft: DraftRecord,
  batch: DraftRecord["pending"][number],
  identities: [string, string][],
): { rows: DraftRow[]; result: undefined } {
  const pending = draft.pending.filter((item) => item.saveId !== batch.saveId);
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
  const nextRows = pending.length
    ? rows.map((row) => (row.key === key ? { ...row, raw: JSON.stringify(updated) } : row))
    : rows.filter((row) => row.key !== key);
  return { rows: nextRows, result: undefined };
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
