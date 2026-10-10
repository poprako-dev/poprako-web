import { useMemo } from "react";

import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

import type { PageUploadTaskStatus } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import { usePageResults } from "./use-page-results";
import { useApiClient } from "@/route/business/api-context";

import { usePageTaskView, mergePendingPages } from "./use-page-task-view";
import { useAddRawPages, useReuploadPage } from "./use-page-upload-actions";
import { useChapterStatsRecovery, useReloadChapterStats } from "./use-page-chapter-stats";
import { useChapterPageDeletion } from "./use-chapter-page-deletion";

type ShowToast = (message: string, type: ToastType) => void;

export type ComicDetailPagesArgs = {
  chapterId: string | null;
  comicId: string;
  isSelectedChapterAvailable: boolean;
  onLoadPages: DetailContract["onLoadPages"];
  onLoadChapters: DetailContract["onLoadChapters"];
  onDeleteChapterPages?: DetailContract["onDeleteChapterPages"] | undefined;
  reloadLoadedChapters: () => Promise<ChapterInfo[] | null>;
  showToast: ShowToast;
};

export type PageState = {
  pages: PageInfo[];
  isPagesLoading: boolean;
  uploadProgressByPageId: Record<string, number>;
  uploadStatusByPageId: Record<string, PageUploadTaskStatus>;
  uploadErrorByPageId: Record<string, string>;
  reuploadingPageIds: Record<string, boolean>;
  isDeletingChapterPages: boolean;
  pageRecoveryNeeded: boolean;
  chapterStatsRecoveryNeeded: boolean;
  retryChapterStats: () => Promise<void>;
  reloadCurrentPages: () => Promise<void>;
  reloadChapterStats: () => Promise<ChapterInfo[] | null>;
  handleAddRawPages: (files: File[]) => Promise<void>;
  handleDeleteAllChapterPages: () => Promise<void>;
  handleReuploadPage: (pageId: string, file: File) => Promise<void>;
};

export function useComicDetailPages(args: ComicDetailPagesArgs): PageState {
  const { chapterId, isSelectedChapterAvailable, onLoadPages, showToast } = args;
  const client = useApiClient();
  const taskView = usePageTaskView(chapterId);
  const { taskByPageId } = taskView;
  const results = usePageResults({
    client,
    chapterId,
    available: isSelectedChapterAvailable,
    tasks: taskByPageId,
    onLoadPages,
    showToast,
  });
  const { serverPages, capture } = results;

  const pages = useMemo(
    () => mergePendingPages(serverPages, taskByPageId),
    [serverPages, taskByPageId],
  );
  const stats = useChapterStatsRecovery(args, capture);
  const deletion = useChapterPageDeletion(args, results, stats.refreshChapterStats);
  const handleAddRawPages = useAddRawPages(client, args, capture);
  const handleReuploadPage = useReuploadPage(client, args, capture, taskView.reuploadingPageIds);
  const reloadChapterStats = useReloadChapterStats(args);

  return {
    ...taskView,
    ...deletion,
    pages,
    isPagesLoading: results.isPagesLoading,
    reloadCurrentPages: results.reloadCurrentPages,
    pageRecoveryNeeded: results.pageRecoveryNeeded,
    chapterStatsRecoveryNeeded: stats.chapterStatsRecoveryNeeded,
    retryChapterStats: stats.retryChapterStats,
    reloadChapterStats,
    handleAddRawPages,
    handleReuploadPage,
  };
}
