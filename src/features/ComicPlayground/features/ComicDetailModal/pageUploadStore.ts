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

type PageUploadTaskStore = {
  tasks: Record<string, PageUploadTaskView>;
  chapterRevision: Record<string, number>;
};

const useMutablePageUploadTaskStore = create<PageUploadTaskStore>()(() => ({
  tasks: {},
  chapterRevision: {},
}));

export const usePageUploadTaskStore = useMutablePageUploadTaskStore;

export function getPageUploadTaskState(): PageUploadTaskStore {
  return useMutablePageUploadTaskStore.getState();
}

export function subscribePageUploadTasks(
  listener: (state: PageUploadTaskStore, previous: PageUploadTaskStore) => void,
): () => void {
  return useMutablePageUploadTaskStore.subscribe(listener);
}

export function putPageUploadTask(task: PageUploadTaskView): void {
  useMutablePageUploadTaskStore.setState((state) => ({
    tasks: {
      ...state.tasks,
      [task.taskId]: task,
    },
  }));
}

export function patchPageUploadTask(
  taskId: string,
  patch: Partial<PageUploadTaskView>,
): void {
  useMutablePageUploadTaskStore.setState((state) => {
    const task = state.tasks[taskId];
    if (!task) return state;

    return {
      tasks: {
        ...state.tasks,
        [taskId]: {
          ...task,
          ...patch,
        },
      },
    };
  });
}

export function bumpPageUploadChapterRevision(chapterId: string): void {
  useMutablePageUploadTaskStore.setState((state) => ({
    chapterRevision: {
      ...state.chapterRevision,
      [chapterId]: (state.chapterRevision[chapterId] ?? 0) + 1,
    },
  }));
}

export function clearPageUploadTasks(): void {
  useMutablePageUploadTaskStore.setState({
    tasks: {},
    chapterRevision: {},
  });
}

export function clearChapterUploadTasks(chapterId: string): void {
  useMutablePageUploadTaskStore.setState((state) => {
    const tasks = { ...state.tasks };
    for (const id of Object.keys(tasks)) {
      if (tasks[id].chapterId === chapterId) delete tasks[id];
    }
    const chapterRevision = { ...state.chapterRevision };
    delete chapterRevision[chapterId];
    return { tasks, chapterRevision };
  });
}
