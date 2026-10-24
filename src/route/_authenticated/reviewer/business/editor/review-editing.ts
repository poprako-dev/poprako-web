import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";

/** UI documents use stable identities; an eventual HTTP adapter owns wire IDs. */
export type ReviewDocument = {
  issues: IssueInfo[];
  revision: string;
  reviewKey: string;
  imageKey: string;
};

export type ReviewSubmission = { baseline: ReviewDocument; issues: IssueInfo[] };
export type ReviewBatch = { draft: ReviewSubmission; saveId: string };
export type ReviewDraft = ReviewSubmission & { pending?: ReviewBatch };

/** Injected only by the editing workspace; no transport or storage is prescribed. */
export interface ReviewerEditing {
  load: (pageId: string, signal: AbortSignal) => Promise<ReviewDocument>;
  save: (pageId: string, draft: ReviewDraft, saveId: string) => Promise<ReviewDocument>;
  readDraft: (pageId: string) => Promise<ReviewDraft | null>;
  writeDraft: (pageId: string, draft: ReviewDraft | null) => Promise<void>;
  complete: () => Promise<void>;
}

export class ReviewChangedError extends Error {
  readonly document: ReviewDocument;
  constructor(document: ReviewDocument) {
    super("本页内容已更新");
    this.document = document;
  }
}

export class ReviewPageError extends Error {
  readonly pageId: string;
  constructor(pageId: string, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.pageId = pageId;
  }
}

export type ReviewEditPage = ReviewDraft & {
  history: { before: IssueInfo[]; after: IssueInfo[] }[];
  saving: boolean;
  error: string | null;
  storageError: string | null;
  blocked: ReviewDocument | null;
};

export function sameIssues(left: IssueInfo[], right: IssueInfo[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function normalizeIssues(issues: IssueInfo[]): IssueInfo[] {
  return issues.map((issue, index) => ({ ...issue, index }));
}

export function pageIsDirty(page: ReviewEditPage): boolean {
  return !sameIssues(page.issues, page.baseline.issues);
}

export function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
