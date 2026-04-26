import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { UserStatsInfo } from "@/types/userStats";
import type { WorkspaceTab } from "../../types/types";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import WorkspaceHeaderNav from "./WorkspaceHeaderNav";
import WorkspaceStatsCards from "./WorkspaceStatsCards";
import EmbeddedComicList from "@/features/ComcList/components/business/EmbeddedComicList";
import ComicDetailModal from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailModal";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import {
  fetchMyStats,
  fetchMyComics,
  fetchLatestChapter,
  fetchComicAssignments,
} from "../../api/workspace";
import { listMembers } from "@/api/member";
import {
  listChapters,
  updateChapter,
  exportChapter,
  importChapter,
} from "@/features/ComicPlayground/api/chapter";
import {
  listPages,
  deletePage,
  reserveChapterPages,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import { api } from "@/api/util";
import { unwrapRawAssignmentInfo, type RawAssignmentInfo } from "@/types/raw/assignment";
import type { ListChapterArgs, WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { roleMask, type Role } from "@/types/role";
import clsx from "clsx";

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export default function Workspace() {
  const { activeTeamId: teamId } = useActiveTeam();
  const loginState = useAppStore((s) => s.loginState);
  const currentUserId = loginState?.userInfo.id ?? null;
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("workspace");
  const [stats, setStats] = useState<UserStatsInfo | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [selectedComic, setSelectedComic] = useState<ComicInfo | null>(null);
  const [selectedComicPinnedChapter, setSelectedComicPinnedChapter] =
    useState<ChapterInfo | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setIsStatsLoading(true);
      try {
        const result = await fetchMyStats();
        if (typeof result === "string") {
          console.error("Failed to load user stats:", result);
          showToast(result, "error");
        } else {
          setStats(result);
        }
      } catch (err) {
        console.error("Unexpected error loading user stats:", err);
        showToast("加载统计信息失败", "error");
      } finally {
        setIsStatsLoading(false);
      }
    };

    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userName = loginState?.userInfo.name ?? "用户";

  const handleOpenComicDetail = useCallback(
    (comicInfo: ComicInfo) => {
      setSelectedComic(comicInfo);
      setSelectedComicPinnedChapter(null);

      fetchLatestChapter(comicInfo).then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          return;
        }
        setSelectedComicPinnedChapter(result.data);
      });
    },
    [showToast],
  );

  const handleLoadDetailChapters = useCallback(
    async (args: ListChapterArgs): Promise<Result<ChapterInfo[]>> => {
      return listChapters(args);
    },
    [],
  );

  const handleLoadAssignmentsForChapter = useCallback(
    async (chapterId: string): Promise<Result<AssignmentInfo[]>> => {
      const result = await api.get<RawAssignmentInfo[]>("/assignments", {
        chapter_id: chapterId,
        includes: ["user"],
        offset: 0,
        limit: 100,
      });
      if (!result.success) return result;
      return {
        success: true,
        data: (result.data ?? []).map(unwrapRawAssignmentInfo),
      };
    },
    [],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId, offset: 0, limit: 200 });
  }, []);

  const handleRemoveAssignment = useCallback(
    async (chapterId: string, userId: string): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignmentsForChapter(chapterId);
      if (!assignmentResult.success) {
        return assignmentResult;
      }

      const target = assignmentResult.data.find(
        (assignment) => assignment.userId === userId,
      );
      if (!target) {
        return { success: false, error: "未找到对应分工记录" };
      }

      const result = await api.delete<void>(`/assignments/${target.id}`);
      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleLoadAssignableMembers = useCallback(
    async (_chapterId: string): Promise<Result<MemberInfo[]>> => {
      if (!teamId) {
        return { success: true, data: [] };
      }

      return listMembers({
        teamId,
        offset: 0,
        limit: 200,
        includes: ["user"],
      });
    },
    [teamId],
  );

  const handleAddAssignment = useCallback(
    async (
      chapterId: string,
      userId: string,
      role: Role,
    ): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignmentsForChapter(chapterId);
      if (!assignmentResult.success) {
        return assignmentResult;
      }

      const existing = assignmentResult.data.find(
        (assignment) => assignment.userId === userId,
      );
      const mergedRoles = existing
        ? Array.from(new Set([...assignmentRoles(existing), role]))
        : [role];

      const result = await api.post<
        { id: string },
        { chapter_id: string; user_id: string; roles: number }
      >("/assignments", {
        chapter_id: chapterId,
        user_id: userId,
        roles: roleMask(mergedRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleTransiteWorkflow = useCallback(
    async (
      chapterId: string,
      transition: WorkflowTransition,
    ): Promise<Result<void>> => {
      return updateChapter(chapterId, { workflowTransition: transition });
    },
    [],
  );

  const handleExportChapter = useCallback(async (chapterId: string) => {
    return exportChapter(chapterId);
  }, []);

  const handleImportChapter = useCallback(
    async (args: { chapterId: string; content: string; format: "json" | "lp" }) => {
      return importChapter(args);
    },
    [],
  );

  const handleAddPages = useCallback(
    async (chapterId: string, files: File[]) => {
      const reserveResult = await reserveChapterPages({
        chapterId,
        pageCount: files.length,
      });
      if (!reserveResult.success) {
        throw new Error(reserveResult.error);
      }

      const creations = reserveResult.data.creations;
      if (creations.length !== files.length) {
        throw new Error("预留页面数量与选择文件数量不一致");
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const creation = creations[i];

        const uploadResult = await uploadToPresignedUrl(creation.putUrl, file);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }

        const markResult = await updatePage(creation.pageId, { isUploaded: true });
        if (!markResult.success) {
          throw new Error(markResult.error);
        }
      }
    },
    [],
  );

  const handleDeletePage = useCallback(async (pageId: string): Promise<Result<void>> => {
    return deletePage(pageId);
  }, []);

  const handleNavigateToTranslator = useCallback(
    (chapterId: string, pageId: string) => {
      navigate(`/translator/${chapterId}/${pageId}`);
    },
    [navigate],
  );

  const workspaceBody = (
    <div
      className={clsx("flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden")}
    >
      <div
        className={clsx(
          "mb-3 flex flex-col",
          "sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        )}
      >
        <div>
          <p className={clsx("text-md text-slate-400")}>欢迎回来</p>
          <h1 className={clsx("mt-0.5 ml-1 text-3xl font-bold text-slate-700")}>
            {userName}
          </h1>
        </div>
        <WorkspaceStatsCards stats={stats} isLoading={isStatsLoading} />
      </div>

      <div className={clsx("flex-1 min-h-0 min-w-0 overflow-x-hidden")}>
        <EmbeddedComicList
          mode="translator"
          onLoadComics={fetchMyComics}
          onLoadLatestChapter={fetchLatestChapter}
          onLoadAssignments={fetchComicAssignments}
          onComicClick={handleOpenComicDetail}
        />
      </div>
    </div>
  );

  const symbolsBody = (
    <div
      className={clsx(
        "flex h-48 items-center justify-center text-sm text-slate-400",
      )}
    >
      特殊符号功能开发中
    </div>
  );

  return (
    <>
      <WorkspaceLayout
        header={
          <WorkspaceHeaderNav activeTab={activeTab} onTabChange={setActiveTab} />
        }
        body={activeTab === "workspace" ? workspaceBody : symbolsBody}
      />
      {selectedComic && (
        <ComicDetailModal
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignmentsForChapter}
          onLoadPages={handleLoadPages}
          onTransiteWorkflow={handleTransiteWorkflow}
          onNavigateToTranslator={handleNavigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={handleAddPages}
          onDeletePage={handleDeletePage}
          onImportChapter={handleImportChapter}
          onExportChapter={handleExportChapter}
          onClose={() => {
            setSelectedComic(null);
            setSelectedComicPinnedChapter(null);
          }}
        />
      )}
    </>
  );
}
