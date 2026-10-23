import { create } from "zustand/react";

export type PageUploadTaskStatus =
  | "preparing"
  | "queued"
  | "uploading"
  | "confirming"
  | "succeeded"
  | "failed";

export type PageUploadTaskView = {
  taskId: string;
  batchId: string;
  chapterId: string;
  pageId: string | null;
  index: number | null;
  fileName: string;
  progress: number;
  attempt: number;
  status: PageUploadTaskStatus;
  error: string | null;
};

type ChapterTasks = Record<string, PageUploadTaskView>;
type PageUploadTaskStore = {
  tasks: ChapterTasks;
  tasksByChapter: Record<string, ChapterTasks>;
  taskChapters: Record<string, string>;
  chapterRevision: Record<string, number>;
};

export const EMPTY_PAGE_UPLOAD_TASKS: ChapterTasks = {};

function taskState(
  tasksByChapter: PageUploadTaskStore["tasksByChapter"] = {},
  taskChapters: PageUploadTaskStore["taskChapters"] = {},
  chapterRevision: PageUploadTaskStore["chapterRevision"] = {},
): PageUploadTaskStore {
  let tasks: ChapterTasks | undefined;
  return {
    tasksByChapter,
    taskChapters,
    chapterRevision,
    // Compatibility reads flatten this immutable snapshot, never a progress write.
    get tasks() {
      tasks ??= Object.assign({}, ...Object.values(tasksByChapter)) as ChapterTasks;
      return tasks;
    },
  };
}

export const usePageUploadTaskStore = create<PageUploadTaskStore>()(() => taskState());

export function getPageUploadTaskState(): PageUploadTaskStore {
  return usePageUploadTaskStore.getState();
}

export function getChapterPageUploadTasks(chapterId: string | null): ChapterTasks {
  if (!chapterId) return EMPTY_PAGE_UPLOAD_TASKS;
  return getPageUploadTaskState().tasksByChapter[chapterId] ?? EMPTY_PAGE_UPLOAD_TASKS;
}

export function subscribePageUploadTasks(
  listener: (state: PageUploadTaskStore, previous: PageUploadTaskStore) => void,
): () => void {
  return usePageUploadTaskStore.subscribe(listener);
}

export function putPageUploadTasks(tasks: readonly PageUploadTaskView[]): void {
  if (tasks.length === 0) return;
  usePageUploadTaskStore.setState((state) => {
    const chapters = { ...state.tasksByChapter };
    const taskChapters = { ...state.taskChapters };
    const copied = new Set<string>();
    for (const task of tasks) {
      if (!copied.has(task.chapterId)) {
        chapters[task.chapterId] = { ...chapters[task.chapterId] };
        copied.add(task.chapterId);
      }
      const chapter = chapters[task.chapterId];
      if (chapter) chapter[task.taskId] = task;
      taskChapters[task.taskId] = task.chapterId;
    }
    return taskState(chapters, taskChapters, state.chapterRevision);
  }, true);
}

export function putPageUploadTask(task: PageUploadTaskView): void {
  putPageUploadTasks([task]);
}

export type PageUploadTaskPatch = { taskId: string; patch: Partial<PageUploadTaskView> };

function changedTask(task: PageUploadTaskView, patch: Partial<PageUploadTaskView>): boolean {
  return (Object.keys(patch) as (keyof PageUploadTaskView)[]).some(
    (key) => !Object.is(task[key], patch[key]),
  );
}

export function patchPageUploadTasks(patches: readonly PageUploadTaskPatch[]): void {
  usePageUploadTaskStore.setState((state) => {
    const changes = new Map<string, ChapterTasks>();
    for (const { taskId, patch } of patches) {
      const chapterId = state.taskChapters[taskId];
      if (!chapterId) continue;
      const chapter = changes.get(chapterId) ?? state.tasksByChapter[chapterId];
      const task = chapter?.[taskId];
      if (!task || !changedTask(task, patch)) continue;
      const updated = changes.get(chapterId) ?? { ...chapter };
      updated[taskId] = { ...task, ...patch };
      changes.set(chapterId, updated);
    }
    if (changes.size === 0) return state;
    const chapters = { ...state.tasksByChapter, ...Object.fromEntries(changes) };
    return taskState(chapters, state.taskChapters, state.chapterRevision);
  }, true);
}

export function patchPageUploadTask(taskId: string, patch: Partial<PageUploadTaskView>): void {
  patchPageUploadTasks([{ taskId, patch }]);
}

export function bumpPageUploadChapterRevision(chapterId: string): void {
  usePageUploadTaskStore.setState(
    (state) =>
      taskState(state.tasksByChapter, state.taskChapters, {
        ...state.chapterRevision,
        [chapterId]: (state.chapterRevision[chapterId] ?? 0) + 1,
      }),
    true,
  );
}

export function clearPageUploadTasks(): void {
  usePageUploadTaskStore.setState(taskState(), true);
}

export function clearChapterUploadTasks(chapterId: string): void {
  usePageUploadTaskStore.setState((state) => {
    const chapters = Object.fromEntries(
      Object.entries(state.tasksByChapter).filter(([id]) => id !== chapterId),
    );
    const taskChapters = Object.fromEntries(
      Object.entries(state.taskChapters).filter(([, id]) => id !== chapterId),
    );
    const revision = Object.fromEntries(
      Object.entries(state.chapterRevision).filter(([id]) => id !== chapterId),
    );
    return taskState(chapters, taskChapters, revision);
  }, true);
}
