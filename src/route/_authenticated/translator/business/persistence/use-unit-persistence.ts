import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import type { UnitInfo } from "../unit/unit";
import {
  LocalDraftSavedError,
  type SaveSnapshot,
  type UnitSaveController,
} from "./unit-save-controller";
import { syncChapterDrafts } from "./chapter-draft-sync";
import type { UnitPersistenceArgs, UnitPersistenceResult } from "./unit-persistence-types";
import { usePersistenceLifecycle, useUnitSaveController } from "./unit-persistence-runtime";

export function useUnitPersistence(args: UnitPersistenceArgs): UnitPersistenceResult {
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
  const controller = useUnitSaveController(args, latestRef, unitBufRef, setState);
  usePersistenceLifecycle(controller, latestRef, busyRef, activeRef);
  const flushChapter = useFlushChapter(controller, latestRef);
  const flushIfDirty = useFlushIfDirty(flushChapter, latestRef, busyRef);
  const runExclusive = useRunExclusive(flushChapter, controller, busyRef);
  const retry = useRetryRecovery(controller, busyRef);
  const { handleNavigate, handleExit } = useLeaveActions(
    args.registerLeaveGuard,
    latestRef,
    controller,
    busyRef,
    activeRef,
    approvedExitRef,
  );
  return {
    unitBufRef,
    ...createUnitPersistenceResult({
      state,
      controller,
      flushIfDirty,
      handleNavigate,
      handleExit,
      runExclusive,
      retry,
    }),
  };
}

function createUnitPersistenceResult(input: {
  state: SaveSnapshot;
  controller: UnitSaveController;
  flushIfDirty: (showSuccess?: boolean) => Promise<void>;
  handleNavigate: (index: number, unitId?: string) => Promise<void>;
  handleExit: () => Promise<void>;
  runExclusive: (operation: () => Promise<void>) => Promise<void>;
  retry: () => Promise<void>;
}): Omit<UnitPersistenceResult, "unitBufRef"> {
  return {
    saving: input.state.saving,
    saveState: input.state,
    commitUnits: input.controller.commit,
    setLoadedUnits: input.controller.load,
    flushIfDirty: input.flushIfDirty,
    handleNavigate: input.handleNavigate,
    handleExit: input.handleExit,
    runExclusive: input.runExclusive,
    refreshUnits: input.controller.refresh,
    retryRecovery: input.retry,
  };
}

function useRetryRecovery(
  controller: UnitSaveController,
  busyRef: RefObject<boolean>,
): () => Promise<void> {
  return useCallback(
    async () => runBusyOperation(busyRef, () => controller.retryRecovery()),
    [busyRef, controller],
  );
}

function useFlushChapter(
  controller: UnitSaveController,
  latestRef: RefObject<UnitPersistenceArgs>,
): () => Promise<void> {
  return useCallback(
    () =>
      syncChapterDrafts({
        current: controller,
        drafts: latestRef.current.drafts,
        save: latestRef.current.onSaveUnits,
        reload: latestRef.current.onReloadUnits,
        canWrite: () => latestRef.current.canWrite ?? true,
        failed: (error, phase) => {
          const message = chapterFailureMessage(phase);
          showLocalCaughtError(error, latestRef.current.showToast, message);
        },
      }),
    [controller, latestRef],
  );
}

function chapterFailureMessage(phase: "save" | "refresh" | "local"): string {
  if (phase === "save") return "远程保存失败，已暂存为本地草稿";
  if (phase === "local") return "远程和本地保存均失败，修改仍在当前页面，请勿关闭";
  return "页面刷新失败";
}

function useFlushIfDirty(
  flushChapter: () => Promise<void>,
  latestRef: RefObject<UnitPersistenceArgs>,
  busyRef: RefObject<boolean>,
): (showSuccess?: boolean) => Promise<void> {
  return useCallback(
    async (showSuccess = true) => {
      await runBusyOperation(busyRef, flushChapter);
      if (showSuccess) latestRef.current.showToast("保存成功", "success");
    },
    [busyRef, flushChapter, latestRef],
  );
}

function useRunExclusive(
  flushChapter: () => Promise<void>,
  controller: UnitSaveController,
  busyRef: RefObject<boolean>,
): (operation: () => Promise<void>) => Promise<void> {
  return useCallback(
    async (operation) => {
      await runBusyOperation(busyRef, async () => {
        await flushChapter();
        controller.setSuspended(true);
        try {
          await operation();
        } finally {
          controller.setSuspended(false);
        }
      });
    },
    [busyRef, controller, flushChapter],
  );
}

async function runBusyOperation(
  busyRef: RefObject<boolean>,
  operation: () => Promise<void>,
): Promise<void> {
  if (busyRef.current) throw new Error("请等待当前操作完成后重试");
  busyRef.current = true;
  try {
    await operation();
  } finally {
    busyRef.current = false;
  }
}

function useLeaveActions(
  registerLeaveGuard: UnitPersistenceArgs["registerLeaveGuard"],
  latestRef: RefObject<UnitPersistenceArgs>,
  controller: UnitSaveController,
  busyRef: RefObject<boolean>,
  activeRef: RefObject<boolean>,
  approvedExitRef: RefObject<boolean>,
): {
  handleNavigate: (index: number, unitId?: string) => Promise<void>;
  handleExit: () => Promise<void>;
} {
  const leave = useLeaveOperation(controller, busyRef, activeRef, latestRef);
  const handleNavigate = useCallback(
    async (index: number, targetUnitId?: string) => {
      await leave(() => latestRef.current.loadPage(index, targetUnitId));
    },
    [latestRef, leave],
  );
  const handleExit = useCallback(async () => {
    await leave(() => {
      approvedExitRef.current = true;
      latestRef.current.onExit();
    });
  }, [approvedExitRef, latestRef, leave]);
  useLeaveGuard(registerLeaveGuard, leave, approvedExitRef);
  return { handleNavigate, handleExit };
}

function useLeaveOperation(
  controller: UnitSaveController,
  busyRef: RefObject<boolean>,
  activeRef: RefObject<boolean>,
  latestRef: RefObject<UnitPersistenceArgs>,
): (action: () => void | Promise<void>) => Promise<boolean> {
  return useCallback(
    async (action) => {
      if (busyRef.current) return true;
      busyRef.current = true;
      try {
        await flushBeforeLeaving(controller);
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
    [activeRef, busyRef, controller, latestRef],
  );
}

async function flushBeforeLeaving(controller: UnitSaveController): Promise<void> {
  try {
    await controller.flush();
  } catch (error) {
    if (!(error instanceof LocalDraftSavedError)) throw error;
  }
}

function useLeaveGuard(
  registerLeaveGuard: UnitPersistenceArgs["registerLeaveGuard"],
  leave: (action: () => void | Promise<void>) => Promise<boolean>,
  approvedExitRef: RefObject<boolean>,
): void {
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
  }, [approvedExitRef, registerLeaveGuard, leave]);
}
