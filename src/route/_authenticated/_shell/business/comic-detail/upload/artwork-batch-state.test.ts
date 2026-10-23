import { expect, test, vi } from "vitest";
import { ArtworkBatchState } from "./artwork-batch-state";
import type { ArtworkPageTask } from "./artwork-batch-types";

function pages(count: number): ArtworkPageTask[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    input: new File(["psd"], `${String(index)}.psd`),
    putDone: false,
    done: false,
  }));
}

test.each([100, 1000])("publishes allocation for %i pages once with linear task reads", (count) => {
  const state = new ArtworkBatchState(pages(count), true);
  const before = state.getSnapshot();
  const readId = vi.fn();
  for (const task of before.tasks) {
    const id = task.id;
    Object.defineProperty(task, "id", {
      get() {
        readId();
        return id;
      },
      enumerable: true,
    });
  }
  const listener = vi.fn();
  state.subscribe(listener);
  state.patchMany(
    pages(count).map((page) => page.id),
    { phase: "allocating", error: null },
  );
  expect(listener).toHaveBeenCalledOnce();
  expect(readId).toHaveBeenCalledTimes(count);
  expect(
    state
      .getSnapshot()
      .tasks.slice(1)
      .every((task) => task.phase === "allocating"),
  ).toBe(true);
  expect(before.tasks.every((task) => task.phase === "queued")).toBe(true);
  expect(state.getTask("archive")).toBe(before.tasks[0]);
});

test("progress uses the id index and identical updates preserve the complete snapshot", () => {
  const state = new ArtworkBatchState(pages(1000), false);
  const before = state.getSnapshot();
  const reads = vi.fn();
  for (const task of before.tasks) {
    const id = task.id;
    Object.defineProperty(task, "id", {
      get() {
        reads();
        return id;
      },
      enumerable: true,
    });
  }
  const listener = vi.fn();
  state.subscribe(listener);
  state.patch("750", { progress: 35 });
  expect(reads).toHaveBeenCalledOnce();
  expect(listener).toHaveBeenCalledOnce();
  expect(before.tasks[750]?.progress).toBeNull();
  const progressing = state.getSnapshot();
  for (let index = 0; index < 100; index += 1) state.patch("750", { progress: 35 });
  state.patch("missing", { progress: 35 });
  expect(state.getSnapshot()).toBe(progressing);
  expect(listener).toHaveBeenCalledOnce();
  expect(state.getSnapshot().tasks[0]).toBe(before.tasks[0]);
});
