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
import type { UnitDiff } from "../contract/type";
import { LocalDraftSavedError } from "./local-draft-saved-error";

export type UnitSaveControllerOptions = {
  save: SaveUnits;
  reload: (pageId: string) => Promise<UnitInfo[]>;
  changed: (snapshot: SaveSnapshot) => void;
  failed: (error: unknown, phase: "save" | "refresh" | "local") => void;
  drafts?: DraftStore | undefined;
  canWrite?: () => boolean;
};

export class UnitSaveControllerRuntime implements UnitSaveController {
  private readonly options: UnitSaveControllerOptions;
  private baseline: UnitInfo[] = [];
  private snapshot: SaveSnapshot = {
    units: [],
    dirty: false,
    saving: false,
    error: null,
    refreshError: false,
    lastSavedAt: null,
    pendingUnitIds: [],
  };
  private pageId: string | undefined;
  private generation = 0;
  private revision = 0;
  private active = true;
  private suspended = false;
  private pending: SaveBatch[] = [];
  private running: Promise<void> | undefined;
  private recovering: Promise<void> | undefined;
  private readonly identities = new Map<string, string>();

  constructor(options: UnitSaveControllerOptions) {
    this.options = options;
  }

  private resolveId(id: string): string {
    return unitIdentityResolver(this.identities, this.snapshot.units)(id);
  }

  private record(): DraftRecord {
    return {
      version: 1,
      revision: this.revision,
      units: this.snapshot.units,
      baseline: this.baseline,
      pending: this.pending,
      identities: [...this.identities],
    };
  }

  private publish(changes: Partial<SaveSnapshot> = {}): void {
    this.snapshot = { ...this.snapshot, ...changes };
    const tail = buildUnitDiff(this.snapshot.units, this.pending.at(-1)?.target ?? this.baseline);
    const ops = [...this.pending.flatMap((batch) => batch.diff.ops), ...tail.ops];
    this.snapshot.dirty = ops.length > 0;
    this.snapshot.pendingUnitIds = [
      ...new Set(ops.map((op) => this.resolveId(op.edit === "create" ? op.localId : op.id))),
    ];
    if (this.pageId) {
      this.options.drafts?.update(this.pageId, this.snapshot.dirty ? this.record() : undefined);
    }
    if (this.active) this.options.changed(this.snapshot);
  }

  load(id: string, units: UnitInfo[]): void {
    this.generation += 1;
    this.pageId = id;
    this.pending = [];
    this.running = undefined;
    this.suspended = false;
    this.identities.clear();
    const cached = this.options.drafts?.getState().drafts[id];
    const restored = cached ? identifyDraft(cached, cached.units) : undefined;
    this.baseline = normalizeUnitIndexes(restored?.baseline ?? units);
    this.revision = restored?.revision ?? 0;
    this.pending = structuredClone(restored?.pending ?? []);
    for (const [local, remote] of restored?.identities ??
      this.baseline.map((unit) => [unit.id, unit.id] as const)) {
      this.identities.set(local, remote);
    }
    this.snapshot = {
      units: restored?.units ?? this.baseline,
      dirty: false,
      saving: false,
      error: null,
      refreshError: false,
      lastSavedAt: null,
      pendingUnitIds: [],
    };
    this.publish();
  }

  commit(units: UnitInfo[]): void {
    if (!this.active || this.suspended || !this.pageId || !(this.options.canWrite?.() ?? true))
      return;
    this.revision += 1;
    this.publish({ units: normalizeUnitIndexes(units), storageError: null });
  }

  private seal(): void {
    this.pending.push(
      ...createSaveBatches(this.snapshot.units, this.pending.at(-1)?.target ?? this.baseline),
    );
  }

