import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { isBeyondDragThreshold } from "@/route/_authenticated/translator/business/unit-list/drag-threshold";

type Options = {
  enabled: boolean;
  interactionKey: string;
};

type Position = {
  x: number;
  y: number;
  width: number;
  maxHeight: number;
};

type DragSession = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  origin: Position;
  previous: Position | null;
  height: number;
  isDragging: boolean;
  captureTarget: HTMLElement;
};

function constrainPosition(position: Position, height: number): Position {
  const viewport = window.visualViewport;
  const left = (viewport?.offsetLeft ?? 0) + 8;
  const top = (viewport?.offsetTop ?? 0) + 8;
  const availableWidth = Math.max(0, (viewport?.width ?? window.innerWidth) - 16);
  const maxHeight = Math.max(0, (viewport?.height ?? window.innerHeight) - 16);
  const width = Math.min(position.width, availableWidth);
  return {
    x: Math.max(left, Math.min(position.x, left + availableWidth - width)),
    y: Math.max(top, Math.min(position.y, top + maxHeight - Math.min(height, maxHeight))),
    width,
    maxHeight,
  };
}

type DragControls = {
  enabled: boolean;
  floatingRef: RefObject<HTMLDivElement | null>;
  positionRef: { current: Position | null };
  sessionRef: { current: DragSession | null };
  updatePosition: (position: Position | null) => void;
  setIsGripHeld: (held: boolean) => void;
  setPlaceholderHeight: (height: number | null) => void;
};

function finishDragSession(options: DragControls, shouldCommit: boolean): void {
  const session = options.sessionRef.current;
  if (!session) return;
  options.sessionRef.current = null;
  if (!shouldCommit || !session.isDragging) {
    const height = options.floatingRef.current?.getBoundingClientRect().height ?? session.height;
    options.updatePosition(session.previous ? constrainPosition(session.previous, height) : null);
  }
  options.setIsGripHeld(false);
  options.setPlaceholderHeight(null);
  if (session.captureTarget.hasPointerCapture(session.pointerId)) {
    session.captureTarget.releasePointerCapture(session.pointerId);
  }
}

function startDragSession(
  options: DragControls & { finishDrag: (shouldCommit: boolean) => void },
  event: ReactPointerEvent<HTMLButtonElement>,
): void {
  if (!options.enabled || !event.isPrimary || event.button !== 0) return;
  const bar = event.currentTarget.closest<HTMLElement>("[data-special-chars-bar]");
  if (!bar) return;
  event.preventDefault();
  event.stopPropagation();
  options.finishDrag(false);
  const rect = bar.getBoundingClientRect();
  options.sessionRef.current = {
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    startX: event.clientX,
    startY: event.clientY,
    origin: { x: rect.left, y: rect.top, width: rect.width, maxHeight: rect.height },
    previous: options.positionRef.current,
    height: rect.height,
    isDragging: false,
    // The embedded grip unmounts when detached; capture must survive that move.
    captureTarget: document.body,
  };
  document.body.setPointerCapture(event.pointerId);
  options.setIsGripHeld(true);
}

