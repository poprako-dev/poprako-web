import { afterEach, expect, it, vi } from "vitest";
import { waitForCanvasRelease } from "./wait-for-canvas-release";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("waits for DOM detachment and a subsequent presentation frame", async () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => frames.push(callback));
  const element = { isConnected: true };
  const complete = vi.fn();
  const release = waitForCanvasRelease(element as HTMLCanvasElement).then(complete);
  frames.shift()?.(0);
  await Promise.resolve();
  expect(complete).not.toHaveBeenCalled();
  element.isConnected = false;
  frames.shift()?.(16);
  await Promise.resolve();
  expect(complete).not.toHaveBeenCalled();
  frames.shift()?.(32);
  await release;
  expect(complete).toHaveBeenCalledOnce();
  expect(frames).toHaveLength(0);
});

it("does not wait for presentation for a surface that was never attached", async () => {
  const schedule = vi.fn();
  vi.stubGlobal("requestAnimationFrame", schedule);
  await waitForCanvasRelease({ isConnected: false } as HTMLCanvasElement);
  expect(schedule).not.toHaveBeenCalled();
});
