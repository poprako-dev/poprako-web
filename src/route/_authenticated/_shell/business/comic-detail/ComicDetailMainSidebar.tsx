import type { usePageArtworks } from "@/route/_authenticated/business/artwork/use-page-artworks";

import type { ReactElement } from "react";

import { ComicDetailSidebar } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailSidebar";
import { ChapterIssueImportButton } from "./ChapterIssueImportButton";
import { canImportIssues } from "@/route/_authenticated/business/issue/issue-import";

import type { ComicDetailMainViewProps } from "./ComicDetailMainView";

type Props = Pick<
  ComicDetailMainViewProps,
  | "mode"
  | "onModeChange"
  | "onArtworkExported"
  | "chapters"
  | "assignments"
  | "comicInfo"
  | "pages"
  | "exportState"
  | "isArchivingComic"
  | "isDeletingComic"
  | "callbacks"
  | "showToast"
  | "onConfirmAction"
  | "coverInputRef"
> & { artworks: ReturnType<typeof usePageArtworks> };

export function ComicDetailMainSidebar({
  mode,
  onModeChange,
  onArtworkExported,
  chapters,
  assignments,
  comicInfo,
  pages,
  exportState,
  isArchivingComic,
  isDeletingComic,
  callbacks,
  showToast,
  onConfirmAction,
  coverInputRef,
  artworks,
}: Props): ReactElement {
  const selectedChapterId = chapters.selectedChapterId;
  const navigateToWorkbench = callbacks.onNavigateToWorkbench;
  const canDeleteChapterPages =
    assignments.canUploadRawPages &&
    pages.pages.length > 0 &&
    Boolean(chapters.selectedChapterId) &&
    Boolean(callbacks.onDeleteChapterPages);
  const canClickPage = assignments.canTranslateOrProofread || assignments.canReadOnly;

  return (
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
            onImported={artworks.reload}
          />
        ) : undefined
      }
      comicInfo={comicInfo}
      selectedChapter={chapters.selectedChapter}
      pagesLength={mode === "reviewer" ? artworks.pages.length : pages.pages.length}
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
              if (mode === "reviewer") {
                if (!artworks.pages[0]) {
                  showToast("当前章节尚未上传嵌稿", "error");
                  return;
                }
                navigateToWorkbench(selectedChapterId, artworks.pages[0].id, true, mode);
                return;
              }
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
}
