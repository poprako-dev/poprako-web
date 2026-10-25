import type {
  CreatedIssueId,
  SavePageIssuesRequest,
  SavePageIssuesResponse,
} from "@/api/issue/issue-contract";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import type { ReviewDraft, ReviewSaveResult } from "./review-editing";

export function reviewSaveInput(draft: ReviewDraft): SavePageIssuesRequest {
  const saved = new Set(draft.baseline.issues.map((issue) => issue.id));
  return {
    reviewKey: draft.baseline.reviewKey,
    revision: draft.baseline.revision,
    imageVersion: JSON.parse(draft.baseline.imageKey) as number | null,
    issues: draft.issues.map(({ id, variant, rect, note }) => ({
      ...(saved.has(id) ? { id } : { localId: id }),
      variant,
      rect,
      note,
    })),
  };
}

export function reviewSaveResult(
  draft: ReviewDraft,
  response: SavePageIssuesResponse,
): ReviewSaveResult {
  const existing = new Set(draft.baseline.issues.map((issue) => issue.id));
  const pending = new Set(
    draft.issues.filter((issue) => !existing.has(issue.id)).map((issue) => issue.id),
  );
  const canonical = new Set<string>();
  if (!Array.isArray(response.createdIssueIds)) throw new Error("保存回执不完整，修改已保留");
  for (const receipt of response.createdIssueIds) {
    if (
      !pending.delete(receipt.localId) ||
      existing.has(receipt.issueId) ||
      canonical.has(receipt.issueId) ||
      !response.page.issues.some((issue) => issue.id === receipt.issueId)
    ) {
      throw new Error("保存回执标识不一致，修改已保留");
    }
    canonical.add(receipt.issueId);
  }
  if (pending.size > 0) throw new Error("保存回执缺少新增问题标识，修改已保留");
  return {
    issues: response.page.issues,
    reviewKey: response.page.reviewKey,
    revision: response.page.revision,
    imageKey: JSON.stringify(response.page.imageVersion),
    createdIssueIds: response.createdIssueIds,
  };
}

export function remapIssueIds(issues: IssueInfo[], receipts: CreatedIssueId[]): IssueInfo[] {
  const ids = new Map(receipts.map((receipt) => [receipt.localId, receipt.issueId]));
  return issues.map((issue) => ({ ...issue, id: ids.get(issue.id) ?? issue.id }));
}
