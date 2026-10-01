import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import type { UnitInfo } from "../unit/unit";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { SaveUnits } from "../contract/type";
import {
  createUnitSaveController,
  LocalDraftSavedError,
  type SaveSnapshot,
} from "./unit-save-controller";
import { startAutoSaveSchedule } from "./auto-save-schedule";
import type { DraftStore } from "./draft-store";
import { syncChapterDrafts } from "./chapter-draft-sync";
type Args = {
  onSaveUnits: SaveUnits;
  onReloadUnits: (pageId: string) => Promise<UnitInfo[]>;
  onExit: () => void;
  showToast: (message: string, type: ToastType) => void;
  loadPage: (index: number, targetUnitId?: string) => Promise<void>;
  setUnitBuf: (units: UnitInfo[]) => void;
  autoSaveEnabled: boolean;
  drafts?: DraftStore | undefined;
  canWrite?: boolean | undefined;
  registerLeaveGuard?: ((guard: (() => Promise<boolean>) | null) => void) | undefined;
};
export function useUnitPersistence(args: Args): {
  unitBufRef: RefObject<UnitInfo[]>;
  saving: boolean;
  saveState: SaveSnapshot;
  commitUnits: (units: UnitInfo[]) => void;
  setLoadedUnits: (pageId: string, units: UnitInfo[]) => void;
  flushIfDirty: (showSuccess?: boolean) => Promise<void>;
  handleNavigate: (index: number, targetUnitId?: string) => Promise<void>;
  handleExit: () => Promise<void>;
  runExclusive: (operation: () => Promise<void>) => Promise<void>;
  refreshUnits: () => Promise<void>;
  retryRecovery: () => Promise<void>;
} {
  const latestRef = useRef(args);
  useLayoutEffect(() => {
    latestRef.current = args;
  });
  const unitBufRef = useRef<UnitInfo[]>([]);
  const busyRef = useRef(false);
  const approvedExitRef = useRef(false);
  const activeRef = useRef(true);
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
      drafts: args.drafts,
      canWrite: () => latestRef.current.canWrite ?? true,
      save: (id, diff, saveId) => latestRef.current.onSaveUnits(id, diff, saveId),
      reload: (id) => latestRef.current.onReloadUnits(id),
      changed: (next) => {
        if (unitBufRef.current !== next.units) {
          unitBufRef.current = next.units;
          latestRef.current.setUnitBuf(next.units);
        }
        setState(next);
      },
      failed: (error, phase) => {
        if (phase === "save")
          showLocalCaughtError(
            error,
            latestRef.current.showToast,
            "远程保存失败，已暂存为本地草稿",
          );
        else
          showLocalCaughtError(
            error,
            latestRef.current.showToast,
            phase === "refresh"
              ? "保存成功，页面刷新失败"
              : "远程和本地保存均失败，修改仍在当前页面，请勿关闭",
          );
      },
    }),
  );
  useEffect(() => {
    activeRef.current = true;
    controller.setActive(true);
    const schedule = startAutoSaveSchedule(() => {
      if (!latestRef.current.autoSaveEnabled || busyRef.current) return;
      void controller.saveOnce().catch(() => {
        /* Controller reports failure. */
      });
    });
    function visible(): void {
      if (document.visibilityState === "visible") schedule.check();
    }
    function beforeUnload(event: BeforeUnloadEvent): void {
      if (
        !controller.getSnapshot().dirty &&
        !controller.getSnapshot().saving &&
        !Object.keys(latestRef.current.drafts?.getState().drafts ?? {}).length
      )
        return;
      event.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- legacy beforeunload support.
      event.returnValue = "";
    }
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      activeRef.current = false;
      schedule.stop();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("beforeunload", beforeUnload);
      controller.setActive(false);
    };
  }, [controller]);
  const flushChapter = useCallback(
    () =>
      syncChapterDrafts({
        current: controller,
        drafts: latestRef.current.drafts,
        save: latestRef.current.onSaveUnits,
        reload: latestRef.current.onReloadUnits,
        canWrite: () => latestRef.current.canWrite ?? true,
        failed: (error, phase) => {
          showLocalCaughtError(
            error,
            latestRef.current.showToast,
            phase === "save"
              ? "远程保存失败，已暂存为本地草稿"
              : phase === "local"
                ? "远程和本地保存均失败，修改仍在当前页面，请勿关闭"
                : "页面刷新失败",
          );
        },
      }),
    [controller],
  );
  const flushIfDirty = useCallback(
    async (showSuccess = true) => {
      if (busyRef.current) throw new Error("请等待当前操作完成后重试");
      busyRef.current = true;
      try {
        await flushChapter();
        if (showSuccess) latestRef.current.showToast("保存成功", "success");
      } finally {
        busyRef.current = false;
      }
    },
    [flushChapter],
  );
  const runExclusive = useCallback(
    async (operation: () => Promise<void>) => {
      if (busyRef.current) throw new Error("请等待当前操作完成后重试");
      busyRef.current = true;
      try {
        await flushChapter();
        controller.setSuspended(true);
        await operation();
      } finally {
        controller.setSuspended(false);
        busyRef.current = false;
      }
    },
    [controller, flushChapter],
  );
  const leave = useCallback(
    async (action: () => void | Promise<void>): Promise<boolean> => {
      if (busyRef.current) return true;
      busyRef.current = true;
      try {
        try {
          await controller.flush();
        } catch (error) {
          if (!(error instanceof LocalDraftSavedError)) return true;
        }
        if (!activeRef.current) return true;
        controller.setSuspended(true);
        await action();
        return false;
      } catch (error) {
        showLocalCaughtError(error, latestRef.current.showToast, "页面加载失败，请重试");
        return true;
      } finally {
        controller.setSuspended(false);
        busyRef.current = false;
      }
    },
    [controller],
  );
  const handleNavigate = useCallback(
    async (index: number, targetUnitId?: string) => {
      await leave(() => latestRef.current.loadPage(index, targetUnitId));
    },
    [leave],
  );
  const handleExit = useCallback(async () => {
    await leave(() => {
      approvedExitRef.current = true;
      latestRef.current.onExit();
    });
  }, [leave]);
  const registerLeaveGuard = args.registerLeaveGuard;
  useEffect(() => {
    registerLeaveGuard?.(() => {
      if (approvedExitRef.current) {
        approvedExitRef.current = false;
        return Promise.resolve(false);
      }
      return leave(() => {
        /* Router continues after this guard resolves. */
      });
    });
    return () => registerLeaveGuard?.(null);
  }, [registerLeaveGuard, leave]);
  return {
    unitBufRef,
    saving: state.saving,
    saveState: state,
    commitUnits: controller.commit,
    setLoadedUnits: controller.load,
    flushIfDirty,
    handleNavigate,
    handleExit,
    runExclusive,
    refreshUnits: controller.refresh,
    retryRecovery: async () => {
      if (busyRef.current) throw new Error("请等待当前操作完成后重试");
      busyRef.current = true;
      try {
        await controller.retryRecovery();
      } finally {
        busyRef.current = false;
      }
    },
  };
}