  private async persistFailure(id: string, epoch: number, error: unknown): Promise<never> {
    try {
      const store = this.options.drafts;
      if (!store) throw error;
      await this.persistPendingFailure(store, id, epoch);
    } catch (storageError) {
      if (epoch !== this.generation) throw storageError;
      const message = "远程和本地保存均失败，修改仍在当前页面，请勿关闭";
      this.publish({ error: message, storageError: message });
      this.options.failed(storageError, "local");
      throw storageError;
    }
    const saved = new LocalDraftSavedError("远程保存失败，已暂存为本地草稿", { cause: error });
    this.publish({ error: saved.message });
    this.options.failed(saved, "save");
    throw saved;
  }

  private async persistPendingFailure(store: DraftStore, id: string, epoch: number): Promise<void> {
    do {
      this.seal();
      const before = this.snapshot.units;
      const savedRevision = this.revision;
      const stored = await store.write(id, this.record());
      if (epoch !== this.generation) throw new Error("页面已切换");
      const merged = identifyDraft(stored, this.snapshot.units);
      const resolve = unitIdentityResolver(new Map(merged.identities), this.snapshot.units);
      const current = mergeUnitVersions(
        identifyUnits(before, resolve),
        identifyUnits(this.snapshot.units, resolve),
        merged.units,
      );
      this.baseline = merged.baseline;
      this.pending = merged.pending;
      this.identities.clear();
      for (const pair of merged.identities) this.identities.set(...pair);
      this.publish({ units: current, storageError: null });
      if (this.revision === savedRevision) return;
    } while (this.active);
  }

