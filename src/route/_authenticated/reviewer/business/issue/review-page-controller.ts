import type { LoadIssues, IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { LoadReviewPage, ReviewPage } from "./review-page";
import type { ReviewLoadProgress } from "./review-load-progress";
type Snapshot = {
  pageId: string | null;
  status: "idle" | "loading" | "ready" | "error" | "cancelled";
  issuesStatus: "idle" | "loading" | "ready" | "error";
  issues: IssueInfo[];
  page: ReviewPage | null;
  error: string | null;
  issuesError: string | null;
  progress: ReviewLoadProgress | null;
};
export interface ReviewPageController {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  load: (pageId: string) => Promise<void>;
  retryPage: () => Promise<void>;
  retryIssues: () => Promise<void>;
  cancelPage: () => void;
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
    progress: null,
  };
}
class ReviewPageControllerImpl implements ReviewPageController {
  private generation = 0;
  private pageRequest: AbortController | null = null;
  private issuesRequest: AbortController | null = null;
  private snapshot = emptySnapshot();
  private released: Promise<void> | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly loadIssues: LoadIssues;
  private readonly loadPage: LoadReviewPage;

  constructor(loadIssues: LoadIssues, loadPage: LoadReviewPage) {
    this.loadIssues = loadIssues;
    this.loadPage = loadPage;
  }

  getSnapshot = (): Snapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  load = async (pageId: string): Promise<void> => {
    this.dispose();
    this.publish({ pageId });
    await Promise.all([this.retryPage(), this.retryIssues()]);
  };

  retryPage = async (): Promise<void> => {
    const pageId = this.snapshot.pageId;
    if (!pageId) return;
    this.pageRequest?.abort();
    this.releasePage();
    const request = new AbortController();
    this.pageRequest = request;
    const current = this.generation;
    this.publish({ status: "loading", page: null, error: null, progress: null });
    try {
      if (this.released) await this.released;
      if (current !== this.generation) return;
      request.signal.throwIfAborted();
      if (!this.loadPage) throw new Error("预览暂不可用");
      const page = await this.loadPage(pageId, request.signal, (progress) => {
        if (current === this.generation && !request.signal.aborted) this.publish({ progress });
      });
      if (current !== this.generation || request.signal.aborted) {
        await page.dispose();
        return;
      }
      this.publish({ status: "ready", page, progress: null });
    } catch (error) {
      if (current !== this.generation || request.signal.aborted) return;
      this.publish({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  retryIssues = async (): Promise<void> => {
    const pageId = this.snapshot.pageId;
    if (!pageId) return;
    this.issuesRequest?.abort();
    const request = new AbortController();
    this.issuesRequest = request;
    const current = this.generation;
    this.publish({ issuesStatus: "loading", issuesError: null });
    try {
      const issues = await this.loadIssues(pageId, request.signal);
      if (current !== this.generation || request.signal.aborted) return;
      this.publish({
        issuesStatus: "ready",
        issues: [...issues].sort((a, b) => a.index - b.index),
      });
    } catch (error) {
      if (current !== this.generation || request.signal.aborted) return;
      this.publish({
        issuesStatus: "error",
        issuesError: error instanceof Error ? error.message : String(error),
      });
    }
  };

  cancelPage = (): void => {
    this.pageRequest?.abort();
    this.releasePage();
    this.publish({ status: "cancelled", page: null, error: null, progress: null });
  };

  dispose = (): void => {
    this.generation++;
    this.pageRequest?.abort();
    this.issuesRequest?.abort();
    this.releasePage();
    this.snapshot = emptySnapshot();
  };

  private publish(change: Partial<Snapshot>): void {
    this.snapshot = { ...this.snapshot, ...change };
    for (const listener of this.listeners) listener();
  }

  private releasePage(): void {
    const page = this.snapshot.page;
    if (!page) return;
    const previousRelease = this.released;
    const currentRelease = page.dispose();
    this.released = Promise.all([previousRelease, currentRelease]).then(() => undefined);
  }
}

export function createReviewPageController(
  loadIssues: LoadIssues,
  loadPage: LoadReviewPage,
): ReviewPageController {
  return new ReviewPageControllerImpl(loadIssues, loadPage);
}
