import { useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { PageRect } from "@/shared/utility/page-geometry";
import { shouldIgnoreWorkbenchKey } from "@/shared/utility/keyboard-scope";
import { adjustRectangle, imagePoint, type Point, type RectAction } from "./issue-geometry";

type Gesture = {
  pointerId: number;
  target: HTMLElement;
  id: string | null;
  action: RectAction;
  start: Point;
  initial: PageRect;
  rect: PageRect;
  bounds: DOMRect;
};
type Options = {
  imageRef: RefObject<HTMLImageElement | HTMLCanvasElement | null>;
  onCommit: (id: string | null, rect: PageRect) => void;
  onCancel: () => void;
};

export type IssueGesture = {
  preview: { id: string | null; rect: PageRect } | null;
  start: (event: PointerEvent<HTMLElement>, action: RectAction, issue?: IssueInfo) => void;
  cancel: () => void;
  events: {
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: () => void;
    onLostPointerCapture: () => void;
  };
};

export function useIssueGesture(options: Options): IssueGesture {
  const gestureRef = useRef<Gesture | null>(null);
  const [preview, setPreview] = useState<{ id: string | null; rect: PageRect } | null>(null);
  function cancel(): void {
    const current = gestureRef.current;
    gestureRef.current = null;
    if (current?.target.hasPointerCapture(current.pointerId))
      current.target.releasePointerCapture(current.pointerId);
    setPreview(null);
    options.onCancel();
  }
  function move(event: PointerEvent<HTMLElement>): void {
    const current = gestureRef.current;
    if (current?.pointerId !== event.pointerId) return;
    const end = imagePoint({ x: event.clientX, y: event.clientY }, current.bounds);
    current.rect = adjustRectangle(current.initial, current.start, end, current.action);
    setPreview({ id: current.id, rect: current.rect });
  }
  function finish(event: PointerEvent<HTMLElement>): void {
    const current = gestureRef.current;
    if (current?.pointerId !== event.pointerId) return;
    move(event);
    const valid =
      current.rect.width * current.bounds.width >= 4 &&
      current.rect.height * current.bounds.height >= 4;
    if (valid) options.onCommit(current.id, current.rect);
    cancel();
  }
  useGestureEscape(cancel);
  return {
    preview,
    start: (event, action, issue) => {
      startGesture(gestureRef, options, setPreview, event, action, issue);
    },
    cancel,
    events: {
      onPointerMove: move,
      onPointerUp: finish,
      onPointerCancel: cancel,
      onLostPointerCapture: () => {
        if (gestureRef.current) cancel();
      },
    },
  };
}

function useGestureEscape(cancel: () => void): void {
  useEffect(() => {
    function escape(event: KeyboardEvent): void {
      if (event.key === "Escape" && !shouldIgnoreWorkbenchKey(event)) cancel();
    }
    globalThis.addEventListener("keydown", escape);
    return () => {
      globalThis.removeEventListener("keydown", escape);
    };
  }, [cancel]);
}

function startGesture(
  gestureRef: RefObject<Gesture | null>,
  options: Options,
  setPreview: (value: IssueGesture["preview"]) => void,
  event: PointerEvent<HTMLElement>,
  action: RectAction,
  issue?: IssueInfo,
): void {
  if (event.button !== 0 || !event.isPrimary || gestureRef.current) return;
  const bounds = options.imageRef.current?.getBoundingClientRect();
  if (!bounds?.width || !bounds.height) return;
  event.preventDefault();
  event.stopPropagation();
  const point = imagePoint({ x: event.clientX, y: event.clientY }, bounds);
  const rect = issue?.rect ?? { xCoord: point.x, yCoord: point.y, width: 0, height: 0 };
  gestureRef.current = {
    pointerId: event.pointerId,
    target: event.currentTarget,
    id: issue?.id ?? null,
    action,
    start: point,
    initial: rect,
    rect,
    bounds,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  setPreview({ id: issue?.id ?? null, rect });
}
