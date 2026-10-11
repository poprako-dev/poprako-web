// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearDragListeners, startPageDrag, type DragContext } from "./page-drag";

const contexts: DragContext[] = [];

function createDragHarness(): DragContext {
  const image = document.createElement("img");
  vi.spyOn(image, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 200));
  const context: DragContext = {
    dragRef: { current: null },
    dragMarkerRef: { current: null },
    windowHandlersRef: { current: null },
    setIsPanning: vi.fn(),
    setDragMarker: vi.fn(),
    setTransform: vi.fn(),
    imgRef: { current: image },
    transform: { scale: 2, offsetX: 10, offsetY: 20 },
    onFocusMarker: vi.fn(),
    onMoveMarker: vi.fn(),
    tryAddMarker: vi.fn(),
  };
  contexts.push(context);
  return context;
}

function pointer(type: "mousemove" | "mouseup", x: number, y: number): void {
  dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y }));
}

function startMarker(context: DragContext): void {
  startPageDrag(
    {
      type: "marker",
      startX: 20,
      startY: 30,
      markerId: "marker-1",
      startMarkerX: 0.5,
      startMarkerY: 0.5,
    },
    context,
  );
}

afterEach(() => {
  for (const context of contexts.splice(0)) {
    clearDragListeners(context.windowHandlersRef);
  }
  vi.restoreAllMocks();
});

describe("page drag clicks", () => {
  it("creates an alternate marker when a canvas drag stays below the pan threshold", () => {
    const context = createDragHarness();
    startPageDrag({ type: "pan", startX: 20, startY: 30 }, context);
    pointer("mousemove", 24, 34);
    pointer("mouseup", 24, 34);
    expect(context.tryAddMarker).toHaveBeenCalledWith(24, 34, true);
    expect(context.setTransform).not.toHaveBeenCalled();
    expect(context.windowHandlersRef.current).toBeNull();
  });

  it("focuses a marker when movement stays below the marker threshold", () => {
    const context = createDragHarness();
    startMarker(context);
    pointer("mousemove", 21, 31);
    pointer("mouseup", 21, 31);
    expect(context.onFocusMarker).toHaveBeenCalledWith("marker-1");
    expect(context.onMoveMarker).not.toHaveBeenCalled();
    expect(context.setDragMarker).not.toHaveBeenCalled();
  });
});

describe("page drag movement", () => {
  it("pans relative to the offsets captured at drag start", () => {
    const context = createDragHarness();
    let transform = context.transform;
    context.setTransform = vi.fn((update: Parameters<DragContext["setTransform"]>[0]) => {
      transform = typeof update === "function" ? update(transform) : update;
    });
    startPageDrag({ type: "pan", startX: 20, startY: 30 }, context);
    pointer("mousemove", 40, 50);
    expect(transform).toEqual({ scale: 2, offsetX: 30, offsetY: 40 });
    expect(context.setIsPanning).toHaveBeenCalledWith(true);
    pointer("mouseup", 40, 50);
    expect(context.setIsPanning).toHaveBeenLastCalledWith(false);
    expect(context.tryAddMarker).not.toHaveBeenCalled();
  });

  it("clamps marker previews and commits the latest preview before clearing it", () => {
    const context = createDragHarness();
    startMarker(context);
    pointer("mousemove", 300, -100);
    expect(context.dragMarkerRef.current).toEqual({ id: "marker-1", x: 1, y: 0 });
    pointer("mouseup", 310, -110);
    expect(context.onMoveMarker).toHaveBeenCalledWith("marker-1", 1, 0);
    expect(context.dragMarkerRef.current).toBeNull();
    expect(context.setDragMarker).toHaveBeenLastCalledWith(null);
    expect(context.onFocusMarker).not.toHaveBeenCalled();
  });
});

describe("page drag cleanup", () => {
  it("removes global listeners when its owner unmounts", () => {
    const context = createDragHarness();
    startMarker(context);
    clearDragListeners(context.windowHandlersRef);
    pointer("mousemove", 80, 90);
    pointer("mouseup", 80, 90);
    expect(context.windowHandlersRef.current).toBeNull();
    expect(context.setDragMarker).not.toHaveBeenCalled();
    expect(context.onMoveMarker).not.toHaveBeenCalled();
  });

  it("uses the original marker coordinates when the image disappears during dragging", () => {
    const context = createDragHarness();
    startMarker(context);
    context.imgRef.current = null;
    pointer("mousemove", 80, 90);
    pointer("mouseup", 80, 90);
    expect(context.onMoveMarker).toHaveBeenCalledWith("marker-1", 0.5, 0.5);
    expect(context.dragMarkerRef.current).toBeNull();
  });
});