  private async persistDetached(id: string, sent: DraftRecord): Promise<void> {
    const store = this.options.drafts;
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

  private async reloadPage(id: string, epoch: number): Promise<void> {
    const remote = await this.options.reload(id);
    if (!this.active || epoch !== this.generation) return;
    const newer = buildUnitDiff(this.snapshot.units, this.baseline);
    const localized = localizeRemote(remote, this.identities, this.snapshot.units);
    const edited = new Set(newer.ops.flatMap((op) => (op.edit === "patch" ? [op.id] : [])));
    const current = mergeUnitVersions(this.baseline, this.snapshot.units, localized);
    this.baseline = [
      ...localized,
      ...this.baseline.filter(
        (unit) => edited.has(unit.id) && !localized.some((item) => item.id === unit.id),
      ),
    ];
    this.publish({ units: current, refreshError: false, error: null });
  }

  saveOnce(): Promise<void> {
    if (this.recovering) return this.recovering.then(() => this.saveOnce());
    if (this.running) return this.running;
    if (!this.active || this.suspended || !this.pageId) return Promise.resolve();
    const id = this.pageId;
    const epoch = this.generation;
    if (!(this.options.canWrite?.() ?? true)) {
      return this.snapshot.dirty
        ? this.persistFailure(id, epoch, new Error("没有编辑权限"))
        : Promise.resolve();
    }
    this.seal();
    if (!this.pending.length && !this.snapshot.refreshError) return Promise.resolve();
    this.publish({ saving: true });
    this.running = this.executeSave(id, epoch);
    return this.running;
  }

  private async executeSave(id: string, epoch: number): Promise<void> {
    await Promise.resolve();
    try {
      const completed = await this.saveBatches(id, epoch);
      if (!completed) return;
      await this.refreshAfterSave(id, epoch);
    } finally {
      if (epoch === this.generation) {
        this.running = undefined;
        this.publish({ saving: false });
      }
    }
  }

  private async saveBatches(id: string, epoch: number): Promise<boolean> {
    while (this.pending.length) {
      if (!this.active || epoch !== this.generation) return false;
      const batch = this.pending[0];
      if (!batch) return true;
      const wire = batch.wire ?? wireUnitDiff(batch.diff, this.identities);
      batch.wire = wire;
      this.publish();
      const sent = this.record();
      if (!(await this.sendBatch(id, epoch, batch, wire, sent))) return false;
      this.baseline = replayEdits(this.baseline, batch.diff, batch.target, (unitId) =>
        this.resolveId(unitId),
      );
      this.pending.shift();
      this.publish({ lastSavedAt: Date.now(), error: null, storageError: null });
      await this.acknowledge(id, batch.saveId);
    }
    return true;
  }

  private async sendBatch(
    id: string,
    epoch: number,
    batch: SaveBatch,
    wire: UnitDiff,
    sent: DraftRecord,
  ): Promise<boolean> {
    try {
      const result = await this.options.save(id, wire, batch.saveId);
      if (epoch !== this.generation) return false;
      acceptCreatedIds(batch.diff, result, this.identities);
      return true;
    } catch (error) {
      if (epoch !== this.generation) {
        await this.persistDetached(id, sent);
        return false;
      }
      await this.persistFailure(id, epoch, error);
      return false;
    }
  }

  private async acknowledge(id: string, saveId: string): Promise<void> {
    await this.options.drafts?.acknowledge(id, saveId, [...this.identities]).catch(() => {
      // Acknowledged requests remain safe to replay by their original save ID.
    });
  }

  private async refreshAfterSave(id: string, epoch: number): Promise<void> {
    try {
      await this.reloadPage(id, epoch);
    } catch (error) {
      if (this.active && epoch === this.generation) {
        this.publish({ refreshError: true, error: "保存成功，页面刷新失败" });
        this.options.failed(error, "refresh");
      }
    }
  }

  async flush(): Promise<void> {
    const epoch = this.generation;
    do {
      await this.saveOnce();
      if (epoch !== this.generation || !this.active || this.suspended) return;
      if (this.snapshot.refreshError) throw new Error(this.snapshot.error ?? "页面刷新失败");
    } while (this.snapshot.dirty);
  }

  async refresh(): Promise<void> {
    await this.flush();
    if (!this.pageId) return;
    const epoch = this.generation;
    try {
      await this.reloadPage(this.pageId, epoch);
    } catch (error) {
      if (this.active && epoch === this.generation) {
        this.publish({ refreshError: true, error: "页面刷新失败" });
        this.options.failed(error, "refresh");
      }
      throw error;
    }
  }

  retryRecovery(): Promise<void> {
    if (this.recovering) return this.recovering;
    const store = this.options.drafts;
    if (!store) return Promise.resolve();
    const epoch = this.generation;
    this.recovering = this.executeRecovery(store, epoch);
    return this.recovering;
  }

  private async executeRecovery(store: DraftStore, epoch: number): Promise<void> {
    try {
      await this.running?.catch(() => {
        // The save has already reported its outcome.
      });
      if (!this.active || epoch !== this.generation) return;
      const restored = await store.readRecovery();
      this.restoreOtherPageDrafts(restored, store);
      if (epoch !== this.generation || !this.pageId) return;
      const draft = restored[this.pageId];
      if (draft) this.applyRecoveredDraft(draft);
    } finally {
      this.recovering = undefined;
    }
  }

  private restoreOtherPageDrafts(restored: Record<string, DraftRecord>, store: DraftStore): void {
    for (const [id, draft] of Object.entries(restored)) {
      if (id !== this.pageId) store.update(id, recoverDraft(draft, store.getState().drafts[id]));
    }
  }

  private applyRecoveredDraft(draft: DraftRecord): void {
    const merged = recoverDraft(draft, this.record());
    this.baseline = merged.baseline;
    this.pending = merged.pending;
    this.identities.clear();
    for (const pair of merged.identities) this.identities.set(...pair);
    this.publish({ units: merged.units });
  }

  getSnapshot(): SaveSnapshot {
    return this.snapshot;
  }

  getPageId(): string | undefined {
    return this.pageId;
  }

  setSuspended(value: boolean): void {
    this.suspended = value;
  }

  setActive(value: boolean): void {
    this.active = value;
    if (!value) {
      this.generation += 1;
      this.running = undefined;
      this.snapshot = { ...this.snapshot, saving: false };
    }
  }
}
