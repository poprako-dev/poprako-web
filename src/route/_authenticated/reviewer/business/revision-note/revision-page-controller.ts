import type { LoadRevisionNotes, RevisionNote } from "./revision-note";
import type { LoadRevisionPage, RevisionPage } from "./revision-page";
type Snapshot = {
  pageId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  notesStatus: "idle" | "loading" | "ready" | "error";
  notes: RevisionNote[];
  page: RevisionPage | null;
  error: string | null;
  notesError: string | null;
};
export interface RevisionPageController {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  load: (pageId: string) => Promise<void>;
  retryPage: () => Promise<void>;
  retryNotes: () => Promise<void>;
  dispose: () => void;
}
function emptySnapshot(): Snapshot {
  return {
    pageId: null,
    status: "idle",
    notesStatus: "idle",
    notes: [],
    page: null,
    error: null,
    notesError: null,
  };
}
export function createRevisionPageController(
  loadNotes: LoadRevisionNotes,
  loadPage: LoadRevisionPage,
): RevisionPageController {
  let generation = 0;
  let pageRequest: AbortController | null = null;
  let notesRequest: AbortController | null = null;
  let snapshot = emptySnapshot();
  let released: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  function publish(change: Partial<Snapshot>): void {
    snapshot = { ...snapshot, ...change };
    for (const listener of listeners) listener();
  }
  function dispose(): void {
    generation++;
    pageRequest?.abort();
    notesRequest?.abort();
    releasePage();
    snapshot = emptySnapshot();
  }
  function releasePage(): void {
    const page = snapshot.page;
    if (!page) return;
    const previousRelease = released;
    const currentRelease = page.dispose();
    released = Promise.all([previousRelease, currentRelease]).then(() => undefined);
  }
  async function retryPage(): Promise<void> {
    const pageId = snapshot.pageId;
    if (!pageId) return;
    pageRequest?.abort();
    releasePage();
    const request = new AbortController();
    pageRequest = request;
    const current = generation;
    publish({ status: "loading", page: null, error: null });
    try {
      if (released) await released;
      if (current !== generation) return;
      request.signal.throwIfAborted();
      if (!loadPage) throw new Error("预览暂不可用");
      const page = await loadPage(pageId, request.signal);
      if (current !== generation || request.signal.aborted) {
        await page.dispose();
        return;
      }
      publish({ status: "ready", page });
    } catch (error) {
      if (current !== generation || request.signal.aborted) return;
      publish({ status: "error", error: error instanceof Error ? error.message : String(error) });
    }
  }
  async function retryNotes(): Promise<void> {
    const pageId = snapshot.pageId;
    if (!pageId) return;
    notesRequest?.abort();
    const request = new AbortController();
    notesRequest = request;
    const current = generation;
    publish({ notesStatus: "loading", notesError: null });
    try {
      const notes = loadNotes ? await loadNotes(pageId, request.signal) : [];
      if (current !== generation || request.signal.aborted) return;
      publish({ notesStatus: "ready", notes: [...notes].sort((a, b) => a.number - b.number) });
    } catch (error) {
      if (current !== generation || request.signal.aborted) return;
      publish({
        notesStatus: "error",
        notesError: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async load(pageId) {
      dispose();
      publish({ pageId });
      await Promise.all([retryPage(), retryNotes()]);
    },
    retryPage,
    retryNotes,
    dispose,
  };
}
