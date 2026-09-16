import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FileArchive, Image as ImageIcon, Images } from "lucide-react";
import { Switch } from "radix-ui";
import { canApplyWorkflowTransition, type ChapterInfo } from "@/types/chapter";
import type { Result } from "@/types/utils/result";
import type { Role } from "@/types/role";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { showLocalApiFailure } from "@/api/util";
import { useAppStore } from "@/store/app";
import PageList from "@/features/PageList/components/business/PageList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingCircle from "@/components/ui/LoadingCircle";
import ComicDetailModalLayout from "../../layout/ComicDetailModalLayout";
import AssignmentGroup from "./AssignmentGroup";
import ArtworkUploadDialog from "./ArtworkUploadDialog";
import { canUploadArtwork } from "../../artworkUpload";
import ComicDetailContent, { type ComicDetailView } from "./ComicDetailContent";
import ComicDetailHeader from "./ComicDetailHeader";
import ComicDetailSidebar from "./ComicDetailSidebar";
import ComicModifierModal from "./ComicModifierModal";
import ChapterModifierModal from "./ChapterModifierModal";
import ExportProgressDialog from "./ExportProgressDialog";
import ImportTranslationDialog from "./ImportDialog";
import MemberSelectorModal from "./MemberSelectorModal";
import WorkflowPanel from "./WorkflowPanel";
import WorkflowRecordList from "./WorkflowRecordList";
import { useComicDetailAssignments } from "../../hook/useComicDetailAssignments";
import { useComicDetailChapters } from "../../hook/useComicDetailChapters";
import { useComicDetailExport } from "../../hook/useComicDetailExport";
import { useComicDetailPages } from "../../hook/useComicDetailPages";
import {
  useComicDetailWorkflowRecords,
} from "../../hook/useComicDetailWorkflowRecords";
import { useWorkflowRecordUsers } from "../../hook/useWorkflowRecordUsers";
import { ROLE_TITLE_LABEL, type ComicDetailModalProps } from "../../types";
import { applyWorkflowTransition } from "../../utils";

