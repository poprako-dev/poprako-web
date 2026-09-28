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

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
}: UseLongPressOptions): Handlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    [onLongPress, threshold],
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
    [onClick],
  );

  const onPointerCancel = useCallback(() => {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const onContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel, onContextMenu };
}
