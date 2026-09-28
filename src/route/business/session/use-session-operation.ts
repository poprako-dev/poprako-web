import { useCallback, useEffect, useRef } from "react";
import { useReadySession } from "./ready-session";
import { useAppStore } from "./session-store";

export type SessionOperation = {
  signal: AbortSignal;
  assertCurrent: () => void;
  isCurrent: () => boolean;
};
/** One session-bound operation per owner. Logout, replacement and unmount abort it. */
export function useSessionOperation(): () => SessionOperation {
  const { generation } = useReadySession();
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      if (state.generation !== generation) controllerRef.current?.abort();
    });
    return () => {
      unsubscribe();
      controllerRef.current?.abort();
    };
  }, [generation]);
  return useCallback(() => {
    controllerRef.current?.abort();
    const next = new AbortController();
    controllerRef.current = next;
    const isCurrent = (): boolean =>
      !next.signal.aborted && useAppStore.getState().generation === generation;
    return {
      signal: next.signal,
      isCurrent,
      assertCurrent: () => {
        if (!isCurrent()) throw new DOMException("会话操作已取消", "AbortError");
      },
    };
  }, [generation]);
}
