import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  X,
  BookOpen,
  Hash,
  Languages,
  CheckSquare,
  CloudUpload,
  Image as ImageIcon,
  Download,
  Pencil,
} from "lucide-react";
import type {
  ListChapterArgs,
  WorkflowTransition,
} from "@/features/ComicPlayground/types/chapter";
import type { ChapterInfo, ComicInfo, PageInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import LazyImage from "./LazyImage";
import StatItem from "./StatItem";
import ActionButton from "./ActionButton";
import ChapterOption from "./ChapterOption";
import AssignmentFooter from "./AssignmentFooter";
import PageList from "@/features/PageList/components/business/PageList";
import ComicDetailModalLayout from "../../layout/ComicDetailModalLayout";
import MemberSelectorModal from "./MemberSelectorModal";
import type { MemberInfo } from "@/types/member";
import { hasRole, type Role } from "@/types/role";

type Props = {
  comicInfo: ComicInfo;
  pinnedChapter: ChapterInfo | null;
  onLoadChapters: (args: ListChapterArgs) => Promise<Result<ChapterInfo[]>>;
  onLoadAssignments: (chapterId: string) => Promise<Result<AssignmentInfo[]>>;
  onLoadPages: (chapterId: string) => Promise<Result<PageInfo[]>>;
  onTransiteWorkflow: (
    chapterId: string,
    transition: WorkflowTransition,
  ) => Promise<Result<void>>;
  onRemoveAssignment?: (
    chapterId: string,
    userId: string,
  ) => Promise<Result<void>>;
  onLoadAssignableMembers?: (chapterId: string) => Promise<Result<MemberInfo[]>>;
  onAddAssignment?: (
    chapterId: string,
    userId: string,
    role: Role,
  ) => Promise<Result<void>>;
  onCreateChapter?: (args: {
    comicId: string;
    subtitle?: string;
  }) => Promise<Result<string>>;
  onDeleteChapter?: (chapterId: string) => Promise<Result<void>>;
  onNavigateToTranslator?: (chapterId: string, pageId: string) => void;
  currentUserId?: string | null;
  canManageAssignments?: boolean;
  onAddPages?: (chapterId: string, files: File[]) => Promise<void>;
  onClose: () => void;
};

export default function ComicDetailModal({
  comicInfo,
  pinnedChapter,
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
  canManageAssignments = false,
  onAddPages,
  onClose,
}: Props) {
  const { showToast } = useToastStore();
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    pinnedChapter?.id ?? null,
  );
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [assignableMembers, setAssignableMembers] = useState<MemberInfo[]>([]);
  const [isMemberSelectorLoading, setIsMemberSelectorLoading] = useState(false);
  const [memberSelectorRole, setMemberSelectorRole] = useState<Role | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [chaptersHasMore, setChaptersHasMore] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);
  const CHAPTERS_LIMIT = 20;

  const selectedChapter =
    chapters.find((c) => c.id === selectedChapterId) ??
    pinnedChapter ??
    undefined;

  const currentAssignment = assignments.find((item) => item.userId === currentUserId);
  const canTranslateOrProofread =
    !!currentAssignment &&
    (hasRole(currentAssignment, "translator") ||
      hasRole(currentAssignment, "proofreader"));
  const canUploadRawPages =
    !!currentAssignment && hasRole(currentAssignment, "rawProvider");

  // Load initial chapters
  useEffect(() => {
    setIsChaptersLoading(true);
    onLoadChapters({ comicId: comicInfo.id, offset: 0, limit: CHAPTERS_LIMIT })
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载章节失败:", res);
          showToast("加载章节失败", "error");
          return;
        }
        setChapters(res.data);
        setChaptersHasMore(res.data.length === CHAPTERS_LIMIT);
        if (!selectedChapterId && res.data.length > 0) {
          setSelectedChapterId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载章节异常:", err);
        showToast("加载章节失败", "error");
      })
      .finally(() => setIsChaptersLoading(false));
  }, [comicInfo.id]);

  const handleLoadMoreChapters = () => {
    if (isChaptersLoading || !chaptersHasMore) return;
    setIsChaptersLoading(true);
    onLoadChapters({
      comicId: comicInfo.id,
      offset: chapters.length,
      limit: CHAPTERS_LIMIT,
    })
      .then((res) => {
        if (!res.success) {
          showToast("加载更多章节失败", "error");
          return;
        }
        setChapters((prev) => [...prev, ...res.data]);
        setChaptersHasMore(res.data.length === CHAPTERS_LIMIT);
      })
      .catch(() => showToast("加载更多章节失败", "error"))
      .finally(() => setIsChaptersLoading(false));
  };

  // Load assignments when chapter changes
  useEffect(() => {
    if (!selectedChapterId) return;
    setAssignments([]);
    onLoadAssignments(selectedChapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载分工失败:", res);
          showToast("加载分工失败", "error");
          return;
        }
        setAssignments(res.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载分工异常:", err);
        showToast("加载分工失败", "error");
      });
  }, [selectedChapterId]);

  // Load pages when chapter changes
  useEffect(() => {
    if (!selectedChapterId) return;
    setPages([]);
    onLoadPages(selectedChapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载页面失败:", res);
          showToast("加载页面失败", "error");
          return;
        }
        setPages(res.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载页面异常:", err);
        showToast("加载页面失败", "error");
      });
  }, [selectedChapterId]);

  const handleTransition = async (
    transition: WorkflowTransition,
  ): Promise<Result<void>> => {
    if (!selectedChapterId) return { success: false, error: "未选择章节" };
    const res = await onTransiteWorkflow(selectedChapterId, transition);
    if (!res.success) {
      console.error("[ComicDetailModal] 推进流程失败:", res);
      showToast("操作失败", "error");
    }
    return res;
  };

  const handleRemoveUser = (userId: string) => {
    if (!selectedChapterId || !onRemoveAssignment) return;
    onRemoveAssignment(selectedChapterId, userId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 移除成员失败:", res);
          showToast("移除成员失败", "error");
          return;
        }
        setAssignments((prev) => prev.filter((a) => a.userId !== userId));
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 移除成员异常:", err);
        showToast("移除成员失败", "error");
      });
  };

  const handleOpenMemberSelector = (role: Role) => {
    if (!selectedChapterId || !onLoadAssignableMembers) return;
    setMemberSelectorRole(role);
    setIsMemberSelectorLoading(true);
    onLoadAssignableMembers(selectedChapterId)
      .then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          return;
        }
        setAssignableMembers(result.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载可分配成员异常:", err);
        showToast("加载成员失败", "error");
      })
      .finally(() => setIsMemberSelectorLoading(false));
  };

  const handleAddAssignment = async (userId: string) => {
    if (!selectedChapterId || !memberSelectorRole || !onAddAssignment) return;
    setIsAddingAssignment(true);
    const result = await onAddAssignment(selectedChapterId, userId, memberSelectorRole);
    setIsAddingAssignment(false);

    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    const refreshedAssignments = await onLoadAssignments(selectedChapterId);
    if (refreshedAssignments.success) {
      setAssignments(refreshedAssignments.data);
    }
    setMemberSelectorRole(null);
  };

  const header = (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-black tracking-tight text-slate-800">
          {comicInfo.title}
        </h1>
        <ChapterOption
          comicInfo={comicInfo}
          chapters={chapters}
          selectedChapter={selectedChapter}
          hasMore={chaptersHasMore}
          isLoading={isChaptersLoading}
          onLoadMore={handleLoadMoreChapters}
          onSelect={setSelectedChapterId}
          onCreateChapter={
            onCreateChapter
              ? async (subtitle) => {
                  const res = await onCreateChapter({
                    comicId: comicInfo.id,
                    subtitle,
                  });
                  if (res.success) {
                    onLoadChapters({
                      comicId: comicInfo.id,
                      offset: 0,
                      limit: CHAPTERS_LIMIT,
                    }).then((r) => {
                      if (r.success) {
                        setChapters(r.data);
                        setSelectedChapterId(r.data[0]?.id ?? null);
                      }
                    });
                  }
                  return res;
                }
              : undefined
          }
          onDelete={
            onDeleteChapter
              ? async (id) => {
                  const res = await onDeleteChapter(id);
                  if (res.success) {
                    setChapters(chapters.filter((c) => c.id !== id));
                    if (selectedChapterId === id) setSelectedChapterId(null);
                  } else {
                    showToast("删除失败", "error");
                  }
                }
              : undefined
          }
        />
      </div>
      <button
        onClick={onClose}
        className="text-slate-300 hover:text-slate-600 transition-colors p-1"
      >
        <X size={18} />
      </button>
    </>
  );

  const sidebar = (
    <>
      {/* Cover */}
      <div
        className={clsx(
          "w-28 mx-auto aspect-3/4 bg-slate-50 rounded-sm border border-slate-100",
          "flex items-center justify-center text-slate-200 mb-4 mt-2",
          "overflow-hidden shrink-0",
          "hover:border-slate-300 transition-colors group",
        )}
      >
        {comicInfo.coverUrl ? (
          <LazyImage
            src={comicInfo.coverUrl}
            alt={comicInfo.title}
            className="w-full h-full"
          />
        ) : (
          <ImageIcon
            size={24}
            className="group-hover:scale-110 transition-transform duration-300"
          />
        )}
      </div>

      {/* Stats */}
      <div className="space-y-0 mb-2 shrink-0">
        <StatItem
          icon={BookOpen}
          label="总页数"
          value={selectedChapter?.pageCount ?? "-"}
        />
        <StatItem
          icon={Hash}
          label="总单元数"
          value={selectedChapter?.totalUnitCount ?? "-"}
        />
        <StatItem
          icon={Languages}
          label="已翻译"
          value={selectedChapter?.translatedUnitCount ?? "-"}
        />
        <StatItem
          icon={CheckSquare}
          label="已校对"
          value={selectedChapter?.proofreadUnitCount ?? "-"}
        />
      </div>

      {/* No-chapter hint */}
      {!selectedChapter && (
        <p className="text-[10px] text-slate-300 text-center leading-relaxed mb-2 shrink-0">
          请从上方选择或创建一个章节
        </p>
      )}

      {/* Actions */}
      {selectedChapter && (
        <div className="flex flex-col gap-1 shrink-0">
          {canTranslateOrProofread && (
            <ActionButton
              icon={Pencil}
              title="开始翻校"
              onClick={
                selectedChapterId && onNavigateToTranslator
                  ? () => {
                      const firstPageId = pages[0]?.id;
                      if (!firstPageId) {
                        showToast("当前章节暂无页面", "error");
                        return;
                      }
                      onNavigateToTranslator(selectedChapterId, firstPageId);
                    }
                  : undefined
              }
            />
          )}
          {canUploadRawPages && <ActionButton icon={CloudUpload} title="上传数据" />}
          <ActionButton icon={Download} title="下载图源" />
        </div>
      )}
    </>
  );

  const pageGrid = (
    <PageList
      pages={pages}
      enableClick={canTranslateOrProofread}
      onClickPage={
        canTranslateOrProofread
          ? (pageId) => {
              if (!selectedChapterId || !onNavigateToTranslator) return;
              onNavigateToTranslator(selectedChapterId, pageId);
            }
          : undefined
      }
      onAddPages={
        canUploadRawPages && selectedChapterId && onAddPages
          ? (files) => onAddPages(selectedChapterId, files)
          : undefined
      }
    />
  );

  const footer = (
    <AssignmentFooter
      selectedChapter={selectedChapter}
      assignments={assignments}
      onTransiteWorkflow={handleTransition}
      onRemoveAssignment={onRemoveAssignment ? handleRemoveUser : undefined}
      onAddAssignment={onAddAssignment ? handleOpenMemberSelector : undefined}
      canOperateWorkflow={canManageAssignments}
      canManageAssignments={canManageAssignments}
    />
  );

  return (
    <>
      <ComicDetailModalLayout
        header={header}
        sidebar={sidebar}
        pageGrid={pageGrid}
        footer={footer}
      />
      {memberSelectorRole && (
        <MemberSelectorModal
          title={`添加${memberSelectorRole}成员`}
          members={assignableMembers}
          assignedUserIds={assignments.map((assignment) => assignment.userId)}
          isSubmitting={isMemberSelectorLoading || isAddingAssignment}
          onSelectUser={handleAddAssignment}
          onClose={() => setMemberSelectorRole(null)}
        />
      )}
    </>
  );
}
