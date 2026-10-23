import { afterEach, expect, test, vi } from "vitest";
import {
  bumpPageUploadChapterRevision,
  clearChapterUploadTasks,
  clearPageUploadTasks,
  getPageUploadTaskState,
  patchPageUploadTask,
  patchPageUploadTasks,
  putPageUploadTask,
  putPageUploadTasks,
  subscribePageUploadTasks,
  type PageUploadTaskView,
} from "./page-upload-store";

function task(taskId: string, chapterId = "current"): PageUploadTaskView {
  return {
    taskId,
    batchId: "batch",
    chapterId,
    pageId: taskId,
    index: 0,
    fileName: `${taskId}.png`,
    progress: 0,
    attempt: 0,
    status: "queued",
    error: null,
  };
}

afterEach(clearPageUploadTasks);

test.each([100, 1000])("registers and queues %i tasks with one publication per phase", (count) => {
  const listener = vi.fn();
  const unsubscribe = subscribePageUploadTasks(listener);
  const initial = getPageUploadTaskState();
  const tasks = Array.from({ length: count }, (_, index) => task(String(index)));
  try {
    putPageUploadTasks(tasks);
    const registered = getPageUploadTaskState();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(Object.keys(registered.tasks)).toHaveLength(count);
    expect(initial.tasks).toEqual({});
    patchPageUploadTasks(tasks.map(({ taskId }) => ({ taskId, patch: { status: "uploading" } })));
    expect(listener).toHaveBeenCalledTimes(2);
    expect(
      Object.values(getPageUploadTaskState().tasks).every((item) => item.status === "uploading"),
    ).toBe(true);
    expect(Object.values(registered.tasks).every((item) => item.status === "queued")).toBe(true);
  } finally {
    unsubscribe();
  }
});

test("repeated progress values do not copy snapshots or notify subscribers", () => {
  putPageUploadTasks(Array.from({ length: 100 }, (_, index) => task(String(index))));
  patchPageUploadTask("0", { progress: 35, status: "uploading" });
  const snapshot = getPageUploadTaskState();
  const listener = vi.fn();
  const unsubscribe = subscribePageUploadTasks(listener);
  try {
    for (let index = 0; index < 100; index += 1) {
      patchPageUploadTask("0", { progress: 35, status: "uploading" });
    }
    patchPageUploadTask("missing", { progress: 50 });
    expect(getPageUploadTaskState()).toBe(snapshot);
    expect(listener).not.toHaveBeenCalled();
  } finally {
    unsubscribe();
  }
});

test("progress copies only its chapter and preserves immutable previous snapshots", () => {
  putPageUploadTasks([
    ...Array.from({ length: 1000 }, (_, index) => task(String(index), "background")),
    task("visible"),
  ]);
  const previous = getPageUploadTaskState();
  const globalRead = vi.spyOn(previous, "tasks", "get");
  patchPageUploadTask("0", { progress: 25 });
  const current = getPageUploadTaskState();
  expect(globalRead).not.toHaveBeenCalled();
  expect(current.tasksByChapter["current"]).toBe(previous.tasksByChapter["current"]);
  expect(current.taskChapters).toBe(previous.taskChapters);
  expect(current.tasksByChapter["background"]?.["1"]).toBe(
    previous.tasksByChapter["background"]?.["1"],
  );
  expect(previous.tasksByChapter["background"]?.["0"]?.progress).toBe(0);
  expect(current.tasksByChapter["background"]?.["0"]?.progress).toBe(25);
  expect(previous.tasks["0"]?.progress).toBe(0);
  expect(current.tasks["0"]?.progress).toBe(25);
  globalRead.mockRestore();
});

test("chapter cleanup preserves other tasks and revisions and allows new registrations", () => {
  putPageUploadTasks([task("old"), task("other", "background")]);
  bumpPageUploadChapterRevision("current");
  bumpPageUploadChapterRevision("background");
  const previous = getPageUploadTaskState();
  clearChapterUploadTasks("current");
  patchPageUploadTask("old", { progress: 50 });
  const cleared = getPageUploadTaskState();
  expect(cleared.tasks).toEqual({ other: task("other", "background") });
  expect(cleared.chapterRevision).toEqual({ background: 1 });
  expect(cleared.tasksByChapter["background"]).toBe(previous.tasksByChapter["background"]);
  expect(previous.tasks["old"]).toEqual(task("old"));
  putPageUploadTask(task("old"));
  patchPageUploadTask("old", { progress: 50 });
  expect(getPageUploadTaskState().tasks["old"]?.progress).toBe(50);
});
