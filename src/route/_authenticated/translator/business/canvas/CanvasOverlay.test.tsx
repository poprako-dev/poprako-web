import type { ComponentProps } from "react";
import { fireEvent, render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CanvasOverlay } from "./CanvasOverlay";
import { undoUnit } from "../test/unit-undo-fixture";

function overlayProps(): ComponentProps<typeof CanvasOverlay> {
  return {
    scale: 1,
    units: [{ ...undoUnit("u1", "translated"), xCoord: 0.2, yCoord: 0.3 }],
    mode: "translate",
    dragMarker: null,
    focusedUnitId: undefined,
    enableReadOnly: false,
    proofreadPreviewVisibility: "visible",
    hoveredUnitId: null,
    onFocusUnit: vi.fn(),
    onMoveStart: vi.fn(),
    onTouchStart: vi.fn(),
    onToggleBubble: vi.fn(),
    onHover: vi.fn(),
    onUnhover: vi.fn(),
  };
}

test("retained markers call the latest committed handlers and retain pointer source coordinates", () => {
  const props = overlayProps();
  const view = render(<CanvasOverlay {...props} />);
  const marker = view.getByRole("button", { name: "第 1 个 Unit" });
  const next = overlayProps();
  view.rerender(<CanvasOverlay {...next} />);
  expect(view.getByRole("button", { name: "第 1 个 Unit" })).toBe(marker);
  fireEvent.keyDown(marker, { key: "Enter" });
  fireEvent.mouseDown(marker);
  fireEvent.touchStart(marker);
  fireEvent.doubleClick(marker);
  fireEvent.mouseEnter(marker);
  fireEvent.mouseLeave(marker);
  expect(next.onFocusUnit).toHaveBeenCalledWith("u1");
  expect(next.onMoveStart).toHaveBeenCalledWith(expect.anything(), "u1", 0.2, 0.3);
  expect(next.onTouchStart).toHaveBeenCalledWith(expect.anything(), "u1", 0.2, 0.3);
  expect(next.onToggleBubble).toHaveBeenCalledWith("u1");
  expect(next.onHover).toHaveBeenCalledWith("u1");
  expect(next.onUnhover).toHaveBeenCalledWith("u1");
  expect(props.onFocusUnit).not.toHaveBeenCalled();
  expect(props.onMoveStart).not.toHaveBeenCalled();
  expect(props.onTouchStart).not.toHaveBeenCalled();
});

test("dragging hides preview, updates its marker position, and keeps original drag coordinates", () => {
  const props = overlayProps();
  const view = render(<CanvasOverlay {...props} hoveredUnitId="u1" />);
  const marker = view.getByRole("button", { name: "第 1 个 Unit" });
  expect(view.getByText("translated")).toBeVisible();
  view.rerender(
    <CanvasOverlay {...props} hoveredUnitId="u1" dragMarker={{ id: "u1", x: 0.7, y: 0.8 }} />,
  );
  expect(marker).toHaveStyle({ left: "70%", top: "80%" });
  expect(view.queryByText("translated")).toBeNull();
  fireEvent.mouseDown(marker);
  expect(props.onMoveStart).toHaveBeenCalledWith(expect.anything(), "u1", 0.2, 0.3);
  const units = props.units.map((unit) => ({ ...unit, xCoord: 0.7, yCoord: 0.8 }));
  view.rerender(<CanvasOverlay {...props} units={units} hoveredUnitId="u1" />);
  fireEvent.touchStart(marker);
  expect(props.onTouchStart).toHaveBeenCalledWith(expect.anything(), "u1", 0.7, 0.8);
  expect(view.getByText("translated")).toBeVisible();
});

test("read-only focus, preview mode and bubble permissions remain responsive", () => {
  const props = overlayProps();
  const view = render(<CanvasOverlay {...props} mode="proofread" focusedUnitId="u1" />);
  expect(view.getByText("translated")).toBeVisible();
  const marker = view.getByRole("button", { name: "第 1 个 Unit" });
  view.rerender(<CanvasOverlay {...props} enableReadOnly proofreadPreviewVisibility="dimmed" />);
  fireEvent.doubleClick(marker);
  expect(props.onToggleBubble).not.toHaveBeenCalled();
  fireEvent.keyDown(marker, { key: " " });
  expect(props.onFocusUnit).toHaveBeenCalledWith("u1");
  expect(view.queryByText("translated")).toBeNull();
  view.rerender(
    <CanvasOverlay
      {...props}
      enableReadOnly
      hoveredUnitId="u1"
      proofreadPreviewVisibility="dimmed"
    />,
  );
  expect(view.getByText("translated")).toBeVisible();
  view.rerender(<CanvasOverlay {...props} />);
  fireEvent.doubleClick(marker);
  expect(props.onToggleBubble).toHaveBeenCalledWith("u1");
});
