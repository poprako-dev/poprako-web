import { useCallback, useRef } from "react";

type UseLongPressOptions = {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
};

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
}: UseLongPressOptions) {
  const timer = useRef<number | null>(null);
  const longPressHandled = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      longPressHandled.current = false;
      timer.current = window.setTimeout(() => {
        longPressHandled.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (!longPressHandled.current) {
        onClick?.();
      }
    },
    [onClick],
  );

  const onPointerCancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel, onContextMenu };
}
