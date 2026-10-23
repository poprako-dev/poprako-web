import type { ArtworkBatchSnapshot, ArtworkPageTask, ArtworkTask } from "./artwork-batch-types";

function initialTasks(pages: ArtworkPageTask[], includeArchive: boolean): ArtworkTask[] {
  const pageTasks = pages.map(
    (page): ArtworkTask => ({
      id: page.id,
      name: page.input.name,
      kind: "page",
      phase: "queued",
      progress: null,
      error: null,
      reused: false,
    }),
  );
  if (includeArchive)
    pageTasks.unshift({
      id: "archive",
      name: "PSD 嵌稿压缩包",
      kind: "archive",
      phase: "queued",
      progress: null,
      error: null,
      reused: false,
    });
  return pageTasks;
}

function hasChange(task: ArtworkTask, change: Partial<ArtworkTask>): boolean {
  return (Object.keys(change) as (keyof ArtworkTask)[]).some(
    (key) => !Object.is(task[key], change[key]),
  );
}

export class ArtworkBatchState {
  private snapshot: ArtworkBatchSnapshot;
  private readonly positions: Map<string, number>;
  private readonly listeners = new Set<() => void>();

  constructor(pages: ArtworkPageTask[], includeArchive: boolean) {
    const tasks = initialTasks(pages, includeArchive);
    this.snapshot = { running: false, error: null, tasks };
    this.positions = new Map(tasks.map((task, index) => [task.id, index]));
  }

  getSnapshot(): ArtworkBatchSnapshot {
    return this.snapshot;
  }

  getTask(id: string): ArtworkTask | undefined {
    const position = this.positions.get(id);
    return position === undefined ? undefined : this.snapshot.tasks[position];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(change: Partial<ArtworkBatchSnapshot>): void {
    if (
      !Object.entries(change).some(
        ([key, value]) => !Object.is(this.snapshot[key as keyof ArtworkBatchSnapshot], value),
      )
    )
      return;
    this.snapshot = { ...this.snapshot, ...change };
    for (const listener of this.listeners) listener();
  }

  patch(id: string, change: Partial<ArtworkTask>): void {
    this.patchMany([id], change);
  }

  patchMany(ids: readonly string[], change: Partial<ArtworkTask>): void {
    let tasks: ArtworkTask[] | undefined;
    for (const id of ids) {
      const position = this.positions.get(id);
      if (position === undefined) continue;
      const task = (tasks ?? this.snapshot.tasks)[position];
      if (!task || !hasChange(task, change)) continue;
      tasks ??= this.snapshot.tasks.slice();
      tasks[position] = { ...task, ...change };
    }
    if (tasks) this.publish({ tasks });
  }
}
