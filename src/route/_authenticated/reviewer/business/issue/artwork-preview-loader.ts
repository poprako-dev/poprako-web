import type { ApiClient } from "@/api/client";
import { listPageArtworks } from "@/api/page-artwork/page-artwork-api";
import { toApiRequestError } from "@/route/business/request-error";
import type { ReviewerProject } from "../reviewer-props";
import type { LoadReviewPage } from "./review-page";
import { openCompositePage } from "./open-composite-page";

export function createArtworkPreviewLoader(
  client: ApiClient,
  project: ReviewerProject,
): NonNullable<LoadReviewPage> {
  const openedPages = new Set<string>();
  return async function load(id, signal) {
    const page = project.pages.find((page) => page.id === id);
    const url = page?.imageOptimizedUrl ?? page?.imageUrl;
    if (url && !openedPages.has(id)) {
      openedPages.add(id);
      return openCompositePage(url, signal);
    }
    signal.throwIfAborted();
    const refreshed = await listPageArtworks(client, project.chapterId, signal);
    signal.throwIfAborted();
    if (!refreshed.success) throw toApiRequestError(refreshed);
    const current = refreshed.data.find((item) => item.id === id);
    if (!current?.imageUploaded || !current.imageUrl)
      throw new Error("此页预览尚未上传完成，请稍后重试。");
    openedPages.add(id);
    return openCompositePage(current.imageOptimizedUrl ?? current.imageUrl, signal);
  };
}
