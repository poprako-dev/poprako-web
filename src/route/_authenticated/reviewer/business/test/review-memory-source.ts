import type { LoadIssues } from "@/route/_authenticated/business/issue/issue";
import {
  ReviewChangedError,
  type ReviewDocument,
  type ReviewDraft,
  type ReviewerEditing,
} from "../editor/review-editing";

export type ReviewScenario =
  | "normal"
  | "save-failure"
  | "slow"
  | "complete-failure"
  | "recovery"
  | "remote-change"
  | "remote-delete"
  | "import"
  | "image"
  | "storage-failure"
  | "lost-response";

/** Deliberately in memory: remounts keep drafts; a full reload clears this prototype. */
export class ReviewMemorySource implements ReviewerEditing {
  readonly documents = new Map<string, ReviewDocument>();
  readonly drafts = new Map<string, ReviewDraft>();
  readonly receipts = new Set<string>();
  readonly saves: { pageId: string; saveId: string }[] = [];
  completed = false;
  private firstSave = true;
  private firstComplete = true;

  private readonly loadIssues: LoadIssues;
  readonly scenario: ReviewScenario;
  constructor(loadIssues: LoadIssues, scenario: ReviewScenario = "normal") {
    this.loadIssues = loadIssues;
    this.scenario = scenario;
  }

  async load(pageId: string, signal: AbortSignal): Promise<ReviewDocument> {
    let document = this.documents.get(pageId);
    if (!document) {
      document = {
        issues: await this.loadIssues(pageId, signal),
        revision: "1",
        reviewKey: "review-1",
        imageKey: "image-1",
      };
      this.documents.set(pageId, structuredClone(document));
      if (this.scenario === "recovery" && pageId === "page-1") this.seedDraft(pageId, document);
    }
    signal.throwIfAborted();
    return structuredClone(document);
  }

  private seedDraft(pageId: string, baseline: ReviewDocument): void {
    this.drafts.set(pageId, {
      baseline,
      issues: baseline.issues.map((issue, index) =>
        index === 0 ? { ...issue, note: "上次未保存的修改：文字再向左移动一点。" } : issue,
      ),
    });
  }

  async save(pageId: string, draft: ReviewDraft, saveId: string): Promise<ReviewDocument> {
    this.saves.push({ pageId, saveId });
    await new Promise<void>((resolve) =>
      setTimeout(resolve, this.scenario === "slow" ? 1800 : 100),
    );
    const current = this.documents.get(pageId);
    if (!current) throw new Error("页面不存在");
    if (this.receipts.has(saveId)) return structuredClone(current);
    const first = this.firstSave;
    this.firstSave = false;
    if (first && (this.scenario === "save-failure" || this.scenario === "storage-failure"))
      throw new Error("保存失败，修改已保留，请重试。");
    const remote = first ? simulateRemoteChange(current, this.scenario) : current;
    this.documents.set(pageId, remote);
    if (remote.revision !== draft.baseline.revision)
      throw new ReviewChangedError(structuredClone(remote));
    const result = {
      ...remote,
      revision: String(Number(remote.revision) + 1),
      issues: structuredClone(draft.issues),
    };
    this.documents.set(pageId, result);
    this.receipts.add(saveId);
    if (first && this.scenario === "lost-response") throw new Error("未收到保存结果，请重试。");
    return structuredClone(result);
  }

  readDraft(pageId: string): Promise<ReviewDraft | null> {
    return Promise.resolve(structuredClone(this.drafts.get(pageId) ?? null));
  }

  writeDraft(pageId: string, draft: ReviewDraft | null): Promise<void> {
    if (this.scenario === "storage-failure")
      return Promise.reject(new Error("本地草稿存储失败，请保存后再离开。"));
    if (draft) this.drafts.set(pageId, structuredClone(draft));
    else this.drafts.delete(pageId);
    return Promise.resolve();
  }

  complete(): Promise<void> {
    if (this.firstComplete && this.scenario === "complete-failure") {
      this.firstComplete = false;
      return Promise.reject(new Error("完成监修失败，修改已保存，请重试。"));
    }
    this.completed = true;
    return Promise.resolve();
  }
}

function simulateRemoteChange(document: ReviewDocument, scenario: ReviewScenario): ReviewDocument {
  if (!["remote-change", "remote-delete", "import", "image"].includes(scenario)) return document;
  const remote = structuredClone(document);
  remote.revision = String(Number(remote.revision) + 1);
  if (scenario === "remote-change") {
    remote.issues = remote.issues.map((issue, index) =>
      index === 0 ? { ...issue, variant: "字号", note: "远端修改了说明。" } : issue,
    );
  }
  if (scenario === "remote-delete") remote.issues = remote.issues.slice(1);
  if (scenario === "import") {
    remote.reviewKey = "review-2";
    remote.issues = [];
  }
  if (scenario === "image") remote.imageKey = "image-2";
  return remote;
}