export default function ComicDetailModal({
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
}: ComicDetailModalProps) {
  const { showToast } = useToastStore();
  const [artworkChapter, setArtworkChapter] = useState<ChapterInfo | null>(null);
  const accessToken = useAppStore((s) => s.accessToken);
  const [activeView, setActiveView] = useState<ComicDetailView>("pages");
  const [pendingConfirmAction, setPendingConfirmAction] = useState<
    "delete-pages" | "archive-comic" | "delete-comic" | "export-data" | null
  >(null);
  const [useRawImageNames, setUseRawImageNames] = useState(false);
  const [isArchivingComic, setIsArchivingComic] = useState(false);
  const [isDeletingComic, setIsDeletingComic] = useState(false);
  const [showComicModifier, setShowComicModifier] = useState(false);
  const [chapterToModify, setChapterToModify] = useState<ChapterInfo | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  // Preload translator chunk so navigation to the translator page feels instant.
  useEffect(() => {
    void import("@/pages/TranslatorPage");
  }, []);

  const {
    chapters,
    setChapters,
    selectedChapter,
    selectedChapterId,
    setSelectedChapterId,
    chaptersHasMore,
    isChaptersLoading,
    isSelectedChapterAvailable,
    handleLoadMoreChapters,
    reloadLoadedChapters,
    handleCreateChapter,
    handleDeleteChapter,
  } = useComicDetailChapters({
    comicId: comicInfo.id,
    pinnedChapter,
    initialChapterId,
    onLoadChapters,
    showToast,
  });

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
    if (activeView === "workflow") {void refreshWorkflowRecords();}
  }, [activeView, refreshWorkflowRecords]);

  const {
    assignments,
    currentAssignment,
    isAssignmentsLoading,
    memberSelectorRole,
    setMemberSelectorRole,
    isMemberSelectorLoading,
    setIsMemberSelectorLoading,
    isAddingAssignment,
    joiningRoles,
    leavingRoles,
    canTranslateOrProofread,
    canReadOnly,
    canManageChapterAssignments,
    canUploadRawPages,
    isTeamAdmin,
    canCreateChapter,
    handleRemoveAssignment,
    handleOpenMemberSelector,
    handleAddAssignment,
    canJoinRole,
    canLeaveRole,
    handleJoinRole,
    handleLeaveRole,
  } = useComicDetailAssignments({
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

  const getWorkflowRecordUserLabel = useWorkflowRecordUsers({
    records: workflowRecordState.records,
    assignments,
    onResolveUser: onResolveWorkflowRecordUser,
  });

  const {
    pages,
    isPagesLoading,
    uploadProgressByPageId,
    uploadStatusByPageId,
    uploadErrorByPageId,
    reuploadingPageIds,
    isDeletingChapterPages,
    reloadCurrentPages,
    handleAddRawPages,
    handleDeleteAllChapterPages,
    handleReuploadPage,
  } = useComicDetailPages({
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

  const {
    isImportingData,
    pendingImport,
    confirmImport,
    cancelImport,
    isExportingData,
    exportProgress,
    canUploadCover,
    handleExportData,
    handleImportFileChange,
    coverUpload,
    cancelExport,
  } = useComicDetailExport({
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
    reloadLoadedChapters,
    onWorkflowRecordsChanged: handleWorkflowRecordsChanged,
    showToast,
  });

  const canDeleteChapterPages =
    canUploadRawPages &&
    pages.length > 0 &&
    Boolean(selectedChapterId) &&
    Boolean(onDeleteChapterPages);
  const canUploadNewRawPages =
    canUploadRawPages &&
    Boolean(selectedChapterId) &&
    Boolean(onAddPages);
  const canReuploadRawPages = canUploadRawPages && Boolean(onAllocPageUpload);
  const canClickPage = canTranslateOrProofread || canReadOnly;

  const handleTransition = async (
    transition: WorkflowTransition,
  ): Promise<Result<void>> => {
    if (!selectedChapterId || !selectedChapter) {
      return { success: false, error: "未选择章节" };
    }
    if (!canApplyWorkflowTransition(selectedChapter, transition)) {
      return {
        success: false,
        error: "当前章节状态已更新，不能重复推进该流程",
      };
    }

    const res = await onTransiteWorkflow(selectedChapterId, transition);
    if (!res.success) {
      console.error("[ComicDetailModal] 推进流程失败:", res); // eslint-disable-line no-console
      showLocalApiFailure(res, showToast, "操作失败");
      return res;
    }

    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === selectedChapterId
          ? applyWorkflowTransition(chapter, transition)
          : chapter,
      ),
    );
    handleWorkflowRecordsChanged();

    return res;
  };

  const handleDeleteCurrentComic = async () => {
    if (!onDeleteComic) {return;}

    setIsDeletingComic(true);
    const res = await onDeleteComic(comicInfo.id);
    setIsDeletingComic(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 删除漫画失败:", res); // eslint-disable-line no-console
      showLocalApiFailure(res, showToast);
      return;
    }

    showToast("漫画删除成功", "success");
  };

  const handleArchiveCurrentComic = async () => {
    if (!onArchiveComic) {return;}

    setIsArchivingComic(true);
    const res = await onArchiveComic(comicInfo.id);
    setIsArchivingComic(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 归档漫画失败:", res); // eslint-disable-line no-console
      showLocalApiFailure(res, showToast);
      return;
    }

    showToast("漫画归档成功", "success");
  };

  const handleUpdateChapterLocal = useCallback(
    (chapterId: string, subtitle?: string) => {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === chapterId ? { ...ch, subtitle: subtitle ?? "" } : ch,
        ),
      );
    },
    [setChapters],
  );

  const header = (
    <ComicDetailHeader
      comicInfo={comicInfo}
      chapters={chapters}
      selectedChapter={selectedChapter}
      selectedChapterId={selectedChapterId}
      hasMore={chaptersHasMore}
      isLoading={isChaptersLoading}
      canCreateChapter={canCreateChapter}
      onLoadMore={handleLoadMoreChapters}
      onSelect={setSelectedChapterId}
      onCreateChapter={onCreateChapter}
      onCreate={(subtitle, presetAssignmentRoles) =>
        handleCreateChapter(
          subtitle,
          presetAssignmentRoles,
          onCreateChapter,
        )
      }
      onDeleteChapter={onDeleteChapter}
      onDelete={(chapterId) => handleDeleteChapter(chapterId, onDeleteChapter)}
      onLongPressTitle={
        onUpdateComic && isTeamAdmin ? () => { setShowComicModifier(true); } : undefined
      }
      onLongPressChapter={
        onUpdateChapter && canManageChapterAssignments
          ? (ch) => { setChapterToModify(ch); }
          : undefined
      }
      onClose={onClose}
    />
  );

  const sidebar = (
    <ComicDetailSidebar
      comicInfo={comicInfo}
      selectedChapter={selectedChapter}
      pagesLength={pages.length}
      canUploadArtwork={canUploadArtwork(selectedChapter, currentAssignment)}
      onUploadArtwork={() => { if (selectedChapter) {setArtworkChapter(selectedChapter);} }}
      canReadOnly={canReadOnly}
      canUploadCover={canUploadCover}
      canTranslateOrProofread={canTranslateOrProofread}
      canDeleteChapterPages={canDeleteChapterPages}
      canArchiveComic={isTeamAdmin && Boolean(onArchiveComic)}
      isTeamAdmin={isTeamAdmin && Boolean(onDeleteComic)}
      isDeletingChapterPages={isDeletingChapterPages}
      isArchivingComic={isArchivingComic}
      isDeletingComic={isDeletingComic}
      isExportingData={isExportingData}
      isImportingData={isImportingData}
      onNavigateReadOnly={
        canReadOnly && selectedChapterId && onNavigateToTranslator
          ? () => {
              const firstPageId = pages[0]?.id;
              if (!firstPageId) {
                showToast("当前章节暂无页面", "error");
                return;
              }
              onNavigateToTranslator(selectedChapterId, firstPageId, true);
            }
          : undefined
      }
      onExport={
        onExportChapter ? () => { setPendingConfirmAction("export-data"); } : undefined
      }
      onImportFileChange={handleImportFileChange}
      onDeletePages={() => { setPendingConfirmAction("delete-pages"); }}
      onArchiveComic={() => { setPendingConfirmAction("archive-comic"); }}
      onDeleteComic={() => { setPendingConfirmAction("delete-comic"); }}
      coverInputRef={coverInputRef}
      coverUpload={coverUpload}
    />
  );

  const pageGrid = isPagesLoading ? (
    <div className="flex h-full items-center justify-center">
      <LoadingCircle size={22} aria-label="正在加载页面" />
    </div>
  ) : (
    <PageList
      pages={pages}
      enableClick={canClickPage}
      onClickPage={
        canClickPage
          ? (pageId) => {
              if (!selectedChapterId || !onNavigateToTranslator) {return;}
              const isReadOnly = !canTranslateOrProofread;
              onNavigateToTranslator(selectedChapterId, pageId, isReadOnly || undefined);
            }
          : undefined
      }
      onAddPages={canUploadNewRawPages ? handleAddRawPages : undefined}
      canReuploadPage={canReuploadRawPages ? () => true : undefined}
      isPageReuploading={(pageId) => reuploadingPageIds[pageId] === true}
      onReuploadPage={
        canReuploadRawPages
          ? (pageId, file) => { void handleReuploadPage(pageId, file); }
          : undefined
      }
      reuploadAccept="image/*"
      accept="image/*"
      uploadProgressByPageId={uploadProgressByPageId}
      uploadStatusByPageId={uploadStatusByPageId}
      uploadErrorByPageId={uploadErrorByPageId}
    />
  );

  const sharedAssignmentProps = {
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

  const assignmentGroup = (
    <AssignmentGroup
      {...sharedAssignmentProps}
      isAssignmentsLoading={isAssignmentsLoading}
    />
  );

  const recordList = (
    <WorkflowRecordList
      chapterId={selectedChapterId}
      state={workflowRecordState}
      getUserLabel={getWorkflowRecordUserLabel}
      onLoadMore={() => void loadMoreWorkflowRecords()}
    />
  );

  const workflowPanel = (
    <WorkflowPanel
      assignmentPanel={assignmentGroup}
      recordList={recordList}
    />
  );

  const content = (
    <ComicDetailContent
      activeView={activeView}
      chapterId={selectedChapterId}
      pageList={pageGrid}
      workflowPanel={workflowPanel}
      onChangeView={setActiveView}
    />
  );

  return (
    <>
      {artworkChapter && (
        <ArtworkUploadDialog
          chapterId={artworkChapter.id}
          chapterLabel={`第 ${String(artworkChapter.index + 1)} 话 · ${artworkChapter.subtitle}`}
          onClose={() => { setArtworkChapter(null); }}
          onUploaded={() => {
            void reloadLoadedChapters();
            handleWorkflowRecordsChanged();
          }}
        />
      )}
      <ExportProgressDialog
        open={isExportingData}
        title={exportProgress.title}
        description={exportProgress.description}
        progress={exportProgress.progress}
        onCancel={cancelExport}
      />
      {pendingImport && (
        <ImportTranslationDialog
          fileName={pendingImport.file.name}
          loading={isImportingData}
          onConfirm={(mode) => { void confirmImport(mode); }}
          onCancel={cancelImport}
        />
      )}
      <ComicDetailModalLayout
        header={header}
        sidebar={sidebar}
        content={content}
      />
      {memberSelectorRole && (
        <MemberSelectorModal
          title={`添加「${ROLE_TITLE_LABEL[memberSelectorRole]}」成员`}
          chapterId={selectedChapterId}
          role={memberSelectorRole}
          onLoadMembers={onLoadAssignableMembers}
          setIsLoading={setIsMemberSelectorLoading}
          isSubmitting={isMemberSelectorLoading || isAddingAssignment}
          onSelectUser={(userId) => { void handleAddAssignment(userId); }}
          onClose={() => { setMemberSelectorRole(null); }}
        />
      )}
      {pendingConfirmAction === "delete-pages" && (
        <ConfirmDialog
          title="确认清空页面"
          description={
            `即将删除当前章节下的 ${String(pages.length)} 页，` +
            "删除后才能重新上传页面，此操作不可撤销。"
          }
          confirmLabel="清空"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteAllChapterPages();
          }}
          onCancel={() => { setPendingConfirmAction(null); }}
        />
      )}
      {pendingConfirmAction === "delete-comic" && (
        <ConfirmDialog
          title="确认删除漫画"
          description={
            `即将删除《${comicInfo.title}》，` +
            "其章节与页面数据也会一并删除，此操作不可撤销。"
          }
          confirmLabel="删除"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteCurrentComic();
          }}
          onCancel={() => { setPendingConfirmAction(null); }}
        />
      )}
      {pendingConfirmAction === "archive-comic" && (
        <ConfirmDialog
          title="确认归档漫画"
          description={
            `即将归档漫画《${comicInfo.title}》及其全部章节，` +
            "归档后将从当前漫画列表移除。"
          }
          confirmLabel="归档"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleArchiveCurrentComic();
          }}
          onCancel={() => { setPendingConfirmAction(null); }}
        />
      )}
      {pendingConfirmAction === "export-data" && (
        <ConfirmDialog
          title="下载数据"
          hideFooter
          onCancel={() => { setPendingConfirmAction(null); }}
        >
          <div className="px-5 pb-5 pt-1">
            <div
              className={clsx(
                "mb-3 flex h-8 items-center gap-2 rounded-lg px-2",
                "text-xs font-medium text-slate-500 hover:bg-slate-50",
              )}
            >
              <ImageIcon size={14} className="text-slate-400" />
              <label
                htmlFor="export-raw-image-names"
                className="flex-1 cursor-pointer"
              >
                使用原始图片名
              </label>
              <Switch.Root
                id="export-raw-image-names"
                checked={useRawImageNames}
                onCheckedChange={setUseRawImageNames}
                className={clsx(
                  "relative h-4.5 w-8 rounded-full bg-slate-200 transition-colors",
                  "data-[state=checked]:bg-(--primary)",
                )}
              >
                <Switch.Thumb
                  className={clsx(
                    "block size-3.5 translate-x-0.5 rounded-full bg-white shadow-sm",
                    "transition-transform data-[state=checked]:translate-x-4",
                  )}
                />
              </Switch.Root>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingConfirmAction(null);
                  void handleExportData({
                    includeImages: false,
                    withRawIdent: useRawImageNames,
                  });
                }}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-1 py-2",
                  "rounded-lg text-xs font-semibold",
                  "transition-all duration-200 active:scale-[0.98]",
                  "border border-slate-100 bg-slate-50 text-slate-500",
                  "hover:bg-slate-100",
                )}
              >
                <FileArchive size={14} />
                仅翻校数据
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingConfirmAction(null);
                  void handleExportData({
                    includeImages: true,
                    withRawIdent: useRawImageNames,
                  });
                }}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-1 py-2",
                  "rounded-lg text-xs font-semibold",
                  "transition-all duration-200 active:scale-[0.98]",
                  "border border-green-200 bg-green-50 text-green-600",
                  "hover:bg-green-100",
                )}
              >
                <Images size={14} />
                包含图源
              </button>
            </div>
          </div>
        </ConfirmDialog>
      )}
      {showComicModifier && onUpdateComic && (
        <ComicModifierModal
          comicInfo={comicInfo}
          onUpdate={async (args) => {
            const res = await onUpdateComic(args);
            return res;
          }}
          onClose={() => { setShowComicModifier(false); }}
        />
      )}
      {chapterToModify && onUpdateChapter && (
        <ChapterModifierModal
          chapter={chapterToModify}
          onUpdate={async (args) => {
            const res = await onUpdateChapter(chapterToModify.id, args.subtitle);
            if (res.success) {
              handleUpdateChapterLocal(chapterToModify.id, args.subtitle);
              handleWorkflowRecordsChanged();
            }
            return res;
          }}
          onClose={() => { setChapterToModify(null); }}
        />
      )}
    </>
  );
}
