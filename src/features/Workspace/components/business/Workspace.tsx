import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ComicInfo, ChapterInfo, UploadProgressCallbacks } from "@/types";
import type { Result } from "@/types/utils/result";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import EmbeddedComicList from "@/features/ComcList/components/business/EmbeddedComicList";
import ComicDetailModal from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailModal";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import {
  fetchMyComics,
  fetchLatestChapter,
  fetchComicAssignments,
} from "../../api/workspace";
import { deleteComic, getComic } from "@/features/ComicPlayground/api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  importChapter,
  joinChapter,
} from "@/features/ComicPlayground/api/chapter";
import {
  listPages,
  deleteChapterPages,
  reserveChapterPages,
  reserveExistingPageUpload,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/api/assignment";
import type { ListChapterArgs, WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { roleMask, type Role } from "@/types/role";
import { listMembers } from "@/api/member";
import clsx from "clsx";

function getUniformFileExtension(files: File[]): string | null {
  if (files.length === 0) return null;

  const getExt = (file: File) => {
    const dotIndex = file.name.lastIndexOf(".");
    if (dotIndex < 0 || dotIndex === file.name.length - 1) return "";
    return file.name.slice(dotIndex + 1).toLowerCase();
  };

  const first = getExt(files[0]);
  const isUniform = files.every((file) => getExt(file) === first);

  return isUniform ? first : null;
}

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export default function Workspace() {
  const loginState = useAppStore((s) => s.loginState);
  const currentUserId = loginState?.userInfo.id ?? null;
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedComic, setSelectedComic] = useState<ComicInfo | null>(null);
  const [selectedComicPinnedChapter, setSelectedComicPinnedChapter] =
    useState<ChapterInfo | null>(null);
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const userClosedRef = useRef(false);

  const urlComicId = searchParams.get("comicId");
  const urlChapterId = searchParams.get("chapterId");

  const setComicDetailSearchParams = useCallback(
    (comicId: string | null, chapterId: string | null) => {
      const next = new URLSearchParams(searchParams);

      if (comicId) {
        next.set("comicId", comicId);
      } else {
        next.delete("comicId");
      }

      if (comicId && chapterId) {
        next.set("chapterId", chapterId);
      } else {
        next.delete("chapterId");
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const userName = loginState?.userInfo.name ?? "用户";
  const selectedComicTeamId = selectedComic?.workset?.teamId ?? null;
  const selectedComicActiveMember = useMemo(() => {
    const teamId = selectedComicTeamId;
    if (!teamId) return null;
    return loginState?.memberInfos.find((member) => member.teamId === teamId) ?? null;
  }, [loginState?.memberInfos, selectedComicTeamId]);

  const resolveActiveMember = useCallback(() => {
    return selectedComicActiveMember;
  }, [selectedComicActiveMember]);

  const handleOpenComicDetail = useCallback(
    (comicInfo: ComicInfo, desiredChapterId?: string | null) => {
      setSelectedComic(comicInfo);
      setSelectedComicPinnedChapter(null);
      setComicDetailSearchParams(comicInfo.id, desiredChapterId ?? null);

      fetchLatestChapter(comicInfo).then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          return;
        }
        setSelectedComicPinnedChapter(result.data);
        if (!desiredChapterId) {
          setComicDetailSearchParams(comicInfo.id, result.data?.id ?? null);
        }
      });
    },
    [setComicDetailSearchParams, showToast],
  );

  useEffect(() => {
    if (!urlComicId || selectedComic?.id === urlComicId || userClosedRef.current) {
      userClosedRef.current = false;
      return;
    }

    let cancelled = false;

    getComic(urlComicId)
      .then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          if (!cancelled) {
            setComicDetailSearchParams(null, null);
          }
          return;
        }

        if (!cancelled) {
          handleOpenComicDetail(result.data, urlChapterId);
        }
      })
      .catch((err) => {
        console.error("[Workspace] 恢复漫画详情失败:", err);
        showToast("恢复漫画详情失败", "error");
        if (!cancelled) {
          setComicDetailSearchParams(null, null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    handleOpenComicDetail,
    selectedComic?.id,
    setComicDetailSearchParams,
    showToast,
    urlChapterId,
    urlComicId,
  ]);

  const handleLoadDetailChapters = useCallback(
    async (args: ListChapterArgs): Promise<Result<ChapterInfo[]>> => {
      return listChapters(args);
    },
    [],
  );

  const handleLoadAssignmentsForChapter = useCallback(
    async (chapterId: string): Promise<Result<AssignmentInfo[]>> => {
      return listAssignmentsByChapter({
        chapterId,
        offset: 0,
        limit: 100,
        includes: ["user"],
      });
    },
    [],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId, offset: 0, limit: 200 });
  }, []);

  const handleTransiteWorkflow = useCallback(
    async (
      chapterId: string,
      transition: WorkflowTransition,
    ): Promise<Result<void>> => {
      return updateChapter(chapterId, { workflowTransition: transition });
    },
    [],
  );

  const handleJoinChapterRole = useCallback(
    async (chapterId: string, role: Role): Promise<Result<void>> => {
      const result = await joinChapter(chapterId, roleMask([role]));
      if (!result.success) {
        console.error("[Workspace] 加入章节分工失败:", result.error);
      }
      return result;
    },
    [],
  );

  const handleLoadAssignableMembers = useCallback(
    async (chapterId: string): Promise<Result<MemberInfo[]>> => {
      void chapterId;
      if (!selectedComicTeamId) {
        return { success: true, data: [] };
      }

      return listMembers({
        teamId: selectedComicTeamId,
        offset: 0,
        limit: 200,
        includes: ["user"],
      });
    },
    [selectedComicTeamId],
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

      const result = await upsertAssignment({
        chapterId,
        userId,
        roleMask: roleMask(mergedRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleRemoveRole = useCallback(
    async (chapterId: string, userId: string, role: Role): Promise<Result<void>> => {
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

      const remainingRoles = assignmentRoles(target).filter((r) => r !== role);
      if (remainingRoles.length === 0) {
        const result = await deleteAssignment(target.id);
        if (!result.success) return result;
        return { success: true, data: undefined };
      }

      const result = await upsertAssignment({
        chapterId,
        userId,
        roleMask: roleMask(remainingRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleCreateChapter = useCallback(
    async (args: { comicId: string; subtitle?: string }): Promise<Result<string>> => {
      return createChapter(args);
    },
    [],
  );

  const handleDeleteChapter = useCallback(
    async (chapterId: string): Promise<Result<void>> => {
      return deleteChapter(chapterId);
    },
    [],
  );

  const handleReservePageUpload = useCallback(
    async (args: { pageId: string; fileExtension: string }) => {
      return reserveExistingPageUpload(args);
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
    async (
      chapterId: string,
      files: File[],
      callbacks?: UploadProgressCallbacks,
    ) => {
      const fileExtension = getUniformFileExtension(files);
      if (fileExtension === null) {
        const errorMessage = "所选文件后缀必须一致";
        console.error("[Workspace] 批量加页文件后缀不一致", {
          chapterId,
          files: files.map((file) => file.name),
        });
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      }

      const reserveResult = await reserveChapterPages({
        chapterId,
        pageCount: files.length,
        fileExtension,
      });
      if (!reserveResult.success) {
        console.error("[Workspace] 预留页面失败:", reserveResult.error);
        throw new Error(reserveResult.error);
      }

      const creations = reserveResult.data.creations;
      if (creations.length !== files.length) {
        throw new Error("预留页面数量与选择文件数量不一致");
      }

      callbacks?.onPagesReserved(
        creations.map((c, i) => ({ pageId: c.pageId, index: i })),
      );

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const creation = creations[i];

        const uploadResult = await uploadToPresignedUrl(
          creation.putUrl,
          file,
          (percent) => callbacks?.onPageUploadProgress?.(creation.pageId, percent),
        );
        if (!uploadResult.success) {
          console.error("[Workspace] 上传页面失败:", uploadResult.error);
          throw new Error(uploadResult.error);
        }

        const markResult = await updatePage(creation.pageId, { isUploaded: true });
        if (!markResult.success) {
          console.error("[Workspace] 标记页面上传状态失败:", markResult.error);
          throw new Error(markResult.error);
        }

        callbacks?.onPageUploaded(creation.pageId, file);
      }
    },
    [showToast],
  );

  const handleDeleteChapterPages = useCallback(
    async (chapterId: string): Promise<Result<void>> => {
      return deleteChapterPages(chapterId);
    },
    [],
  );

  const handleDeleteComic = useCallback(
    async (comicId: string): Promise<Result<void>> => {
      const result = await deleteComic(comicId);
      if (!result.success) {
        console.error("[Workspace] 删除漫画失败:", result.error);
        return result;
      }

      setSelectedComic(null);
      setSelectedComicPinnedChapter(null);
      setComicDetailSearchParams(null, null);
      setComicListRefreshKey((prev) => prev + 1);

      return result;
    },
    [setComicDetailSearchParams],
  );

  const handleNavigateToTranslator = useCallback(
    (chapterId: string, pageId: string, readOnly?: boolean) => {
      if (!selectedComic?.id) {
        navigate(`/translator/${chapterId}/${pageId}`);
        return;
      }

      const nextSearchParams = new URLSearchParams({
        returnTo: "/workspace",
        comicId: selectedComic.id,
        chapterId,
      });

      if (readOnly) {
        nextSearchParams.set("readOnly", "true");
      }

      navigate({
        pathname: `/translator/${chapterId}/${pageId}`,
        search: `?${nextSearchParams.toString()}`,
      });
    },
    [navigate, selectedComic?.id],
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
      </div>

      <div className={clsx("flex-1 min-h-0 min-w-0 overflow-x-hidden")}>
        <EmbeddedComicList
          key={comicListRefreshKey}
          mode="translator"
          onLoadComics={fetchMyComics}
          onLoadLatestChapter={fetchLatestChapter}
          onLoadAssignments={fetchComicAssignments}
          onComicClick={handleOpenComicDetail}
        />
      </div>
    </div>
  );

  return (
    <>
      <WorkspaceLayout>{workspaceBody}</WorkspaceLayout>
      {selectedComic && (
        <ComicDetailModal
          key={selectedComic.id}
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          initialChapterId={urlChapterId}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignmentsForChapter}
          onLoadPages={handleLoadPages}
          onTransiteWorkflow={handleTransiteWorkflow}
          onRemoveAssignment={handleRemoveRole}
          onLoadAssignableMembers={handleLoadAssignableMembers}
          onAddAssignment={handleAddAssignment}
          onCreateChapter={handleCreateChapter}
          onDeleteChapter={handleDeleteChapter}
          onNavigateToTranslator={handleNavigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={handleAddPages}
          onDeleteChapterPages={handleDeleteChapterPages}
          onReservePageUpload={handleReservePageUpload}
          onJoinChapterRole={handleJoinChapterRole}
          onImportChapter={handleImportChapter}
          onExportChapter={handleExportChapter}
          onDeleteComic={handleDeleteComic}
          onResolveActiveMember={resolveActiveMember}
          onClose={() => {
            userClosedRef.current = true;
            setSelectedComic(null);
            setSelectedComicPinnedChapter(null);
            setComicDetailSearchParams(null, null);
          }}
        />
      )}
    </>
  );
}
