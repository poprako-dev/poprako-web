import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { mergeIssues } from "./merge-issues";
import {
  normalizeIssues,
  pageIsDirty,
  sameIssues,
  message,
  ReviewPageError,
  type ReviewDocument,
  type ReviewBatch,
  type ReviewDraft,
  type ReviewEditPage,
  type ReviewerEditing,
} from "./review-editing";
import { saveReviewPage } from "./review-save";

type Snapshot = Readonly<Record<string, ReviewEditPage>>;

export class ReviewSession {
  private snapshot: Snapshot = {};
  private readonly listeners = new Set<() => void>();
  private readonly writes = new Map<string, Promise<void>>();
  private readonly saves = new Map<string, Promise<void>>();
  readonly batches = new Map<string, ReviewBatch>();

  readonly source: ReviewerEditing;
  constructor(source: ReviewerEditing) {
    this.source = source;
  }

  getSnapshot = (): Snapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  page(pageId: string): ReviewEditPage {
    const page = this.snapshot[pageId];
    if (!page) throw new Error("本页尚未加载");
    return page;
  }

  publish(pageId: string, page: ReviewEditPage): void {
    this.snapshot = { ...this.snapshot, [pageId]: page };
    for (const listener of this.listeners) listener();
  }

  async load(pageId: string, signal: AbortSignal): Promise<IssueInfo[]> {
    const requested = this.snapshot[pageId]?.baseline;
    const remote = await this.source.load(pageId, signal);
    const stored = this.snapshot[pageId] ?? (await this.source.readDraft(pageId));
    signal.throwIfAborted();
    const previous = this.snapshot[pageId];
    if (requested && previous && requested !== previous.baseline) return previous.issues;
    const baseline = previous?.baseline ?? stored?.baseline ?? remote;
    const issues = previous?.issues ?? stored?.issues ?? remote.issues;
    if (stored?.pending && !this.batches.has(pageId)) this.batches.set(pageId, stored.pending);
    this.publish(pageId, {
      baseline,
      issues,
      history: previous?.history ?? [],
      saving: previous?.saving ?? false,
      error: null,
      storageError: null,
      blocked: null,
    });
    this.receive(pageId, remote);
    return this.page(pageId).issues;
  }

  receive(pageId: string, remote: ReviewDocument): void {
    const page = this.page(pageId);
    const replaced = page.baseline.reviewKey !== remote.reviewKey;
    const imageChanged = page.baseline.imageKey !== remote.imageKey;
    if ((replaced || imageChanged) && (pageIsDirty(page) || this.batches.has(pageId))) {
      this.publish(pageId, { ...page, blocked: remote });
      return;
    }
    const issues = replaced
      ? remote.issues
      : mergeIssues(page.baseline.issues, page.issues, remote.issues);
    this.publish(pageId, {
      ...page,
      baseline: remote,
      issues,
      history: replaced || imageChanged ? [] : page.history,
      blocked: null,
    });
  }

  commit(pageId: string, issues: IssueInfo[]): void {
    const page = this.page(pageId);
    if (page.blocked || sameIssues(page.issues, issues)) return;
    this.publish(pageId, {
      ...page,
      issues: normalizeIssues(issues),
      history: [...page.history, { before: page.issues, after: normalizeIssues(issues) }],
    });
    void this.retain(pageId);
  }

  undo(pageId: string): void {
    const page = this.page(pageId);
    const previous = page.history.at(-1);
    if (!previous || page.blocked) return;
    // Undo only our change; preserve unrelated fields received from the remote.
    const issues = mergeIssues(previous.after, previous.before, page.issues);
    this.publish(pageId, { ...page, issues, history: page.history.slice(0, -1) });
    void this.retain(pageId);
  }

  retain(pageId: string): Promise<void> {
    const page = this.page(pageId);
    const pending = this.batches.get(pageId);
    const draft =
      pageIsDirty(page) || pending
        ? { baseline: page.baseline, issues: page.issues, ...(pending ? { pending } : {}) }
        : null;
    const previous = this.writes.get(pageId) ?? Promise.resolve();
    const write = previous.then(() => this.store(pageId, draft));
    this.writes.set(pageId, write);
    return write;
  }

  private async store(pageId: string, draft: ReviewDraft | null): Promise<void> {
    try {
      await this.source.writeDraft(pageId, draft);
      this.publish(pageId, { ...this.page(pageId), storageError: null });
    } catch (error) {
      this.publish(pageId, { ...this.page(pageId), storageError: message(error) });
    }
  }

  save(pageId: string): Promise<void> {
    const pending = this.saves.get(pageId);
    if (pending) return pending;
    const saving = Promise.resolve().then(() => saveReviewPage(this, pageId));
    this.saves.set(pageId, saving);
    void saving.finally(() => this.saves.delete(pageId)).catch(() => undefined);
    return saving;
  }

  async leave(pageId: string): Promise<void> {
    try {
      await this.save(pageId);
    } catch {
      await this.retain(pageId);
      if (this.page(pageId).storageError) throw new Error("修改尚未保存，请重试后离开");
    }
  }

  async complete(pageIds: readonly string[]): Promise<void> {
    for (const id of pageIds) {
      try {
        if (!this.snapshot[id]) await this.load(id, new AbortController().signal);
        await this.save(id);
      } catch (cause) {
        throw new ReviewPageError(id, cause);
      }
    }
    await this.source.complete();
  }

  resolve(pageId: string, keepLocal: boolean): void {
    const page = this.page(pageId);
    const remote = page.blocked;
    if (!remote) return;
    const sameReview = remote.reviewKey === page.baseline.reviewKey;
    const issues =
      keepLocal && sameReview
        ? mergeIssues(page.baseline.issues, page.issues, remote.issues)
        : remote.issues;
    this.batches.delete(pageId);
    this.publish(pageId, {
      ...page,
      baseline: remote,
      issues,
      history: [],
      blocked: null,
      error: null,
    });
    void this.retain(pageId);
  }
}
