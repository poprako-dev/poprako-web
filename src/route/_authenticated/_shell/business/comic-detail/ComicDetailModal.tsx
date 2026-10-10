import { saveComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";

import type { ReactElement } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";

import type { DetailComicInfo } from "./detail-request";

import { ComicDetailMainView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailMainView";

import { ComicDetailModalDialogs } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";

import { useComicDetailModalState } from "./use-comic-detail-modal-state";
import { ComicDetailModalWorkflow } from "./ComicDetailModalWorkflow";

export type ComicDetailModalProps = {
  comicInfo: DetailComicInfo;
  pinnedChapter: ChapterInfo | null;
  initialChapterId: string | null;
  onNavigateToWorkbench: (
    chapterId: string,
    pageId: string,
    isReadOnly?: boolean,
    mode?: ComicDetailMode,
  ) => void;
  mode?: ComicDetailMode;
  onModeChange?: (mode: ComicDetailMode, chapterId: string | null) => void;
  onChanged: () => void;
  onClose: () => void;
};

type Props = ComicDetailModalProps;

export function ComicDetailModal(props: Props): ReactElement {
  const { comicInfo, onNavigateToWorkbench, onModeChange, onClose } = props;
  const state = useComicDetailModalState(props);
  const {
    resource,
    presentation,
    chapters,
    workflow,
    assignments,
    pages,
    exportState,
    actions,
    showToast,
  } = state;

  return (
    <>
      <ComicDetailMainView
        mode={presentation.currentMode}
        onModeChange={(next) => {
          presentation.setLocalMode(next);
          saveComicDetailMode(resource.currentUserId, next);
          onModeChange?.(next, chapters.selectedChapterId);
        }}
        comicInfo={comicInfo}
        activeMember={resource.activeMember}
        onClose={onClose}
        chapters={chapters}
        assignments={assignments}
        pages={pages}
        exportState={exportState}
        callbacks={{
          onCreateChapter: resource.onCreateChapter,
          onDeleteChapter: resource.onDeleteChapter,
          onUpdateComic: resource.onUpdateComic,
          onUpdateChapter: resource.onUpdateChapter,
          onArchiveComic: resource.onArchiveComic,
          onDeleteComic: resource.onDeleteComic,
          onNavigateToWorkbench,
          onDeleteChapterPages: resource.onDeleteChapterPages,
          onExportChapter: resource.onExportChapter,
        }}
        activeView={presentation.activeView}
        onChangeView={presentation.setActiveView}
        workflowPanel={<ComicDetailModalWorkflow state={state} />}
        isArchivingComic={presentation.isArchivingComic}
        isDeletingComic={presentation.isDeletingComic}
        coverInputRef={presentation.coverInputRef}
        onArtworkExported={() => {
          void chapters.reloadLoadedChapters();
          workflow.changed();
        }}
        onOpenComicModifier={() => {
          presentation.setShowComicModifier(true);
        }}
        onOpenChapterModifier={presentation.setChapterToModify}
        onConfirmAction={presentation.setPendingConfirmAction}
        showToast={showToast}
      />
      <ComicDetailModalDialogs
        comicInfo={comicInfo}
        isExportingData={exportState.isExportingData}
        exportProgress={exportState.exportProgress}
        cancelExport={exportState.cancelExport}
        pendingImport={exportState.pendingImport}
        isImportingData={exportState.isImportingData}
        confirmImport={exportState.confirmImport}
        cancelImport={exportState.cancelImport}
        memberSelectorRole={assignments.memberSelectorRole}
        selectedChapterId={chapters.selectedChapterId}
        onLoadAssignableMembers={resource.onLoadAssignableMembers}
        setIsMemberSelectorLoading={assignments.setIsMemberSelectorLoading}
        isMemberSelectorLoading={assignments.isMemberSelectorLoading}
        isAddingAssignment={assignments.isAddingAssignment}
        onAddAssignment={assignments.handleAddAssignment}
        closeMemberSelector={() => {
          assignments.setMemberSelectorRole(null);
        }}
        pendingConfirmAction={presentation.pendingConfirmAction}
        setPendingConfirmAction={presentation.setPendingConfirmAction}
        pagesLength={pages.pages.length}
        deleteAllChapterPages={pages.handleDeleteAllChapterPages}
        deleteComic={actions.handleDeleteCurrentComic}
        archiveComic={actions.handleArchiveCurrentComic}
        handleExportData={exportState.handleExportData}
        showComicModifier={presentation.showComicModifier}
        setShowComicModifier={presentation.setShowComicModifier}
        onUpdateComic={resource.onUpdateComic}
        chapterToModify={presentation.chapterToModify}
        setChapterToModify={presentation.setChapterToModify}
        onUpdateChapter={resource.onUpdateChapter}
        onWorkflowRecordsChanged={workflow.changed}
        updateChapterLocal={actions.handleUpdateChapterLocal}
      />
    </>
  );
}
