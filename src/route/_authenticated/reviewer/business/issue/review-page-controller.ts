import type { LoadIssues, IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { LoadReviewPage, ReviewPage } from "./review-page";
type Snapshot = {
  pageId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  issuesStatus: "idle" | "loading" | "ready" | "error";
  issues: IssueInfo[];
  page: ReviewPage | null;
  error: string | null;
  issuesError: string | null;
};
export interface ReviewPageController {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  load: (pageId: string) => Promise<void>;
  retryPage: () => Promise<void>;
  retryIssues: () => Promise<void>;
  dispose: () => void;
}
function emptySnapshot(): Snapshot {
  return {
    pageId: null,
    status: "idle",
    issuesStatus: "idle",
    issues: [],
    page: null,
    error: null,
    issuesError: null,
  };
}
export function createReviewPageController(
  loadIssues: LoadIssues,
  loadPage: LoadReviewPage,
): ReviewPageController {
  let generation = 0;
  let pageRequest: AbortController | null = null;
  let issuesRequest: AbortController | null = null;
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
    issuesRequest?.abort();
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
  async function retryIssues(): Promise<void> {
    const pageId = snapshot.pageId;
    if (!pageId) return;
    issuesRequest?.abort();
    const request = new AbortController();
    issuesRequest = request;
    const current = generation;
    publish({ issuesStatus: "loading", issuesError: null });
    try {
      const issues = await loadIssues(pageId, request.signal);
      if (current !== generation || request.signal.aborted) return;
      publish({ issuesStatus: "ready", issues: [...issues].sort((a, b) => a.index - b.index) });
    } catch (error) {
      if (current !== generation || request.signal.aborted) return;
      publish({
        issuesStatus: "error",
        issuesError: error instanceof Error ? error.message : String(error),
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
      await Promise.all([retryPage(), retryIssues()]);
    },
    retryPage,
    retryIssues,
    dispose,
  };
}
