import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import type { UnitInfo } from "../unit/unit";
import type { SaveSnapshot, UnitSaveController } from "./unit-save-controller";
import { createUnitSaveController } from "./unit-save-controller";
import { startAutoSaveSchedule } from "./auto-save-schedule";
import type { UnitPersistenceArgs } from "./unit-persistence-types";

export function useUnitSaveController(
  args: UnitPersistenceArgs,
  latestRef: RefObject<UnitPersistenceArgs>,
  unitBufRef: RefObject<UnitInfo[]>,
  setState: Dispatch<SetStateAction<SaveSnapshot>>,
): UnitSaveController {
  // The controller retains callbacks; they read refs only after controller events run.
  // eslint-disable-next-line react-hooks/refs -- constructor stores callbacks without invoking them.
  const [controller] = useState(() =>
    createUnitSaveController({
      drafts: args.drafts,
      canWrite: () => latestRef.current.canWrite ?? true,
      save: (id, diff, saveId) => latestRef.current.onSaveUnits(id, diff, saveId),
      reload: (id) => latestRef.current.onReloadUnits(id),
      changed: (next) => {
        publishSaveSnapshot(next, latestRef, unitBufRef, setState);
      },
      failed: (error, phase) => {
        reportSaveFailure(error, phase, latestRef);
      },
    }),
  );
  return controller;
}

function publishSaveSnapshot(
  next: SaveSnapshot,
  latestRef: RefObject<UnitPersistenceArgs>,
  unitBufRef: RefObject<UnitInfo[]>,
  setState: Dispatch<SetStateAction<SaveSnapshot>>,
): void {
  if (unitBufRef.current !== next.units) {
    unitBufRef.current = next.units;
    latestRef.current.setUnitBuf(next.units);
  }
  setState(next);
}

function reportSaveFailure(
  error: unknown,
  phase: "save" | "refresh" | "local",
  latestRef: RefObject<UnitPersistenceArgs>,
): void {
  const message =
    phase === "save"
      ? "远程保存失败，已暂存为本地草稿"
      : phase === "refresh"
        ? "保存成功，页面刷新失败"
        : "远程和本地保存均失败，修改仍在当前页面，请勿关闭";
  showLocalCaughtError(error, latestRef.current.showToast, message);
}

export function usePersistenceLifecycle(
  controller: UnitSaveController,
  latestRef: RefObject<UnitPersistenceArgs>,
  busyRef: RefObject<boolean>,
  activeRef: RefObject<boolean>,
): void {
  useEffect(
    () => attachPersistenceLifecycle(controller, latestRef, busyRef, activeRef),
    [activeRef, busyRef, controller, latestRef],
  );
}

function attachPersistenceLifecycle(
  controller: UnitSaveController,
  latestRef: RefObject<UnitPersistenceArgs>,
  busyRef: RefObject<boolean>,
  activeRef: RefObject<boolean>,
): () => void {
  activeRef.current = true;
  controller.setActive(true);
  const schedule = startAutoSaveSchedule(() => {
    if (!latestRef.current.autoSaveEnabled || busyRef.current) return;
    void controller.saveOnce().catch(() => {
      /* Controller reports failure. */
    });
  });
  const visible = (): void => {
    if (document.visibilityState === "visible") schedule.check();
  };
  const beforeUnload = (event: BeforeUnloadEvent): void => {
    if (!isPersistenceDirty(controller, latestRef)) return;
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- legacy beforeunload support.
    event.returnValue = "";
  };
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("beforeunload", beforeUnload);
  return () => {
    cleanupPersistenceLifecycle(controller, activeRef, schedule, visible, beforeUnload);
  };
}

function isPersistenceDirty(
  controller: UnitSaveController,
  latestRef: RefObject<UnitPersistenceArgs>,
): boolean {
  const snapshot = controller.getSnapshot();
  return snapshot.dirty || snapshot.saving || hasDrafts(latestRef);
}

function cleanupPersistenceLifecycle(
  controller: UnitSaveController,
  activeRef: RefObject<boolean>,
  schedule: ReturnType<typeof startAutoSaveSchedule>,
  visible: () => void,
  beforeUnload: (event: BeforeUnloadEvent) => void,
): void {
  activeRef.current = false;
  schedule.stop();
  document.removeEventListener("visibilitychange", visible);
  window.removeEventListener("beforeunload", beforeUnload);
  controller.setActive(false);
}

function hasDrafts(latestRef: RefObject<UnitPersistenceArgs>): boolean {
  return Object.keys(latestRef.current.drafts?.getState().drafts ?? {}).length > 0;
}
