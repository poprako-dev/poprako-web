import { useCallback, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { Role } from "@/routes/business/identity/role";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useAppStore } from "@/routes/business/session/session-store";
import type { ComicDetailView } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailContent";
import { ComicDetailMainView } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailMainView";
import { ComicDetailWorkflowView } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailWorkflowView";
import { ComicDetailModalDialogs } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import { useComicDetailModalActions } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-modal-actions";
import type { PendingConfirmAction } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModalDialogs";
import { useComicDetailAssignments } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-assignments";
import { useComicDetailChapters } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";
import { useComicDetailExport } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-export";
import { useComicDetailPages } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-pages";
import { useComicDetailWorkflowRecords } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records";
import { useWorkflowRecordUsers } from "@/routes/_authenticated/_shell/business/comic-detail/use-workflow-record-users";
import type { ComicDetailModalProps } from "@/routes/_authenticated/_shell/business/comic-detail/comic-detail-type";

export function ComicDetailModal({
  comicInfo,
  pinnedChapter,
  pinnedChapterAssignments,
  initialChapterId,
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
  onNavigateToTranslator,
  currentUserId,
  onAddPages,
  onDeleteChapterPages,
  onAllocPageUpload,
  onJoinChapterRole,
  onExportChapter,
  onImportChapter,
  onArchiveComic,
  onDeleteComic,
  onUpdateComic,
  onUpdateChapter,
  activeMember,
  onClose,
}: ComicDetailModalProps): ReactElement {
  const { showToast } = useToastStore();
  const [artworkChapter, setArtworkChapter] = useState<ChapterInfo | null>(null);
  const accessToken = useAppStore((s) => s.accessToken);
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
    currentUserId,
    isSelectedChapterAvailable,
    onLoadPages,
    onLoadChapters,
    onAddPages,
    onDeleteChapterPages,
    onAllocPageUpload,
    reloadLoadedChapters,
    showToast,
  });
  const { pages, reloadCurrentPages, handleDeleteAllChapterPages } = pageState;

  const exportState = useComicDetailExport({
    accessToken,
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
    onRemoveAssignment: onRemoveAssignment ? handleRemoveAssignment : undefined,
    onAddAssignment: onAddAssignment ? handleOpenMemberSelector : undefined,
    onJoinRole: onJoinChapterRole ? handleJoinRole : undefined,
    canJoinRole: onJoinChapterRole ? canJoinRole : undefined,
    isRoleJoining: (role: Role) => joiningRoles[role] === true,
    onLeaveRole: onRemoveAssignment ? handleLeaveRole : undefined,
    canLeaveRole: onRemoveAssignment ? canLeaveRole : undefined,
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
          onNavigateToTranslator,
          onAddPages,
          onDeleteChapterPages,
          onAllocPageUpload,
          onExportChapter,
        }}
        activeView={activeView}
        onChangeView={setActiveView}
        workflowPanel={workflowPanel}
        isArchivingComic={isArchivingComic}
        isDeletingComic={isDeletingComic}
        coverInputRef={coverInputRef}
        onOpenArtwork={setArtworkChapter}
        onOpenComicModifier={() => {
          setShowComicModifier(true);
        }}
        onOpenChapterModifier={setChapterToModify}
        onConfirmAction={setPendingConfirmAction}
        showToast={showToast}
      />
      <ComicDetailModalDialogs
        comicInfo={comicInfo}
        artworkChapter={artworkChapter}
        closeArtwork={() => {
          setArtworkChapter(null);
        }}
        onArtworkUploaded={() => {
          void reloadLoadedChapters();
          handleWorkflowRecordsChanged();
        }}
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
