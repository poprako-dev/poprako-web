import { useCallback, useEffect, useRef } from "react";
import type { ApiClient } from "@/api/client";
import { createArtworkPageSource } from "./artwork-page-source";
import type { ArtworkPageSource } from "./artwork-page-source";
import type { LoadReviewPage } from "./review-page";

export function useArtworkPages(
  client: ApiClient,
  chapterId: string,
  pageIds: readonly string[],
): LoadReviewPage {
  const sourceRef = useRef<ArtworkPageSource | null>(null);
  useEffect(
    () => () => {
      const previous = sourceRef.current;
      sourceRef.current = null;
      void previous?.dispose().catch((error: unknown) => {
        console.error("[Reviewer] 清理成稿临时文件失败", error);
      });
    },
    [client, chapterId, pageIds],
  );
  return useCallback(
    (pageId, signal) => {
      sourceRef.current ??= createArtworkPageSource(client, chapterId, pageIds);
      const loadPage = sourceRef.current.loadPage;
      if (!loadPage) throw new Error("成稿预览不可用");
      return loadPage(pageId, signal);
    },
    [client, chapterId, pageIds],
  );
}
