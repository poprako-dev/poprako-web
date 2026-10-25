import type { ApiClient } from "@/api/client";
import {
  getPageIssues,
  savePageIssues,
  listIssueVariants,
  renameIssueVariant,
} from "@/api/issue/issue-edit-api";
import type { PageIssuesResponse } from "@/api/issue/issue-contract";
import { completeChapterStage } from "@/route/_authenticated/business/chapter/chapter-request";
import { toApiRequestError } from "@/route/business/request-error";
import { ReviewChangedError, type ReviewDocument, type ReviewerEditing } from "./review-editing";
import { createCategoryPresets } from "./category-presets";
import { createReviewDraftStore } from "./review-draft-store";
import { reviewSaveInput, reviewSaveResult } from "./review-save-receipt";

export function reviewDocument(page: PageIssuesResponse): ReviewDocument {
  return {
    issues: page.issues,
    reviewKey: page.reviewKey,
    revision: page.revision,
    imageKey: JSON.stringify(page.imageVersion),
  };
}

export function createReviewHttpSource(
  client: ApiClient,
  chapterId: string,
  accountId: string,
): ReviewerEditing {
  async function load(pageId: string, signal: AbortSignal): Promise<ReviewDocument> {
    const result = await getPageIssues(client, pageId, signal);
    if (!result.success) throw toApiRequestError(result);
    return reviewDocument(result.data);
  }
  return {
    load,
    ...createReviewDraftStore(accountId, chapterId),
    presets: createCategoryPresets(accountId),
    categories: categorySource(client, chapterId),
    async save(pageId, draft, saveId) {
      const result = await savePageIssues(client, pageId, reviewSaveInput(draft), saveId);
      if (!result.success) {
        if (result.httpStatus === 409)
          throw new ReviewChangedError(await load(pageId, new AbortController().signal));
        throw toApiRequestError(result);
      }
      return reviewSaveResult(draft, result.data);
    },
    async complete() {
      const result = await completeChapterStage(client, chapterId, {
        stage: "review",
        oper: "advance",
      });
      if (!result.success) throw toApiRequestError(result);
    },
  };
}

function categorySource(
  client: ApiClient,
  chapterId: string,
): NonNullable<ReviewerEditing["categories"]> {
  return {
    async load() {
      const result = await listIssueVariants(client, chapterId);
      if (!result.success) throw toApiRequestError(result);
      return result.data;
    },
    async rename(summary, from, to) {
      const result = await renameIssueVariant(client, chapterId, {
        reviewKey: summary.reviewKey,
        revision: summary.revision,
        from,
        to,
      });
      if (!result.success) throw toApiRequestError(result);
      return Object.fromEntries(
        result.data.pages.map((page) => [page.pageArtworkId, reviewDocument(page)]),
      );
    },
  };
}
