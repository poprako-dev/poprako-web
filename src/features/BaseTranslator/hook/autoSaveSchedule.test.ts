import { afterEach, expect, test, vi } from "vitest";
import { startAutoSaveSchedule } from "./autoSaveSchedule";

afterEach(() => { vi.useRealTimers(); });

test("ticks every 60 seconds and stops cleanly", () => {
  vi.useFakeTimers();
  const run = vi.fn();
  const schedule = startAutoSaveSchedule(run);
  vi.advanceTimersByTime(59_999);
  expect(run).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(run).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(60_000);
  expect(run).toHaveBeenCalledTimes(2);
  schedule.stop();
  vi.advanceTimersByTime(120_000);
  expect(run).toHaveBeenCalledTimes(2);
});

test("resuming after throttling does one check without replaying missed cycles", () => {
  vi.useFakeTimers();
  const run = vi.fn();
  const schedule = startAutoSaveSchedule(run);
  vi.setSystemTime(Date.now() + 300_000);
  schedule.check();
  schedule.check();
  expect(run).toHaveBeenCalledTimes(1);
  schedule.stop();
});
