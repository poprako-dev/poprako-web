import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { canApplyWorkflowTransition } from "@/types/chapter";
import type { MemberInfo } from "@/types/member";
import type { Result } from "@/types/utils/result";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { useAppStore } from "@/store/app";
import PageList from "@/features/PageList/components/business/PageList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ComicDetailModalLayout from "../../layout/ComicDetailModalLayout";
import AssignmentFooter from "./AssignmentFooter";
import ComicDetailHeader from "./ComicDetailHeader";
import ComicDetailSidebar from "./ComicDetailSidebar";
import ExportProgressDialog from "./ExportProgressDialog";
import MemberSelectorModal from "./MemberSelectorModal";
import { useComicDetailAssignments } from "../../hook/useComicDetailAssignments";
import { useComicDetailChapters } from "../../hook/useComicDetailChapters";
import { useComicDetailExport } from "../../hook/useComicDetailExport";
import { useComicDetailPages } from "../../hook/useComicDetailPages";
import { ROLE_TITLE_LABEL, type ComicDetailModalProps } from "../../types";
import { applyWorkflowTransition } from "../../utils";

export default function ComicDetailModal({
  comicInfo,
  pinnedChapter,
  initialChapterId,
  onLoadChapters,
  onLoadAssignments,
  onLoadPages,
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
  onReservePageUpload,
  onJoinChapterRole,
  onImportChapter,
  onExportChapter,
  onExportChapterLp,
  onDeleteComic,
  onResolveActiveMember,
  onClose,
}: ComicDetailModalProps) {
  const { showToast } = useToastStore();
  const accessToken = useAppStore((s) => s.accessToken);
  const [activeMember, setActiveMember] = useState<MemberInfo | null>(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<
    "delete-pages" | "delete-comic" | null
  >(null);
  const [isDeletingComic, setIsDeletingComic] = useState(false);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const resolveActiveMemberRef = useRef(onResolveActiveMember);
  useLayoutEffect(() => {
    resolveActiveMemberRef.current = onResolveActiveMember;
  });

  useEffect(() => {
    let cancelled = false;

    const loadActiveMember = async () => {
      try {
        const resolvedMember = await resolveActiveMemberRef.current();
        if (!cancelled) {
          setActiveMember(resolvedMember ?? null);
        }
      } catch (err) {
        console.error("[ComicDetailModal] 解析团队成员信息异常:", err);
        if (!cancelled) {
          setActiveMember(null);
        }
      }
    };

    void loadActiveMember();

    return () => {
      cancelled = true;
    };
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
    assignments,
    memberSelectorRole,
    setMemberSelectorRole,
    isMemberSelectorLoading,
    setIsMemberSelectorLoading,
    isAddingAssignment,
    joiningRoles,
    leavingRoles,
    assignedUserIdsForSelectedRole,
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
    onLoadAssignments,
    onAddAssignment,
    onRemoveAssignment,
    onJoinChapterRole,
    showToast,
  });

  const {
    pages,
    uploadProgressByPageId,
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
    onReservePageUpload,
    reloadLoadedChapters,
    showToast,
  });

  const {
    isImportingData,
    isExportingData,
    exportProgress,
    canUploadCover,
    handleImportFileChange,
    handleExportData,
    coverUpload,
    cancelExport,
  } = useComicDetailExport({
    accessToken,
    comicId: comicInfo.id,
    comicTitle: comicInfo.title,
    comicAuthor: comicInfo.author,
    comicIndex: comicInfo.index,
    comicCoverUrl: comicInfo.coverUrl,
    selectedChapterId,
    selectedChapter,
    assignments,
    activeMember,
    canUploadRawPages,
    onExportChapter,
    onExportChapterLp,
    onImportChapter,
    reloadCurrentPages,
    reloadLoadedChapters,
    showToast,
  });

  const canDeleteChapterPages =
    canUploadRawPages &&
    pages.length > 0 &&
    !!selectedChapterId &&
    !!onDeleteChapterPages;
  const canUploadNewRawPages =
    canUploadRawPages &&
    pages.length === 0 &&
    !!selectedChapterId &&
    !!onAddPages;
  const canReuploadRawPages = canUploadRawPages && !!onReservePageUpload;
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
      console.error("[ComicDetailModal] 推进流程失败:", res);
      showToast("操作失败", "error");
      return res;
    }

    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === selectedChapterId
          ? applyWorkflowTransition(chapter, transition)
          : chapter,
      ),
    );

    return res;
  };

  const handleDeleteCurrentComic = async () => {
    if (!onDeleteComic) return;

    setIsDeletingComic(true);
    const res = await onDeleteComic(comicInfo.id);
    setIsDeletingComic(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 删除漫画失败:", res);
      showToast(res.error, "error");
      return;
    }

    showToast("漫画删除成功", "success");
  };

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
      onCreate={(subtitle) => handleCreateChapter(subtitle, onCreateChapter)}
      onDeleteChapter={onDeleteChapter}
      onDelete={(chapterId) => handleDeleteChapter(chapterId, onDeleteChapter)}
      onClose={onClose}
    />
  );

  const sidebar = (
    <ComicDetailSidebar
      comicInfo={comicInfo}
      selectedChapter={selectedChapter}
      pagesLength={pages.length}
      canReadOnly={canReadOnly}
      canUploadCover={canUploadCover}
      canDeleteChapterPages={canDeleteChapterPages}
      canUploadRawPages={canUploadRawPages}
      isTeamAdmin={isTeamAdmin && !!onDeleteComic}
      isDeletingChapterPages={isDeletingChapterPages}
      isDeletingComic={isDeletingComic}
      isImportingData={isImportingData}
      isExportingData={isExportingData}
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
      onOpenImportPicker={
        selectedChapterId && onImportChapter && !isImportingData
          ? () => importFileInputRef.current?.click()
          : undefined
      }
      onExport={
        onExportChapter && onExportChapterLp ? () => void handleExportData() : undefined
      }
      onDeletePages={() => setPendingConfirmAction("delete-pages")}
      onDeleteComic={() => setPendingConfirmAction("delete-comic")}
      importFileInputRef={importFileInputRef}
      onImportFileChange={handleImportFileChange}
      coverInputRef={coverInputRef}
      coverUpload={coverUpload}
    />
  );

  const pageGrid = (
    <PageList
      pages={pages}
      enableClick={canClickPage}
      onClickPage={
        canClickPage
          ? (pageId) => {
              if (!selectedChapterId || !onNavigateToTranslator) return;
              const readOnly = !canTranslateOrProofread;
              onNavigateToTranslator(selectedChapterId, pageId, readOnly || undefined);
            }
          : undefined
      }
      onAddPages={canUploadNewRawPages ? handleAddRawPages : undefined}
      canReuploadPage={canReuploadRawPages ? () => true : undefined}
      isPageReuploading={(pageId) => !!reuploadingPageIds[pageId]}
      onReuploadPage={canReuploadRawPages ? handleReuploadPage : undefined}
      reuploadAccept="image/*"
      accept="image/*"
      emptyHintText=""
      uploadButtonText="点击此处以上传图片"
      uploadProgressByPageId={uploadProgressByPageId}
    />
  );

  const footer = (
    <AssignmentFooter
      selectedChapter={selectedChapter}
      assignments={assignments}
      currentUserId={currentUserId}
      onTransiteWorkflow={handleTransition}
      onRemoveAssignment={onRemoveAssignment ? handleRemoveAssignment : undefined}
      onAddAssignment={onAddAssignment ? handleOpenMemberSelector : undefined}
      onJoinRole={onJoinChapterRole ? handleJoinRole : undefined}
      canJoinRole={onJoinChapterRole ? canJoinRole : undefined}
      isRoleJoining={(role) => !!joiningRoles[role]}
      onLeaveRole={onRemoveAssignment ? handleLeaveRole : undefined}
      canLeaveRole={onRemoveAssignment ? canLeaveRole : undefined}
      isRoleLeaving={(role) => !!leavingRoles[role]}
      canOperateWorkflow={canManageChapterAssignments}
      canManageAssignments={canManageChapterAssignments}
    />
  );

  return (
    <>
      <ExportProgressDialog
        open={isExportingData}
        title={exportProgress.title}
        description={exportProgress.description}
        progress={exportProgress.progress}
        onCancel={cancelExport}
      />
      <ComicDetailModalLayout
        header={header}
        sidebar={sidebar}
        pageGrid={pageGrid}
        footer={footer}
      />
      {memberSelectorRole && (
        <MemberSelectorModal
          title={`添加${ROLE_TITLE_LABEL[memberSelectorRole]}成员`}
          chapterId={selectedChapterId}
          role={memberSelectorRole}
          assignedUserIds={assignedUserIdsForSelectedRole}
          onLoadMembers={onLoadAssignableMembers}
          setIsLoading={setIsMemberSelectorLoading}
          isSubmitting={isMemberSelectorLoading || isAddingAssignment}
          onSelectUser={handleAddAssignment}
          onClose={() => setMemberSelectorRole(null)}
        />
      )}
      {pendingConfirmAction === "delete-pages" && (
        <ConfirmDialog
          title="确认清空页面"
          description={`即将删除当前章节下的 ${pages.length} 页，删除后才能重新上传页面，此操作不可撤销。`}
          confirmLabel="清空"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteAllChapterPages();
          }}
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}
      {pendingConfirmAction === "delete-comic" && (
        <ConfirmDialog
          title="确认删除漫画"
          description={`即将删除《${comicInfo.title}》，其章节与页面数据也会一并删除，此操作不可撤销。`}
          confirmLabel="删除"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteCurrentComic();
          }}
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}
    </>
  );
}
