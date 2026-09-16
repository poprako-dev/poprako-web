import { normalizeUnitIndexes, unitId, type UnitInfo } from "@/types/unit";
import type { SaveUnits, UnitDiff } from "../types/type";
import { buildUnitDiff } from "./unitDiff";
import {
  acceptCreatedIds,
  mergeSavedUnits,
  UnitSaveProtocolError,
  wireUnitDiff,
} from "./unitSaveMerge";

interface Batch {
  saveId: string;
  diff: UnitDiff;
  target: UnitInfo[];
  wire?: UnitDiff;
}
export interface SaveSnapshot {
  units: UnitInfo[];
  dirty: boolean;
  saving: boolean;
  error: string | null;
  refreshError: boolean;
  lastSavedAt: number | null;
}
interface Options {
  save: SaveUnits;
  reload: (pageId: string) => Promise<UnitInfo[]>;
  changed: (snapshot: SaveSnapshot) => void;
  failed: (error: unknown, phase: "save" | "refresh") => void;
}

export function createUnitSaveController(options: Options) {
  let baseline: UnitInfo[] = [];
  let snapshot: SaveSnapshot = {
    units: [],
    dirty: false,
    saving: false,
    error: null,
    refreshError: false,
    lastSavedAt: null,
  };
  let pageId: string | undefined;
  let generation = 0;
  let isActive = true;
  let isSuspended = false;
  let isHalted = false;
  let pending: Batch[] = [];
  let running: Promise<void> | undefined;
  const identities = new Map<string, string>();
  let lastError: string | undefined;

  function publish(changes: Partial<SaveSnapshot> = {}) {
    snapshot = { ...snapshot, ...changes };
    snapshot.dirty = pending.length > 0 || buildUnitDiff(snapshot.units, baseline).ops.length > 0;
    if (isActive) {options.changed(snapshot);}
  }

  function report(error: unknown, phase: "save" | "refresh") {
    const message = error instanceof Error ? error.message : "保存失败，请重试";
    if (error instanceof UnitSaveProtocolError) {isHalted = true;}
    publish({ error: message, refreshError: phase === "refresh" });
    if (lastError !== message) {
      lastError = message;
      options.failed(error, phase);
    }
  }

  function load(id: string, units: UnitInfo[]) {
    generation += 1;
    pageId = id;
    isSuspended = false;
    isHalted = false;
    pending = [];
    running = undefined;
    lastError = undefined;
    identities.clear();
    baseline = normalizeUnitIndexes(units);
    for (const unit of baseline) {identities.set(unitId(unit), unitId(unit));}
    publish({
      units: baseline,
      saving: false,
      error: null,
      refreshError: false,
      lastSavedAt: null,
    });
  }

  function commit(units: UnitInfo[]) {
    if (!isActive || isSuspended || !pageId) {return;}
    publish({ units: normalizeUnitIndexes(units) });
  }

  function batches(target: UnitInfo[]): Batch[] {
    if (target.length > 100) {throw new Error("每页最多 100 个文本块，请减少后重试");}
    const diff = buildUnitDiff(target, baseline);
    if (diff.ops.length === 0) {return [];}
    if (diff.ops.length <= 100) {return [{ saveId: crypto.randomUUID(), diff, target }];}
    const deletes = diff.ops.filter((op) => op.edit === "delete");
    const deletedIds = new Set(deletes.map((op) => op.id));
    return [
      {
        saveId: crypto.randomUUID(),
        diff: { ops: deletes },
        target: baseline.filter((unit) => !deletedIds.has(unitId(unit))),
      },
      {
        saveId: crypto.randomUUID(),
        diff: { ops: diff.ops.filter((op) => op.edit !== "delete") },
        target,
      },
    ];
  }

  async function reload(id: string, epoch: number) {
    const saved = baseline;
    const units = await options.reload(id);
    if (!isActive || epoch !== generation) {return;}
    const reverse = new Map([...identities].map(([local, remote]) => [remote, local]));
    const remote = units.map((unit) => {
      const local = reverse.get(unitId(unit));
      return local && local !== unitId(unit) ? { ...unit, id: local } : unit;
    });
    const merged = mergeSavedUnits(saved, snapshot.units, remote);
    baseline = normalizeUnitIndexes(remote);
    for (const unit of remote) {
      if (!identities.has(unitId(unit))) {identities.set(unitId(unit), unitId(unit));}
    }
    lastError = undefined;
    publish({ units: merged, refreshError: false, error: null });
  }

  function saveOnce(): Promise<void> {
    if (running) {return running;}
    if (!isActive || isSuspended || !pageId) {return Promise.resolve();}
    if (isHalted) {return Promise.reject(new UnitSaveProtocolError(snapshot.error ?? "保存已暂停"));}
    const id = pageId;
    const epoch = generation;
    function isCurrent() {
      return isActive && epoch === generation;
    }
    try {
      if (pending.length === 0) {pending = batches(snapshot.units);}
    } catch (error) {
      report(error, "save");
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
    if (pending.length === 0 && !snapshot.refreshError) {return Promise.resolve();}
    publish({ saving: true });
    async function execute() {
      await Promise.resolve();
      try {
        try {
          while (pending.length > 0) {
            if (!isCurrent()) {return;}
            const batch = pending[0];
            if (!batch) {break;}
            batch.wire ??= wireUnitDiff(batch.diff, identities);
            const result = await options.save(id, batch.wire, batch.saveId);
            if (!isActive || epoch !== generation) {return;}
            acceptCreatedIds(batch.diff, result, identities);
            baseline = batch.target;
            pending.shift();
            publish({ lastSavedAt: Date.now(), error: null });
          }
        } catch (error) {
          if (!isActive || epoch !== generation) {return;}
          const status = error && typeof error === "object" && "httpStatus" in error
            ? error.httpStatus
            : undefined;
          if (typeof status === "number" && [400, 401, 403, 422].includes(status)) {pending = [];}
          report(error, "save");
          throw error;
        }
        try {
          if (!isActive || epoch !== generation) {return;}
          await reload(id, epoch);
        } catch (error) {
          if (isActive && epoch === generation) {report(error, "refresh");}
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

  async function flush() {
    const epoch = generation;
    do {
      await saveOnce();
      if (epoch !== generation || !isActive || isSuspended) {return;}
      if (isHalted) {throw new UnitSaveProtocolError(snapshot.error ?? "保存已暂停");}
    } while (snapshot.dirty);
  }

  async function refresh() {
    await flush();
    if (!pageId) {return;}
    const epoch = generation;
    try {
      await reload(pageId, epoch);
    } catch (error) {
      if (isActive && epoch === generation) {report(error, "refresh");}
      throw error;
    }
  }

  return {
    load,
    commit,
    saveOnce,
    flush,
    refresh,
    getSnapshot: () => snapshot,
    setSuspended: (shouldSuspend: boolean) => {
      isSuspended = shouldSuspend;
    },
    setActive: (shouldActivate: boolean) => {
      isActive = shouldActivate;
      if (!shouldActivate) {
        generation += 1;
        running = undefined;
      }
    },
  };
}

export type UnitSaveController = ReturnType<typeof createUnitSaveController>;
