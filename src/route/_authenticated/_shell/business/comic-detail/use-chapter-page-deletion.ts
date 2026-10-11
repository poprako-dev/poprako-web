import { useCallback, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";

import { clearChapterUploadTasks } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import type { usePageResults } from "./use-page-results";

import type { ComicDetailPagesArgs as Args, PageState } from "./use-comic-detail-pages";
type Results = ReturnType<typeof usePageResults>;

interface DeletionOwner {
  isCurrent: () => boolean;
}
type DeleteRequest = {
  chapterId: string;
  onDeleteChapterPages: NonNullable<Args["onDeleteChapterPages"]>;
  showToast: Args["showToast"];
  results: Results;
  isCurrent: () => boolean;
  isSameSession: () => boolean;
  request: DeletionOwner;
  setDeletion: React.Dispatch<React.SetStateAction<DeletionOwner | null>>;
  refreshChapterStats: () => Promise<boolean>;
};

async function deleteChapterPages({
  chapterId,
  onDeleteChapterPages,
  showToast,
  results,
  isCurrent,
  isSameSession,
  request,
  setDeletion,
  refreshChapterStats,
}: DeleteRequest): Promise<void> {
  try {
    const res = await onDeleteChapterPages(chapterId);
    if (!res.success) {
      if (isCurrent()) {
        console.error("[ComicDetailModal] 批量删除页面失败", { chapterId, result: res });
        showLocalApiFailure(res, showToast);
      }
      return;
    }
    if (!isSameSession()) return;
    clearChapterUploadTasks(chapterId);
    if (!isCurrent()) return;
    setDeletion((current) => (current === request ? null : current));
    results.clear();
    const isClearedOwnerCurrent = results.capture();
    const refreshed = await refreshChapterStats();
    if (refreshed && isClearedOwnerCurrent()) showToast("页面已清空", "success");
  } catch (error) {
    if (isCurrent()) {
      console.error("[ComicDetailModal] 批量删除页面异常", { chapterId, error });
      showLocalCaughtError(error, showToast, "清空页面失败");
    }
  } finally {
    if (isCurrent()) setDeletion((current) => (current === request ? null : current));
  }
}

export function useChapterPageDeletion(
  args: Args,
  results: Results,
  refreshChapterStats: DeleteRequest["refreshChapterStats"],
): Pick<PageState, "isDeletingChapterPages" | "handleDeleteAllChapterPages"> {
  const { chapterId, onDeleteChapterPages, showToast } = args;
  const { capture } = results;
  const [deletion, setDeletion] = useState<DeletionOwner | null>(null);
  const isDeletingChapterPages = deletion?.isCurrent() ?? false;
  const handleDeleteAllChapterPages = useCallback(async (): Promise<void> => {
    if (!chapterId || !onDeleteChapterPages || isDeletingChapterPages) return;
    const isCurrent = capture();
    const isSameSession = results.captureSession();
    const request = { isCurrent };
    setDeletion(request);
    await deleteChapterPages({
      chapterId,
      onDeleteChapterPages,
      showToast,
      results,
      isCurrent,
      isSameSession,
      request,
      setDeletion,
      refreshChapterStats,
    });
  }, [
    chapterId,
    onDeleteChapterPages,
    isDeletingChapterPages,
    capture,
    results,
    refreshChapterStats,
    showToast,
  ]);
  return { isDeletingChapterPages, handleDeleteAllChapterPages };
}
