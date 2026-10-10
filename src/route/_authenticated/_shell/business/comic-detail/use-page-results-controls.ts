import { useCallback } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { useAppStore } from "@/route/business/session/session-store";
import type { PageResultsOwner } from "./page-results-owner";

type Args = {
  ownerRef: RefObject<PageResultsOwner>;
  isCurrent: (owner: PageResultsOwner, epoch?: number) => boolean;
  load: (owner: PageResultsOwner) => Promise<void>;
  fillTasks: (owner: PageResultsOwner) => Promise<void>;
  setServerPages: Dispatch<SetStateAction<PageInfo[]>>;
  setIsPagesLoading: Dispatch<SetStateAction<boolean>>;
  setPageRecoveryNeeded: Dispatch<SetStateAction<boolean>>;
};

interface Controls {
  reloadCurrentPages: () => Promise<void>;
  capture: () => () => boolean;
  captureSession: () => () => boolean;
  clear: () => void;
}

export function usePageResultsControls(args: Args): Controls {
  const {
    ownerRef,
    isCurrent,
    load,
    fillTasks,
    setServerPages,
    setIsPagesLoading,
    setPageRecoveryNeeded,
  } = args;
  const reloadCurrentPages = useCallback(async () => {
    const owner = ownerRef.current;
    if (!isCurrent(owner) || !owner.chapterId) return;
    owner.failed.clear();
    await Promise.all([load(owner), fillTasks(owner)]);
  }, [fillTasks, isCurrent, load, ownerRef]);
  const capture = useCallback(() => {
    const owner = ownerRef.current;
    const epoch = owner.epoch;
    return () => isCurrent(owner, epoch);
  }, [isCurrent, ownerRef]);
  const captureSession = useCallback(() => {
    const expected = ownerRef.current.generation;
    return () => useAppStore.getState().generation === expected;
  }, [ownerRef]);
  const clear = useCallback(() => {
    clearPageResults(ownerRef.current, setServerPages, setIsPagesLoading, setPageRecoveryNeeded);
  }, [ownerRef, setIsPagesLoading, setPageRecoveryNeeded, setServerPages]);
  return { reloadCurrentPages, capture, captureSession, clear };
}

function clearPageResults(
  owner: PageResultsOwner,
  setServerPages: Dispatch<SetStateAction<PageInfo[]>>,
  setIsPagesLoading: Dispatch<SetStateAction<boolean>>,
  setPageRecoveryNeeded: Dispatch<SetStateAction<boolean>>,
): void {
  owner.epoch++;
  owner.fills.clear();
  owner.pending.clear();
  owner.failed.clear();
  owner.succeeded.clear();
  setServerPages([]);
  setIsPagesLoading(false);
  setPageRecoveryNeeded(false);
}
