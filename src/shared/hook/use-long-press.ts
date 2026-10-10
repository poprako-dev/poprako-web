import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

type UseLongPressOptions = {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
};

interface Handlers {
  onPointerDown: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onPointerCancel: () => void;
  onContextMenu: (event: MouseEvent) => void;
}

function usePressTimer(): React.RefObject<ReturnType<typeof setTimeout> | null> {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return timerRef;
}

function preventContextMenu(event: MouseEvent): void {
  event.preventDefault();
}

function usePressCancellation(
  timerRef: React.RefObject<ReturnType<typeof setTimeout> | null>,
): () => void {
  return useCallback(() => {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, [timerRef]);
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
}: UseLongPressOptions): Handlers {
  const timerRef = usePressTimer();
  const longPressHandledRef = useRef(false);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      longPressHandledRef.current = false;
      timerRef.current = setTimeout(() => {
        longPressHandledRef.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold, timerRef],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!longPressHandledRef.current) {
        onClick?.();
      }
    },
    [onClick, timerRef],
  );

  const onPointerCancel = usePressCancellation(timerRef);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onContextMenu: preventContextMenu,
  };
}
