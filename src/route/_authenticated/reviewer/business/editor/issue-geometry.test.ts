import { expect, test } from "vitest";
import { adjustRectangle, imagePoint, rectangleBetween } from "./issue-geometry";

test("coordinates remain normalized through zoom and clamp at the image edges", () => {
  const bounds = { left: 100, top: 200, width: 1200, height: 1600 } as DOMRect;
  expect(imagePoint({ x: 400, y: 1000 }, bounds)).toEqual({ x: 0.25, y: 0.5 });
  expect(imagePoint({ x: 0, y: 3000 }, bounds)).toEqual({ x: 0, y: 1 });
});

test("reverse drawing and corner crossing keep positive dimensions", () => {
  expect(rectangleBetween({ x: 0.75, y: 0.75 }, { x: 0.25, y: 0.25 })).toEqual({
    xCoord: 0.25,
    yCoord: 0.25,
    width: 0.5,
    height: 0.5,
  });
  const rect = { xCoord: 0.25, yCoord: 0.25, width: 0.25, height: 0.25 };
  expect(adjustRectangle(rect, { x: 0.25, y: 0.25 }, { x: 0.75, y: 0.75 }, "nw")).toEqual({
    xCoord: 0.5,
    yCoord: 0.5,
    width: 0.25,
    height: 0.25,
  });
});

test("moving preserves rectangle dimensions within the page", () => {
  const rect = { xCoord: 0.25, yCoord: 0.25, width: 0.5, height: 0.5 };
  expect(adjustRectangle(rect, { x: 0.25, y: 0.25 }, { x: 1, y: 0 }, "move")).toEqual({
    xCoord: 0.5,
    yCoord: 0,
    width: 0.5,
    height: 0.5,
  });
});
