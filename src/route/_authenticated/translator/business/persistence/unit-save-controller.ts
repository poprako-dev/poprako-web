import { normalizeUnitIndexes, type UnitInfo } from "../unit/unit";
import type { SaveUnits } from "../contract/type";
import { identifyDraft, identifyUnits, unitIdentityResolver } from "./unit-identity";
import { mergeUnitVersions } from "./merge-unit-versions";
import { recoverDraft } from "./recover-draft";
import { buildUnitDiff } from "./unit-diff";
import { acceptCreatedIds, wireUnitDiff } from "./unit-save-merge";
import { createSaveBatches, localizeRemote } from "./draft-reconcile";
import { replayEdits } from "./draft-sequence";
import type { DraftRecord, SaveBatch } from "./draft-record";
import type { DraftStore } from "./draft-store";
import type { SaveSnapshot, UnitSaveController } from "./save-controller-type";
export type { SaveSnapshot, UnitSaveController } from "./save-controller-type";
export class LocalDraftSavedError extends Error {}
type Options = {
  save: SaveUnits;
  reload: (pageId: string) => Promise<UnitInfo[]>;
  changed: (snapshot: SaveSnapshot) => void;
  failed: (error: unknown, phase: "save" | "refresh" | "local") => void;
  drafts?: DraftStore | undefined;
  canWrite?: () => boolean;
};

