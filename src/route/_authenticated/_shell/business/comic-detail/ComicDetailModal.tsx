import {
  readComicDetailMode,
  saveComicDetailMode,
} from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import { useCallback, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { Role } from "@/route/business/identity/role";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useDetailResource } from "./use-detail-resource";
import type { DetailComicInfo } from "./detail-request";
import type { ComicDetailView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import { ComicDetailMainView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailMainView";
import { ComicDetailWorkflowView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailWorkflowView";
import { ComicDetailModalDialogs } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import { useComicDetailModalActions } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-modal-actions";
import type { PendingConfirmAction } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import { useComicDetailAssignments } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments";
import { useComicDetailChapters } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";
import { useComicDetailExport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-export";
import { useComicDetailPages } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-pages";
import { useComicDetailWorkflowRecords } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records";
import { useWorkflowRecordUsers } from "@/route/_authenticated/_shell/business/comic-detail/use-workflow-record-users";

type Props = {
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
export function ComicDetailModal({
  comicInfo,
  pinnedChapter,
  initialChapterId,
  onNavigateToWorkbench,
  mode,
  onModeChange,
  onChanged,
  onClose,
}: Props): ReactElement {
  const resource = useDetailResource({ comic: comicInfo, onChanged, onClose });
  const pinnedChapterAssignments = comicInfo.pinnedChapterAssignments;
  const {
    onLoadChapters,
    onLoadAssignments,
    onLoadPages,
    onLoadWorkflowRecords,
    onResolveWorkflowRecordUser,
    onTransiteWorkflow,
    onRemoveAssignment,
    onLoadAssignableMembers,
    onAddAssignment,
    onCreateChapter,
    onDeleteChapter,
    currentUserId,
    onDeleteChapterPages,
    onJoinChapterRole,
    onExportChapter,
    onImportChapter,
    onArchiveComic,
    onDeleteComic,
    onUpdateComic,
    onUpdateChapter,
    activeMember,
  } = resource;

  const { showToast } = useToastStore();
  const [localMode, setLocalMode] = useState(() => readComicDetailMode(currentUserId));
  const currentMode = mode ?? localMode;
  const [activeView, setActiveView] = useState<ComicDetailView>("pages");
  const [pendingConfirmAction, setPendingConfirmAction] = useState<PendingConfirmAction>(null);
  const [isArchivingComic, setIsArchivingComic] = useState(false);
  const [isDeletingComic, setIsDeletingComic] = useState(false);
  const [showComicModifier, setShowComicModifier] = useState(false);
  const [chapterToModify, setChapterToModify] = useState<ChapterInfo | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const chapterState = useComicDetailChapters({
    comicId: comicInfo.id,
    pinnedChapter,
    initialChapterId,
    onLoadChapters,
    showToast,
  });
  const {
    setChapters,
    selectedChapter,
    selectedChapterId,
    isSelectedChapterAvailable,
    reloadLoadedChapters,
  } = chapterState;

  const {
    state: workflowRecordState,
    refreshLatest: refreshWorkflowRecords,
    loadMore: loadMoreWorkflowRecords,
  } = useComicDetailWorkflowRecords({
    chapterId: selectedChapterId,
    enabled: activeView === "workflow",
    onLoadWorkflowRecords,
  });

  const handleWorkflowRecordsChanged = useCallback(() => {
    if (activeView === "workflow") void refreshWorkflowRecords();
  }, [activeView, refreshWorkflowRecords]);

  const assignmentState = useComicDetailAssignments({
    selectedChapterId,
    isSelectedChapterAvailable,
    currentUserId,
    activeMember,
    pinnedChapterId: pinnedChapter?.id,
    pinnedChapterAssignments,
    onLoadAssignments,
    onAddAssignment,
    onRemoveAssignment,
    onJoinChapterRole,
    onWorkflowRecordsChanged: handleWorkflowRecordsChanged,
    showToast,
  });

  const {
    assignments,
    isAssignmentsLoading,
    memberSelectorRole,
    setMemberSelectorRole,
    isMemberSelectorLoading,
    setIsMemberSelectorLoading,
    isAddingAssignment,
    joiningRoles,
    leavingRoles,
    canManageChapterAssignments,
    canUploadRawPages,
    handleRemoveAssignment,
    handleOpenMemberSelector,
    handleAddAssignment,
    canJoinRole,
    canLeaveRole,
    handleJoinRole,
    handleLeaveRole,
  } = assignmentState;

  const getWorkflowRecordUserLabel = useWorkflowRecordUsers({
    records: workflowRecordState.records,
    assignments,
    onResolveUser: onResolveWorkflowRecordUser,
  });

  const pageState = useComicDetailPages({
    chapterId: selectedChapterId,
    comicId: comicInfo.id,
    isSelectedChapterAvailable: isSelectedChapterAvailable && currentMode === "translator",
    onLoadPages,
    onLoadChapters,
    onDeleteChapterPages,
    reloadLoadedChapters,
    showToast,
  });
  const { pages, reloadCurrentPages, handleDeleteAllChapterPages } = pageState;

  const exportState = useComicDetailExport({
    comicId: comicInfo.id,
    comicTitle: comicInfo.title,
    comicAuthor: comicInfo.author,
    comicIndex: comicInfo.index,
    comicCoverThumbnailUrl: comicInfo.coverThumbnailUrl,
    isCoverUploaded: comicInfo.isCoverUploaded,
    selectedChapterId,
    selectedChapter,
    pages,
    assignments,
    activeMember,
    canUploadRawPages,
    onExportChapter,
    onImportChapter,
    reloadCurrentPages,
    reloadLoadedChapters: async () => {
      await reloadLoadedChapters();
    },
    onWorkflowRecordsChanged: handleWorkflowRecordsChanged,
    showToast,
  });
  const {
    isImportingData,
    pendingImport,
    confirmImport,
    cancelImport,
    isExportingData,
    exportProgress,
    handleExportData,
    cancelExport,
  } = exportState;

  const {
    handleTransition,
    handleDeleteCurrentComic,
    handleArchiveCurrentComic,
    handleUpdateChapterLocal,
  } = useComicDetailModalActions({
    comicId: comicInfo.id,
    selectedChapterId,
    selectedChapter,
    onTransiteWorkflow,
    onDeleteComic,
    onArchiveComic,
    setChapters,
    setIsDeletingComic,
    setIsArchivingComic,
    handleWorkflowRecordsChanged,
    showToast,
  });

  const assignmentProps = {
    selectedChapter,
    assignments,
    currentUserId,
    onTransiteWorkflow: handleTransition,
    onRemoveAssignment: handleRemoveAssignment,
    onAddAssignment: handleOpenMemberSelector,
    onJoinRole: handleJoinRole,
    canJoinRole,
    isRoleJoining: (role: Role) => joiningRoles[role] === true,
    onLeaveRole: handleLeaveRole,
    canLeaveRole,
    isRoleLeaving: (role: Role) => leavingRoles[role] === true,
    canOperateWorkflow: canManageChapterAssignments,
    canManageAssignments: canManageChapterAssignments,
  };

  const workflowPanel = (
    <ComicDetailWorkflowView
      assignmentProps={assignmentProps}
      isAssignmentsLoading={isAssignmentsLoading}
      chapterId={selectedChapterId}
      workflowRecordState={workflowRecordState}
      getWorkflowRecordUserLabel={getWorkflowRecordUserLabel}
      loadMoreWorkflowRecords={loadMoreWorkflowRecords}
    />
  );

  return (
    <>
      <ComicDetailMainView
        mode={currentMode}
        onModeChange={(next) => {
          setLocalMode(next);
          saveComicDetailMode(currentUserId, next);
          onModeChange?.(next, selectedChapterId);
        }}
        comicInfo={comicInfo}
        activeMember={activeMember}
        onClose={onClose}
        chapters={chapterState}
        assignments={assignmentState}
        pages={pageState}
        exportState={exportState}
        callbacks={{
          onCreateChapter,
          onDeleteChapter,
          onUpdateComic,
          onUpdateChapter,
          onArchiveComic,
          onDeleteComic,
          onNavigateToWorkbench,
          onDeleteChapterPages,
          onExportChapter,
        }}
        activeView={activeView}
        onChangeView={setActiveView}
        workflowPanel={workflowPanel}
        isArchivingComic={isArchivingComic}
        isDeletingComic={isDeletingComic}
        coverInputRef={coverInputRef}
        onArtworkExported={() => {
          void reloadLoadedChapters();
          handleWorkflowRecordsChanged();
        }}
        onOpenComicModifier={() => {
          setShowComicModifier(true);
        }}
        onOpenChapterModifier={setChapterToModify}
        onConfirmAction={setPendingConfirmAction}
        showToast={showToast}
      />
      <ComicDetailModalDialogs
        comicInfo={comicInfo}
        isExportingData={isExportingData}
        exportProgress={exportProgress}
        cancelExport={cancelExport}
        pendingImport={pendingImport}
        isImportingData={isImportingData}
        confirmImport={confirmImport}
        cancelImport={cancelImport}
        memberSelectorRole={memberSelectorRole}
        selectedChapterId={selectedChapterId}
        onLoadAssignableMembers={onLoadAssignableMembers}
        setIsMemberSelectorLoading={setIsMemberSelectorLoading}
        isMemberSelectorLoading={isMemberSelectorLoading}
        isAddingAssignment={isAddingAssignment}
        onAddAssignment={handleAddAssignment}
        closeMemberSelector={() => {
          setMemberSelectorRole(null);
        }}
        pendingConfirmAction={pendingConfirmAction}
        setPendingConfirmAction={setPendingConfirmAction}
        pagesLength={pages.length}
        deleteAllChapterPages={handleDeleteAllChapterPages}
        deleteComic={handleDeleteCurrentComic}
        archiveComic={handleArchiveCurrentComic}
        handleExportData={handleExportData}
        showComicModifier={showComicModifier}
        setShowComicModifier={setShowComicModifier}
        onUpdateComic={onUpdateComic}
        chapterToModify={chapterToModify}
        setChapterToModify={setChapterToModify}
        onUpdateChapter={onUpdateChapter}
        onWorkflowRecordsChanged={handleWorkflowRecordsChanged}
        updateChapterLocal={handleUpdateChapterLocal}
      />
    </>
  );
}
