import type { LoadRevisionNotes, RevisionNote } from "./revision-note";
import type { LoadRevisionPage, RevisionPage } from "./revision-page";
type Snapshot = {
  pageId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  notes: RevisionNote[];
  page: RevisionPage | null;
  error: string | null;
};
export interface RevisionPageController {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  load: (pageId: string) => Promise<void>;
  cancel: () => void;
  dispose: () => void;
}
export function createRevisionPageController(
  loadNotes: LoadRevisionNotes,
  loadPage: LoadRevisionPage,
): RevisionPageController {
  let generation = 0;
  let abort: AbortController | null = null;
  let snapshot: Snapshot = { pageId: null, status: "idle", notes: [], page: null, error: null };
  const listeners = new Set<() => void>();
  function publish(next: Snapshot): void {
    snapshot = next;
    for (const listener of listeners) listener();
  }
  function dispose(): void {
    generation++;
    abort?.abort();
    snapshot.page?.dispose();
    snapshot = { pageId: null, status: "idle", notes: [], page: null, error: null };
  }
  async function load(pageId: string): Promise<void> {
    dispose();
    const current = ++generation;
    const request = new AbortController();
    abort = request;
    publish({ pageId, status: "loading", notes: [], page: null, error: null });
    const resource: { page: RevisionPage | null } = { page: null };
    try {
      if (!loadNotes || !loadPage) throw new Error("revision_note 页面预览暂不可用");
      const results = await Promise.all([
        loadNotes(pageId),
        loadPage(pageId, request.signal).then((value) => {
          if (current !== generation || request.signal.aborted) {
            value.dispose();
            throw new DOMException("Page request cancelled", "AbortError");
          }
          resource.page = value;
          return value;
        }),
      ]);
      if (current !== generation) {
        resource.page?.dispose();
        return;
      }
      publish({
        pageId,
        status: "ready",
        notes: [...results[0]].sort((a, b) => a.number - b.number),
        page: results[1],
        error: null,
      });
    } catch (error) {
      request.abort();
      resource.page?.dispose();
      if (current !== generation) return;
      publish({
        pageId,
        status: "error",
        notes: [],
        page: null,
        error: error instanceof Error ? error.message : String(error),
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
    load,
    cancel() {
      if (snapshot.status === "loading") {
        generation++;
        abort?.abort();
      }
    },
    dispose,
  };
}
