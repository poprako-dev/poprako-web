import type { PageRect } from "@/shared/utility/page-geometry";

export type Point = { x: number; y: number };
export type RectAction = "create" | "move" | "nw" | "ne" | "sw" | "se";

function clamp(value: number, max = 1): number {
  return Math.max(0, Math.min(max, value));
}

export function imagePoint(client: Point, bounds: DOMRect): Point {
  return {
    x: clamp((client.x - bounds.left) / bounds.width),
    y: clamp((client.y - bounds.top) / bounds.height),
  };
}

export function rectangleBetween(start: Point, end: Point): PageRect {
  return {
    xCoord: Math.min(start.x, end.x),
    yCoord: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function adjustRectangle(
  rect: PageRect,
  start: Point,
  end: Point,
  action: RectAction,
): PageRect {
  if (action === "create") return rectangleBetween(start, end);
  if (action === "move")
    return {
      ...rect,
      xCoord: clamp(rect.xCoord + end.x - start.x, 1 - rect.width),
      yCoord: clamp(rect.yCoord + end.y - start.y, 1 - rect.height),
    };
  const anchor = {
    x: rect.xCoord + (action.endsWith("w") ? rect.width : 0),
    y: rect.yCoord + (action.startsWith("n") ? rect.height : 0),
  };
  return rectangleBetween(anchor, end);
}