export function createUnitSaveController(options: Options): UnitSaveController {
  let baseline: UnitInfo[] = [];
  let snapshot: SaveSnapshot = {
    units: [],
    dirty: false,
    saving: false,
    error: null,
    refreshError: false,
    lastSavedAt: null,
    pendingUnitIds: [],
  };
  let pageId: string | undefined;
  let generation = 0,
    revision = 0;
  let active = true,
    suspended = false;
  let pending: SaveBatch[] = [];
  let running: Promise<void> | undefined;
  let recovering: Promise<void> | undefined;
  const identities = new Map<string, string>();
  const resolveId = (id: string): string => unitIdentityResolver(identities, snapshot.units)(id);
  function record(): DraftRecord {
    return {
      version: 1,
      revision,
      units: snapshot.units,
      baseline,
      pending,
      identities: [...identities],
    };
  }
  function publish(changes: Partial<SaveSnapshot> = {}): void {
    snapshot = { ...snapshot, ...changes };
    const tail = buildUnitDiff(snapshot.units, pending.at(-1)?.target ?? baseline);
    const ops = [...pending.flatMap((b) => b.diff.ops), ...tail.ops];
    snapshot.dirty = ops.length > 0;
    snapshot.pendingUnitIds = [
      ...new Set(ops.map((op) => resolveId(op.edit === "create" ? op.localId : op.id))),
    ];
    if (pageId) options.drafts?.update(pageId, snapshot.dirty ? record() : undefined);
    if (active) options.changed(snapshot);
  }
  function load(id: string, units: UnitInfo[]): void {
    generation += 1;
    pageId = id;
    pending = [];
    running = undefined;
    suspended = false;
    identities.clear();
    const cached = options.drafts?.getState().drafts[id];
    const restored = cached ? identifyDraft(cached, cached.units) : undefined;
    baseline = normalizeUnitIndexes(restored?.baseline ?? units);
    revision = restored?.revision ?? 0;
    pending = structuredClone(restored?.pending ?? []);
    for (const [local, remote] of restored?.identities ??
      baseline.map((u) => [u.id, u.id] as const))
      identities.set(local, remote);
    snapshot = {
      units: restored?.units ?? baseline,
      dirty: false,
      saving: false,
      error: null,
      refreshError: false,
      lastSavedAt: null,
      pendingUnitIds: [],
    };
    // Restore the persisted projection before asking for ambiguous creation receipts.
    publish();
  }
  function commit(units: UnitInfo[]): void {
    if (!active || suspended || !pageId || !(options.canWrite?.() ?? true)) return;
    revision += 1;
    publish({ units: normalizeUnitIndexes(units), storageError: null });
  }
  function seal(): void {
    pending.push(...createSaveBatches(snapshot.units, pending.at(-1)?.target ?? baseline));
  }
  async function persistFailure(id: string, epoch: number, error: unknown): Promise<never> {
    try {
      if (!options.drafts) throw error;
      do {
        seal();
        const before = snapshot.units;
        const savedRevision = revision;
        const stored = await options.drafts.write(id, record());
        if (epoch !== generation) throw new Error("页面已切换");
        const merged = identifyDraft(stored, snapshot.units);
        const resolve = unitIdentityResolver(new Map(merged.identities), snapshot.units);
        const current = mergeUnitVersions(
          identifyUnits(before, resolve),
          identifyUnits(snapshot.units, resolve),
          merged.units,
        );
        baseline = merged.baseline;
        pending = merged.pending;
        identities.clear();
        for (const pair of merged.identities) identities.set(...pair);
        publish({ units: current, storageError: null });
        if (revision === savedRevision) break;
      } while (active);
    } catch (storageError) {
      if (epoch !== generation) throw storageError;
      const message = "远程和本地保存均失败，修改仍在当前页面，请勿关闭";
      publish({ error: message, storageError: message });
      options.failed(storageError, "local");
      throw storageError;
    }
    const saved = new LocalDraftSavedError("远程保存失败，已暂存为本地草稿", { cause: error });
    publish({ error: saved.message });
    options.failed(saved, "save");
    throw saved;
  }
  async function persistDetached(id: string, sent: DraftRecord): Promise<void> {
    const store = options.drafts;
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
      // The scoped memory buffer survives authentication-driven unmounts even if
      // storage is unavailable. A late response must never update the next editor.
    }
  }
  async function reload(id: string, epoch: number): Promise<void> {
    const remote = await options.reload(id);
    if (!active || epoch !== generation) return;
    const newer = buildUnitDiff(snapshot.units, baseline);
    const localized = localizeRemote(remote, identities, snapshot.units);
    const edited = new Set(newer.ops.flatMap((op) => (op.edit === "patch" ? [op.id] : [])));
    // Patching an existing tombstone restores it under the HTTP protocol.
    const current = mergeUnitVersions(baseline, snapshot.units, localized);
    baseline = [
      ...localized,
      ...baseline.filter((u) => edited.has(u.id) && !localized.some((r) => r.id === u.id)),
    ];
    publish({ units: current, refreshError: false, error: null });
  }
  function saveOnce(): Promise<void> {
    if (recovering) return recovering.then(saveOnce);
    if (running) return running;
    if (!active || suspended || !pageId) return Promise.resolve();
    const id = pageId,
      epoch = generation;
    if (!(options.canWrite?.() ?? true))
      return snapshot.dirty
        ? persistFailure(id, epoch, new Error("没有编辑权限"))
        : Promise.resolve();
    seal();
    if (!pending.length && !snapshot.refreshError) return Promise.resolve();
    publish({ saving: true });
    async function execute(): Promise<void> {
      await Promise.resolve();
      try {
        while (pending.length) {
          if (!active || epoch !== generation) return;
          const batch = pending[0];
          if (!batch) break;
          // Sent/shared batches are immutable. A pathological concurrent creation
          // exceeding the server's 100-unit cap may remain rejected; no batch repair.
          batch.wire ??= wireUnitDiff(batch.diff, identities);
          publish();
          const sent = record();
          try {
            const result = await options.save(id, batch.wire, batch.saveId);
            if (epoch !== generation) return;
            acceptCreatedIds(batch.diff, result, identities);
          } catch (error) {
            if (epoch !== generation) {
              await persistDetached(id, sent);
              return;
            }
            await persistFailure(id, epoch, error);
          }
          baseline = replayEdits(baseline, batch.diff, batch.target, resolveId);
          pending.shift();
          publish({ lastSavedAt: Date.now(), error: null, storageError: null });
          // Cleanup never turns an acknowledged request into a new request. An old
          // record left by a disk error can safely replay its original saveId later.
          await options.drafts?.acknowledge(id, batch.saveId, [...identities]).catch(() => {
            /* Best-effort cleanup; preserve the original on disk on failure. */
          });
        }
        try {
          await reload(id, epoch);
        } catch (error) {
          if (active && epoch === generation) {
            publish({ refreshError: true, error: "保存成功，页面刷新失败" });
            options.failed(error, "refresh");
          }
        }
      } finally {
        if (epoch === generation) {
          running = undefined;
          publish({ saving: false });
        }
      }
    }
    running = execute();
    return running;
  }
  async function flush(): Promise<void> {
    const epoch = generation;
    do {
      await saveOnce();
      if (epoch !== generation || !active || suspended) return;
      if (snapshot.refreshError) throw new Error(snapshot.error ?? "页面刷新失败");
    } while (snapshot.dirty);
  }
  async function refresh(): Promise<void> {
    await flush();
    if (!pageId) return;
    const epoch = generation;
    try {
      await reload(pageId, epoch);
    } catch (error) {
      if (active && epoch === generation) {
        publish({ refreshError: true, error: "页面刷新失败" });
        options.failed(error, "refresh");
      }
      throw error;
    }
  }
  function retryRecovery(): Promise<void> {
    if (recovering) return recovering;
    const store = options.drafts;
    if (!store) return Promise.resolve();
    const epoch = generation;
    async function executeRecovery(targetStore: DraftStore): Promise<void> {
      try {
        await running?.catch(() => {
          /* The save has already reported its outcome. */
        });
        if (!active || epoch !== generation) return;
        const restored = await targetStore.readRecovery();
        for (const [id, draft] of Object.entries(restored)) {
          if (id !== pageId)
            targetStore.update(id, recoverDraft(draft, targetStore.getState().drafts[id]));
        }
        if (epoch !== generation || !pageId) return;
        const draft = restored[pageId];
        if (!draft) return;
        const merged = recoverDraft(draft, record());
        baseline = merged.baseline;
        pending = merged.pending;
        identities.clear();
        for (const pair of merged.identities) identities.set(...pair);
        publish({ units: merged.units });
      } finally {
        recovering = undefined;
      }
    }
    recovering = executeRecovery(store);
    return recovering;
  }
  return {
    load,
    commit,
    saveOnce,
    flush,
    refresh,
    retryRecovery,
    getSnapshot: () => snapshot,
    getPageId: () => pageId,
    setSuspended: (value) => {
      suspended = value;
    },
    setActive: (value) => {
      active = value;
      if (!value) {
        generation += 1;
        running = undefined;
        snapshot = { ...snapshot, saving: false };
      }
    },
  };
}
