/* eslint-disable no-console -- persistence failures are diagnostic. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { showLocalCaughtError } from "@/api/util";
import type { UnitInfo } from "@/types/unit";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { SaveUnits } from "../types/type";
import { createUnitSaveController, type SaveSnapshot } from "./unitSaveController";
import { startAutoSaveSchedule } from "./autoSaveSchedule";

export type PendingAction =
  | { type: "navigate"; newIndex: number; targetUnitId?: string | undefined }
  | { type: "exit" };

interface Args {
  onSaveUnits: SaveUnits;
  onReloadUnits: (pageId: string) => Promise<UnitInfo[]>;
  onExit: () => void;
  showToast: (message: string, type: ToastType) => void;
  loadPage: (index: number, targetUnitId?: string) => Promise<void>;
  setUnitBuf: (units: UnitInfo[]) => void;
  autoSaveEnabled: boolean;
}

export function useUnitPersistence(args: Args) {
  const latestRef = useRef(args);
  useLayoutEffect(() => {
    latestRef.current = args;
  });
  const unitBufRef = useRef<UnitInfo[]>([]);
  const navigatingRef = useRef(false);
  const exclusiveRef = useRef(false);
  const pendingRef = useRef<PendingAction | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [state, setState] = useState<SaveSnapshot>({
    units: [],
    dirty: false,
    saving: false,
    error: null,
    refreshError: false,
    lastSavedAt: null,
  });
  // The constructor stores callbacks; refs are read only when those callbacks run.
  // eslint-disable-next-line react-hooks/refs
  const [controller] = useState(() =>
    createUnitSaveController({
      save: (pageId, diff, saveId) => latestRef.current.onSaveUnits(pageId, diff, saveId),
      reload: (pageId) => latestRef.current.onReloadUnits(pageId),
      changed: (next) => {
        if (unitBufRef.current !== next.units) {
          unitBufRef.current = next.units;
          latestRef.current.setUnitBuf(next.units);
        }
        setState(next);
      },
      failed: (error, phase) => {
        console.error(`[BaseTranslator] ${phase} failed`, error);
        showLocalCaughtError(
          error,
          latestRef.current.showToast,
          phase === "refresh" ? "保存已完成，但刷新失败；本地修改已保留" : "保存失败，修改已保留",
          true,
        );
      },
    })
  );

  useEffect(() => {
    controller.setActive(true);
    const schedule = startAutoSaveSchedule(() => {
      if (
        !latestRef.current.autoSaveEnabled || navigatingRef.current ||
        exclusiveRef.current || pendingRef.current
      ) {return;}
      void controller.saveOnce().catch(() => {/* Reported by the controller. */});
    });
    function visible() {
      if (document.visibilityState === "visible") {schedule.check();}
    }
    function beforeUnload(event: BeforeUnloadEvent) {
      const snapshot = controller.getSnapshot();
      if (!snapshot.dirty && !snapshot.saving) {return;}
      event.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- legacy beforeunload support.
      event.returnValue = "";
    }
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      schedule.stop();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("beforeunload", beforeUnload);
      controller.setActive(false);
    };
  }, [controller]);

  const commitUnits = useCallback((units: UnitInfo[], _setter: Args["setUnitBuf"]) => {
    controller.commit(units);
  }, [controller]);

  const setLoadedUnits = useCallback((pageId: string, units: UnitInfo[]) => {
    controller.load(pageId, units);
  }, [controller]);

  const flushIfDirty = useCallback(async (shouldShowSuccess = true) => {
    const hasChanges = controller.getSnapshot().dirty;
    await controller.flush();
    if (shouldShowSuccess && hasChanges && !controller.getSnapshot().refreshError) {
      latestRef.current.showToast("保存成功", "success");
    }
  }, [controller]);

  const runExclusive = useCallback(async (operation: () => Promise<void>) => {
    if (exclusiveRef.current || navigatingRef.current || pendingRef.current) {
      throw new Error("请等待当前操作完成后重试");
    }
    exclusiveRef.current = true;
    try {
      await controller.flush();
      controller.setSuspended(true);
      await operation();
    } finally {
      controller.setSuspended(false);
      exclusiveRef.current = false;
    }
  }, [controller]);

  const perform = useCallback(async (action: PendingAction, shouldDiscard = false) => {
    if (navigatingRef.current || exclusiveRef.current) {return;}
    navigatingRef.current = true;
    pendingRef.current = null;
    setPendingAction(null);
    try {
      if (!shouldDiscard) {await controller.flush();}
    } catch {
      pendingRef.current = action;
      setPendingAction(action);
      navigatingRef.current = false;
      return;
    }
    controller.setSuspended(true);
    try {
      if (action.type === "navigate") {
        await latestRef.current.loadPage(action.newIndex, action.targetUnitId);
      } else {
        latestRef.current.onExit();
      }
    } catch (error) {
      console.error("[BaseTranslator] 页面切换失败", error);
      showLocalCaughtError(error, latestRef.current.showToast, "页面加载失败，请重试");
    } finally {
      controller.setSuspended(false);
      navigatingRef.current = false;
    }
  }, [controller]);

  const handleNavigate = useCallback(async (newIndex: number, targetUnitId?: string) => {
    if (pendingRef.current) {return;}
    await perform({ type: "navigate", newIndex, targetUnitId });
  }, [perform]);
  const handleExit = useCallback(async () => {
    if (!pendingRef.current) {await perform({ type: "exit" });}
  }, [perform]);
  const handleRetryPendingAction = useCallback(async () => {
    if (pendingRef.current) {await perform(pendingRef.current);}
  }, [perform]);
  const handleDiscardPendingAction = useCallback(async () => {
    if (pendingRef.current) {await perform(pendingRef.current, true);}
  }, [perform]);

  return {
    unitBufRef,
    pendingAction,
    saving: state.saving,
    saveState: state,
    commitUnits,
    setLoadedUnits,
    flushIfDirty,
    handleNavigate,
    handleExit,
    handleRetryPendingAction,
    handleDiscardPendingAction,
    runExclusive,
    refreshUnits: controller.refresh,
  };
}
