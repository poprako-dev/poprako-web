import { useCallback, useRef } from "react";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";

function createContextMenuHandler(): (event: React.MouseEvent) => void {
  return (event) => {
    event.preventDefault();
  };
}

export function useWorksetInteractions(
  onChangeWorkset: (worksetId: string) => void,
  onModifyWorkset: (workset: WorksetInfo) => void,
): {
  handlePointerDown: (workset: WorksetInfo) => (event: React.PointerEvent) => void;
  handlePointerUp: () => (event: React.PointerEvent) => void;
  handlePointerCancel: () => () => void;
  handleContextMenu: () => (event: React.MouseEvent) => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const worksetRef = useRef<WorksetInfo | null>(null);
  const longPressHandledRef = useRef(false);
  const clearLongPress = useCallback(() => {
    if (!timerRef.current) {
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const handlePointerDown = useCallback(
    (workset: WorksetInfo) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      longPressHandledRef.current = false;
      worksetRef.current = workset;
      timerRef.current = setTimeout(() => {
        longPressHandledRef.current = true;
        onModifyWorkset(workset);
      }, 500);
    },
    [onModifyWorkset],
  );
  const handlePointerUp = useCallback(
    () => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      clearLongPress();
      if (!longPressHandledRef.current && worksetRef.current) {
        onChangeWorkset(worksetRef.current.id);
      }
    },
    [clearLongPress, onChangeWorkset],
  );
  const handlePointerCancel = useCallback(() => clearLongPress, [clearLongPress]);
  const handleContextMenu = useCallback(() => createContextMenuHandler(), []);
  return { handlePointerDown, handlePointerUp, handlePointerCancel, handleContextMenu };
}
