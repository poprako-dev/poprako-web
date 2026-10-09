import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { ReactElement, RefObject } from "react";
import type { ComicDetailView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { PendingConfirmAction } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import type { useComicDetailChapters } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";
import type { useComicDetailAssignments } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments";
import type { useComicDetailPages } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-pages";
import type { useComicDetailExport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-export";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { ComicDetailHeader } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailHeader";
import { ComicDetailSidebar } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailSidebar";
import { ChapterIssueImportButton } from "./ChapterIssueImportButton";
import { canImportIssues } from "@/route/_authenticated/business/issue/issue-import";
import { ComicDetailContent } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import { ComicDetailModalLayout } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalLayout";
import { PageList } from "@/route/_authenticated/_shell/business/comic-detail/page/PageList";
import { Button } from "@/shared/component/Button";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { canUploadArtwork } from "@/route/_authenticated/_shell/business/comic-detail/upload/artwork-upload";

type Args = {
  mode: ComicDetailMode;
  onModeChange: (mode: ComicDetailMode) => void;
  comicInfo: DetailContract["comicInfo"];
  activeMember: DetailContract["activeMember"];
  onClose: DetailContract["onClose"];
  chapters: ReturnType<typeof useComicDetailChapters>;
  assignments: ReturnType<typeof useComicDetailAssignments>;
  pages: ReturnType<typeof useComicDetailPages>;
  exportState: Pick<
    ReturnType<typeof useComicDetailExport>,
    | "canUploadCover"
    | "coverUpload"
    | "isExportingData"
    | "isImportingData"
    | "handleImportFileChange"
  >;
  callbacks: Pick<
    DetailContract,
    | "onCreateChapter"
    | "onDeleteChapter"
    | "onUpdateComic"
    | "onUpdateChapter"
    | "onArchiveComic"
    | "onDeleteComic"
    | "onNavigateToWorkbench"
    | "onDeleteChapterPages"
    | "onExportChapter"
  >;
  activeView: ComicDetailView;
  onChangeView: (view: ComicDetailView) => void;
  workflowPanel: ReactElement;
  isArchivingComic: boolean;
  isDeletingComic: boolean;
  coverInputRef: RefObject<HTMLInputElement | null>;
  onOpenArtwork: (chapter: ChapterInfo) => void;
  onArtworkExported: () => void;
  onOpenComicModifier: () => void;
  onOpenChapterModifier: (chapter: ChapterInfo) => void;
  onConfirmAction: (action: PendingConfirmAction) => void;
  showToast: (message: string, type: ToastType) => void;
};

export function ComicDetailMainView({
  mode,
  onModeChange,
  comicInfo,
  activeMember,
  onClose,
  chapters,
  assignments,
  pages,
  exportState,
  callbacks,
  activeView,
  onChangeView,
  workflowPanel,
  isArchivingComic,
  isDeletingComic,
  coverInputRef,
  onOpenArtwork,
  onArtworkExported,
  onOpenComicModifier,
  onOpenChapterModifier,
  onConfirmAction,
  showToast,
}: Args): ReactElement {
  const selectedChapterId = chapters.selectedChapterId;
  const navigateToWorkbench = callbacks.onNavigateToWorkbench;
  const canDeleteChapterPages =
    assignments.canUploadRawPages &&
    pages.pages.length > 0 &&
    Boolean(chapters.selectedChapterId) &&
    Boolean(callbacks.onDeleteChapterPages);
  const canUploadNewRawPages = assignments.canUploadRawPages && Boolean(chapters.selectedChapterId);
  const canReuploadRawPages = assignments.canUploadRawPages;
  const canClickPage = assignments.canTranslateOrProofread || assignments.canReadOnly;

  async function copyTitle(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`[${comicInfo.author}]${comicInfo.title}`);
      showToast("已复制格式化标题", "success");
    } catch (error: unknown) {
      console.error("[ComicDetailModal] 复制格式化标题失败:", error);
      showToast("复制失败，请重试", "error");
    }
  }

  const header = (
    <ComicDetailHeader
      comicInfo={comicInfo}
      activeMember={activeMember}
      chapters={chapters.chapters}
      selectedChapter={chapters.selectedChapter}
      selectedChapterId={chapters.selectedChapterId}
      hasMore={chapters.chaptersHasMore}
      isLoading={chapters.isChaptersLoading}
      canCreateChapter={assignments.canCreateChapter}
      onLoadMore={chapters.handleLoadMoreChapters}
      onSelect={chapters.setSelectedChapterId}
      onCreateChapter={callbacks.onCreateChapter}
      onCreate={(subtitle, presetAssignmentRoles) =>
        chapters.handleCreateChapter(subtitle, presetAssignmentRoles, callbacks.onCreateChapter)
      }
      onDeleteChapter={callbacks.onDeleteChapter}
      onDelete={(chapterId) => chapters.handleDeleteChapter(chapterId, callbacks.onDeleteChapter)}
      onLongPressTitle={assignments.isTeamAdmin ? onOpenComicModifier : undefined}
      onLongPressChapter={
        assignments.canManageChapterAssignments ? onOpenChapterModifier : undefined
      }
      onCopyTitle={() => {
        void copyTitle();
      }}
      onClose={onClose}
    />
  );

  const sidebar = (
    <ComicDetailSidebar
      mode={mode}
      onModeChange={onModeChange}
      onArtworkExported={onArtworkExported}
      issueImportAction={
        chapters.selectedChapter &&
        canImportIssues(chapters.selectedChapter, assignments.currentAssignment) ? (
          <ChapterIssueImportButton
            key={chapters.selectedChapter.id}
            chapterId={chapters.selectedChapter.id}
          />
        ) : undefined
      }
      comicInfo={comicInfo}
      selectedChapter={chapters.selectedChapter}
      pagesLength={pages.pages.length}
      canUploadArtwork={canUploadArtwork(chapters.selectedChapter, assignments.currentAssignment)}
      onUploadArtwork={() => {
        if (chapters.selectedChapter) onOpenArtwork(chapters.selectedChapter);
      }}
      canReadOnly={mode === "reviewer" ? canClickPage : assignments.canReadOnly}
      canUploadCover={exportState.canUploadCover}
      canTranslateOrProofread={assignments.canTranslateOrProofread}
      canDeleteChapterPages={canDeleteChapterPages}
      canArchiveComic={assignments.isTeamAdmin}
      isTeamAdmin={assignments.isTeamAdmin}
      isDeletingChapterPages={pages.isDeletingChapterPages}
      isArchivingComic={isArchivingComic}
      isDeletingComic={isDeletingComic}
      isExportingData={exportState.isExportingData}
      isImportingData={exportState.isImportingData}
      onNavigateReadOnly={
        (mode === "reviewer" ? canClickPage : assignments.canReadOnly) && selectedChapterId
          ? () => {
              const firstPageId = pages.pages[0]?.id;
              if (!firstPageId) {
                showToast("当前章节暂无页面", "error");
                return;
              }
              navigateToWorkbench(selectedChapterId, firstPageId, true, mode);
            }
          : undefined
      }
      onExport={() => {
        onConfirmAction("export-data");
      }}
      onImportFileChange={exportState.handleImportFileChange}
      onDeletePages={() => {
        onConfirmAction("delete-pages");
      }}
      onArchiveComic={() => {
        onConfirmAction("archive-comic");
      }}
      onDeleteComic={() => {
        onConfirmAction("delete-comic");
      }}
      coverInputRef={coverInputRef}
      coverUpload={exportState.coverUpload}
    />
  );

  const pageGrid = pages.isPagesLoading ? (
    <div className="flex h-full items-center justify-center">
      <LoadingCircle size={22} aria-label="正在加载页面" />
    </div>
  ) : (
    <PageList
      mode={mode}
      pages={pages.pages}
      enableClick={canClickPage}
      onClickPage={
        canClickPage
          ? (pageId) => {
              if (!chapters.selectedChapterId) return;
              callbacks.onNavigateToWorkbench(
                chapters.selectedChapterId,
                pageId,
                !assignments.canTranslateOrProofread || undefined,
                mode,
              );
            }
          : undefined
      }
      onAddPages={
        mode === "translator" && canUploadNewRawPages ? pages.handleAddRawPages : undefined
      }
      canReuploadPage={mode === "translator" && canReuploadRawPages ? () => true : undefined}
      isPageReuploading={(pageId) => pages.reuploadingPageIds[pageId] === true}
      onReuploadPage={
        mode === "translator" && canReuploadRawPages
          ? (pageId, file) => {
              void pages.handleReuploadPage(pageId, file);
            }
          : undefined
      }
      reuploadAccept="image/*"
      accept="image/*"
      uploadProgressByPageId={pages.uploadProgressByPageId}
      uploadStatusByPageId={pages.uploadStatusByPageId}
      uploadErrorByPageId={pages.uploadErrorByPageId}
    />
  );

  return (
    <ComicDetailModalLayout
      header={header}
      sidebar={sidebar}
      content={
        <ComicDetailContent
          activeView={activeView}
          chapterId={chapters.selectedChapterId}
          pageList={
            <>
              {pages.pageRecoveryNeeded && (
                <div role="alert" className="flex items-center gap-2 p-2">
                  <span>页面信息加载失败</span>
                  <Button
                    onClick={() => {
                      void pages.reloadCurrentPages();
                    }}
                  >
                    重新加载页面
                  </Button>
                </div>
              )}
              {pages.chapterStatsRecoveryNeeded && (
                <div role="alert" className="flex items-center gap-2 p-2">
                  <span>页面已清空，章节统计刷新失败</span>
                  <Button
                    onClick={() => {
                      void pages.retryChapterStats();
                    }}
                  >
                    重新加载章节信息
                  </Button>
                </div>
              )}
              {pageGrid}
            </>
          }
          workflowPanel={workflowPanel}
          onChangeView={onChangeView}
        />
      }
    />
  );
}