function moveDragSession(event: PointerEvent, options: DragControls): void {
  const session = options.sessionRef.current;
  if (session?.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - session.startX;
  const deltaY = event.clientY - session.startY;
  if (!isBeyondDragThreshold(session.pointerType, deltaX, deltaY) && !session.isDragging) return;
  event.preventDefault();
  if (!session.isDragging) {
    session.isDragging = true;
    if (session.previous === null) options.setPlaceholderHeight(session.height);
  }
  const height = options.floatingRef.current?.getBoundingClientRect().height ?? session.height;
  options.updatePosition(
    constrainPosition(
      { ...session.origin, x: session.origin.x + deltaX, y: session.origin.y + deltaY },
      height,
    ),
  );
}

function finishPointerSession(
  event: PointerEvent,
  sessionRef: DragControls["sessionRef"],
  finishDrag: (shouldCommit: boolean) => void,
  shouldCommit: boolean,
): void {
  if (sessionRef.current?.pointerId === event.pointerId) finishDrag(shouldCommit);
}

function cancelDragOnEscape(
  event: KeyboardEvent,
  sessionRef: DragControls["sessionRef"],
  finishDrag: (shouldCommit: boolean) => void,
): void {
  if (event.key !== "Escape" || !sessionRef.current || event.isComposing) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  finishDrag(false);
}

function useDragListeners(
  options: DragControls & {
    interactionKey: string;
    finishDrag: (shouldCommit: boolean) => void;
  },
): void {
  const { enabled, interactionKey, finishDrag, sessionRef } = options;
  useEffect(() => {
    if (!enabled) return;
    const move = (event: PointerEvent): void => {
      moveDragSession(event, options);
    };
    const release = (event: PointerEvent): void => {
      finishPointerSession(event, sessionRef, finishDrag, true);
    };
    const cancelPointer = (event: PointerEvent): void => {
      finishPointerSession(event, sessionRef, finishDrag, false);
    };
    const cancel = (): void => {
      finishDrag(false);
    };
    const escape = (event: KeyboardEvent): void => {
      cancelDragOnEscape(event, sessionRef, finishDrag);
    };
    const listeners = new AbortController();
    addEventListener("pointermove", move, { passive: false, signal: listeners.signal });
    addEventListener("pointerup", release, { signal: listeners.signal });
    addEventListener("pointercancel", cancelPointer, { signal: listeners.signal });
    addEventListener("lostpointercapture", cancelPointer, {
      capture: true,
      signal: listeners.signal,
    });
    window.addEventListener("blur", cancel, { signal: listeners.signal });
    addEventListener("keydown", escape, { capture: true, signal: listeners.signal });
    return () => {
      finishDrag(false);
      listeners.abort();
    };
  }, [enabled, interactionKey, options, sessionRef, finishDrag]);
}

function useViewportConstraint(options: {
  enabled: boolean;
  isDetached: boolean;
  floatingRef: RefObject<HTMLDivElement | null>;
  positionRef: { current: Position | null };
  updatePosition: (position: Position | null) => void;
}): void {
  const { enabled, isDetached, floatingRef, positionRef, updatePosition } = options;
  useLayoutEffect(() => {
    const element = floatingRef.current;
    if (!isDetached || !enabled || !element) return;
    let constrainFrame: number | null = null;
    const constrainNow = (): void => {
      const current = positionRef.current;
      if (!current) return;
      const next = constrainPosition(current, element.getBoundingClientRect().height);
      if (
        next.x === current.x &&
        next.y === current.y &&
        next.width === current.width &&
        next.maxHeight === current.maxHeight
      )
        return;
      updatePosition(next);
    };
    const constrain = (): void => {
      if (constrainFrame !== null) return;
      constrainFrame = requestAnimationFrame(() => {
        constrainFrame = null;
        constrainNow();
      });
    };
    // Keep a newly mounted or resized toolbar inside the viewport before paint.
    constrainNow();
    const observer = new ResizeObserver(constrain);
    observer.observe(element);
    window.addEventListener("resize", constrain);
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", constrain);
    viewport?.addEventListener("scroll", constrain);
    return () => {
      observer.disconnect();
      if (constrainFrame !== null) cancelAnimationFrame(constrainFrame);
      window.removeEventListener("resize", constrain);
      viewport?.removeEventListener("resize", constrain);
      viewport?.removeEventListener("scroll", constrain);
    };
  }, [enabled, isDetached, floatingRef, positionRef, updatePosition]);
}

type BarDragActions = {
  isGripHeld: boolean;
  placeholderHeight: number | null;
  handleGripPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  dock: () => void;
};

function useBarDragControls(options: {
  enabled: boolean;
  interactionKey: string;
  floatingRef: RefObject<HTMLDivElement | null>;
  positionRef: { current: Position | null };
  updatePosition: (position: Position | null) => void;
}): BarDragActions {
  const { updatePosition } = options;
  const [isGripHeld, setIsGripHeld] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState<number | null>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const controls = useMemo<DragControls>(
    () => ({
      enabled: options.enabled,
      floatingRef: options.floatingRef,
      positionRef: options.positionRef,
      sessionRef,
      updatePosition: options.updatePosition,
      setIsGripHeld,
      setPlaceholderHeight,
    }),
    [options.enabled, options.floatingRef, options.positionRef, options.updatePosition],
  );
  const finishDrag = useCallback(
    (shouldCommit: boolean) => {
      finishDragSession(controls, shouldCommit);
    },
    [controls],
  );
  const startOptions = useMemo(() => ({ ...controls, finishDrag }), [controls, finishDrag]);
  const handleGripPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      startDragSession(startOptions, event);
    },
    [startOptions],
  );
  const dock = useCallback(() => {
    finishDrag(false);
    updatePosition(null);
  }, [finishDrag, updatePosition]);
  const listenerOptions = useMemo(
    () => ({ ...controls, interactionKey: options.interactionKey, finishDrag }),
    [controls, options.interactionKey, finishDrag],
  );
  useDragListeners(listenerOptions);
  return { isGripHeld, placeholderHeight, handleGripPointerDown, dock };
}

export function useDetachableSpecialCharsBar({ enabled, interactionKey }: Options): {
  isEnabled: boolean;
  position: Position | null;
  isGripHeld: boolean;
  placeholderHeight: number | null;
  floatingRef: RefObject<HTMLDivElement | null>;
  handleGripPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  dock: () => void;
} {
  const [position, setPosition] = useState<Position | null>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position | null>(null);

  const updatePosition = useCallback((next: Position | null) => {
    positionRef.current = next;
    setPosition(next);
  }, []);
  const drag = useBarDragControls({
    enabled,
    interactionKey,
    floatingRef,
    positionRef,
    updatePosition,
  });
  const isDetached = position !== null;
  useViewportConstraint({ enabled, isDetached, floatingRef, positionRef, updatePosition });

  return {
    isEnabled: enabled,
    position,
    isGripHeld: drag.isGripHeld,
    placeholderHeight: drag.placeholderHeight,
    floatingRef,
    handleGripPointerDown: drag.handleGripPointerDown,
    dock: drag.dock,
  };
}

export type SpecialCharsBarController = ReturnType<typeof useDetachableSpecialCharsBar>;
