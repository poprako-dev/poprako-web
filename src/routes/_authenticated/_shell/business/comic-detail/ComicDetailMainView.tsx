import type { ReactElement, RefObject } from "react";
import type { ComicDetailView } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import type { ComicDetailModalProps } from "@/routes/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { PendingConfirmAction } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import type { useComicDetailChapters } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";
import type { useComicDetailAssignments } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments";
import type { useComicDetailPages } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-pages";
import type { useComicDetailExport } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-export";
import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { ComicDetailHeader } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailHeader";
import { ComicDetailSidebar } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailSidebar";
import { ComicDetailContent } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import { ComicDetailModalLayout } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModalLayout";
import { PageList } from "@/routes/_authenticated/_shell/business/comic-detail/page/PageList";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { canUploadArtwork } from "@/routes/_authenticated/_shell/business/comic-detail/upload/artwork-upload";

type Args = {
  comicInfo: ComicDetailModalProps["comicInfo"];
  activeMember: ComicDetailModalProps["activeMember"];
  onClose: ComicDetailModalProps["onClose"];
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
    ComicDetailModalProps,
    | "onCreateChapter"
    | "onDeleteChapter"
    | "onUpdateComic"
    | "onUpdateChapter"
    | "onArchiveComic"
    | "onDeleteComic"
    | "onNavigateToTranslator"
    | "onAddPages"
    | "onDeleteChapterPages"
    | "onAllocPageUpload"
    | "onExportChapter"
  >;
  activeView: ComicDetailView;
  onChangeView: (view: ComicDetailView) => void;
  workflowPanel: ReactElement;
  isArchivingComic: boolean;
  isDeletingComic: boolean;
  coverInputRef: RefObject<HTMLInputElement | null>;
  onOpenArtwork: (chapter: ChapterInfo) => void;
  onOpenComicModifier: () => void;
  onOpenChapterModifier: (chapter: ChapterInfo) => void;
  onConfirmAction: (action: PendingConfirmAction) => void;
  showToast: (message: string, type: ToastType) => void;
};

export function ComicDetailMainView({
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
  onOpenComicModifier,
  onOpenChapterModifier,
  onConfirmAction,
  showToast,
}: Args): ReactElement {
  const selectedChapterId = chapters.selectedChapterId;
  const navigateToTranslator = callbacks.onNavigateToTranslator;
  const canDeleteChapterPages =
    assignments.canUploadRawPages &&
    pages.pages.length > 0 &&
    Boolean(chapters.selectedChapterId) &&
    Boolean(callbacks.onDeleteChapterPages);
  const canUploadNewRawPages =
    assignments.canUploadRawPages &&
    Boolean(chapters.selectedChapterId) &&
    Boolean(callbacks.onAddPages);
  const canReuploadRawPages = assignments.canUploadRawPages && Boolean(callbacks.onAllocPageUpload);
  const canClickPage = assignments.canTranslateOrProofread || assignments.canReadOnly;

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
      onLongPressTitle={
        callbacks.onUpdateComic && assignments.isTeamAdmin ? onOpenComicModifier : undefined
      }
      onLongPressChapter={
        callbacks.onUpdateChapter && assignments.canManageChapterAssignments
          ? onOpenChapterModifier
          : undefined
      }
      onClose={onClose}
    />
  );

  const sidebar = (
    <ComicDetailSidebar
      comicInfo={comicInfo}
      selectedChapter={chapters.selectedChapter}
      pagesLength={pages.pages.length}
      canUploadArtwork={canUploadArtwork(chapters.selectedChapter, assignments.currentAssignment)}
      onUploadArtwork={() => {
        if (chapters.selectedChapter) onOpenArtwork(chapters.selectedChapter);
      }}
      canReadOnly={assignments.canReadOnly}
      canUploadCover={exportState.canUploadCover}
      canTranslateOrProofread={assignments.canTranslateOrProofread}
      canDeleteChapterPages={canDeleteChapterPages}
      canArchiveComic={assignments.isTeamAdmin && Boolean(callbacks.onArchiveComic)}
      isTeamAdmin={assignments.isTeamAdmin && Boolean(callbacks.onDeleteComic)}
      isDeletingChapterPages={pages.isDeletingChapterPages}
      isArchivingComic={isArchivingComic}
      isDeletingComic={isDeletingComic}
      isExportingData={exportState.isExportingData}
      isImportingData={exportState.isImportingData}
      onNavigateReadOnly={
        assignments.canReadOnly && selectedChapterId && navigateToTranslator
          ? () => {
              const firstPageId = pages.pages[0]?.id;
              if (!firstPageId) {
                showToast("当前章节暂无页面", "error");
                return;
              }
              navigateToTranslator(selectedChapterId, firstPageId, true);
            }
          : undefined
      }
      onExport={
        callbacks.onExportChapter
          ? () => {
              onConfirmAction("export-data");
            }
          : undefined
      }
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
      pages={pages.pages}
      enableClick={canClickPage}
      onClickPage={
        canClickPage
          ? (pageId) => {
              if (!chapters.selectedChapterId || !callbacks.onNavigateToTranslator) return;
              callbacks.onNavigateToTranslator(
                chapters.selectedChapterId,
                pageId,
                !assignments.canTranslateOrProofread || undefined,
              );
            }
          : undefined
      }
      onAddPages={canUploadNewRawPages ? pages.handleAddRawPages : undefined}
      canReuploadPage={canReuploadRawPages ? () => true : undefined}
      isPageReuploading={(pageId) => pages.reuploadingPageIds[pageId] === true}
      onReuploadPage={
        canReuploadRawPages
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
          pageList={pageGrid}
          workflowPanel={workflowPanel}
          onChangeView={onChangeView}
        />
      }
    />
  );
}
