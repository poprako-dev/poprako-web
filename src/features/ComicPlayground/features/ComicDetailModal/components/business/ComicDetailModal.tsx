import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { canApplyWorkflowTransition, type ChapterInfo } from "@/types/chapter";
import type { MemberInfo } from "@/types/member";
import type { Result } from "@/types/utils/result";
import type { Role } from "@/types/role";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { useAppStore } from "@/store/app";
import PageList from "@/features/PageList/components/business/PageList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ComicDetailModalLayout from "../../layout/ComicDetailModalLayout";
import AssignmentGroup from "./AssignmentGroup";
import AssignmentFooter from "./AssignmentFooter";
import ComicDetailHeader from "./ComicDetailHeader";
import ComicDetailSidebar from "./ComicDetailSidebar";
import ComicModifierModal from "./ComicModifierModal";
import ChapterModifierModal from "./ChapterModifierModal";
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
  pinnedChapterAssignments,
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
  onExportChapter,
  onExportChapterLp,
  onImportChapter,
  onArchiveComic,
  onDeleteComic,
  onUpdateComic,
  onUpdateChapter,
  onResolveActiveMember,
  onClose,
}: ComicDetailModalProps) {
  const { showToast } = useToastStore();
  const accessToken = useAppStore((s) => s.accessToken);
  const [activeMember, setActiveMember] = useState<MemberInfo | null>(null);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<
    "delete-pages" | "archive-comic" | "delete-comic" | "export-data" | null
  >(null);
  const [isArchivingComic, setIsArchivingComic] = useState(false);
  const [isDeletingComic, setIsDeletingComic] = useState(false);
  const [showComicModifier, setShowComicModifier] = useState(false);
  const [chapterToModify, setChapterToModify] = useState<ChapterInfo | null>(null);
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
    assignments,
    isAssignmentsLoading,
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
    pinnedChapterAssignments,
    onLoadAssignments,
    onAddAssignment,
    onRemoveAssignment,
    onJoinChapterRole,
    showToast,
  });

  const {
    pages,
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
    onReservePageUpload,
    reloadLoadedChapters,
    showToast,
  });

  const {
    isImportingData,
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
    selectedChapterId,
    selectedChapter,
    pages,
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

  const handleArchiveCurrentComic = async () => {
    if (!onArchiveComic) return;

    setIsArchivingComic(true);
    const res = await onArchiveComic(comicInfo.id);
    setIsArchivingComic(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 归档漫画失败:", res);
      showToast(res.error, "error");
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
        onUpdateComic && isTeamAdmin ? () => setShowComicModifier(true) : undefined
      }
      onLongPressChapter={
        onUpdateChapter && canManageChapterAssignments
          ? (ch) => setChapterToModify(ch)
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
      canReadOnly={canReadOnly}
      canUploadCover={canUploadCover}
      canTranslateOrProofread={canTranslateOrProofread}
      canDeleteChapterPages={canDeleteChapterPages}
      canArchiveComic={isTeamAdmin && !!onArchiveComic}
      isTeamAdmin={isTeamAdmin && !!onDeleteComic}
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
        onExportChapter && onExportChapterLp
          ? () => setPendingConfirmAction("export-data")
          : undefined
      }
      onImportFileChange={
        onImportChapter ? handleImportFileChange : undefined
      }
      onDeletePages={() => setPendingConfirmAction("delete-pages")}
      onArchiveComic={() => setPendingConfirmAction("archive-comic")}
      onDeleteComic={() => setPendingConfirmAction("delete-comic")}
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
    isRoleJoining: (role: Role) => !!joiningRoles[role],
    onLeaveRole: onRemoveAssignment ? handleLeaveRole : undefined,
    canLeaveRole: onRemoveAssignment ? canLeaveRole : undefined,
    isRoleLeaving: (role: Role) => !!leavingRoles[role],
    canOperateWorkflow: canManageChapterAssignments,
    canManageAssignments: canManageChapterAssignments,
  };

  const footer = <AssignmentFooter {...sharedAssignmentProps} />;

  const assignmentGroup = (
    <AssignmentGroup
      {...sharedAssignmentProps}
      isAssignmentsLoading={isAssignmentsLoading}
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
        assignmentGroup={assignmentGroup}
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
          description={
            `即将删除当前章节下的 ${pages.length} 页，` +
            "删除后才能重新上传页面，此操作不可撤销。"
          }
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
          description={
            `即将删除《${comicInfo.title}》，` +
            "其章节与页面数据也会一并删除，此操作不可撤销。"
          }
          confirmLabel="删除"
          onConfirm={() => {
            setPendingConfirmAction(null);
            void handleDeleteCurrentComic();
          }}
          onCancel={() => setPendingConfirmAction(null)}
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
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}
      {pendingConfirmAction === "export-data" && (
        <ConfirmDialog
          title="下载数据"
          description="请选择导出方式"
          hideFooter
          onCancel={() => setPendingConfirmAction(null)}
        >
          <div className="flex items-center gap-2 px-5 pb-5 pt-1">
            <button
              onClick={() => {
                setPendingConfirmAction(null);
                void handleExportData({ includeImages: false });
              }}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "transition-all duration-200 active:scale-[0.98]",
                "text-slate-500 bg-slate-50 hover:bg-slate-100",
                "border border-slate-100",
              )}
            >
              仅翻校数据
            </button>
            <button
              onClick={() => {
                setPendingConfirmAction(null);
                void handleExportData({ includeImages: true });
              }}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "flex items-center justify-center gap-1",
                "transition-all duration-200 active:scale-[0.98]",
                "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100",
              )}
            >
              包含图源
            </button>
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
          onClose={() => setShowComicModifier(false)}
        />
      )}
      {chapterToModify && onUpdateChapter && (
        <ChapterModifierModal
          chapter={chapterToModify}
          onUpdate={async (args) => {
            const res = await onUpdateChapter(chapterToModify.id, args.subtitle);
            if (res.success) {
              handleUpdateChapterLocal(chapterToModify.id, args.subtitle);
            }
            return res;
          }}
          onClose={() => setChapterToModify(null)}
        />
      )}
    </>
  );
}
