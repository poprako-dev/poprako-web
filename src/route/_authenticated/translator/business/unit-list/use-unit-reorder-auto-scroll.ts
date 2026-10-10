import { useCallback, type RefObject } from "react";
import type { DragSession } from "./unit-reorder-types";

const AUTO_SCROLL_EDGE = 32;
const MAX_AUTO_SCROLL_SPEED = 12;

export function useUnitReorderAutoScroll(
  listRef: RefObject<HTMLDivElement | null>,
  dragRef: RefObject<DragSession | null>,
  autoScrollFrameRef: RefObject<number | null>,
  updatePreviewOrder: (clientY: number) => void,
): { stopAutoScroll: () => void; scheduleAutoScroll: () => void } {
  const stopAutoScroll = useCallback(() => {
    const frame = autoScrollFrameRef.current;
    if (frame === null) return;
    cancelAnimationFrame(frame);
    autoScrollFrameRef.current = null;
  }, [autoScrollFrameRef]);
  const scheduleAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) return;
    autoScrollFrameRef.current = requestAnimationFrame(() => {
      runAutoScrollFrame(listRef, dragRef, autoScrollFrameRef, updatePreviewOrder);
    });
  }, [autoScrollFrameRef, dragRef, listRef, updatePreviewOrder]);
  return { stopAutoScroll, scheduleAutoScroll };
}

function runAutoScrollFrame(
  listRef: RefObject<HTMLDivElement | null>,
  dragRef: RefObject<DragSession | null>,
  frameRef: RefObject<number | null>,
  updatePreviewOrder: (clientY: number) => void,
): void {
  frameRef.current = null;
  const session = dragRef.current;
  const list = listRef.current;
  if (!session?.didDrag || !list) return;
  const speed = autoScrollSpeed(list.getBoundingClientRect(), session.lastClientY);
  if (speed === 0) return;
  const previousScrollTop = list.scrollTop;
  list.scrollTop += speed;
  if (list.scrollTop === previousScrollTop) return;
  updatePreviewOrder(session.lastClientY);
  frameRef.current = requestAnimationFrame(() => {
    runAutoScrollFrame(listRef, dragRef, frameRef, updatePreviewOrder);
  });
}

function autoScrollSpeed(rect: DOMRect, clientY: number): number {
  const topStrength = Math.min(
    1,
    Math.max(0, (rect.top + AUTO_SCROLL_EDGE - clientY) / AUTO_SCROLL_EDGE),
  );
  const bottomStrength = Math.min(
    1,
    Math.max(0, (clientY - rect.bottom + AUTO_SCROLL_EDGE) / AUTO_SCROLL_EDGE),
  );
  return (bottomStrength - topStrength) * MAX_AUTO_SCROLL_SPEED;
}
