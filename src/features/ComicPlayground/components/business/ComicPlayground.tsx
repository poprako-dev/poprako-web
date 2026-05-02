import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { useAppStore } from "@/store/app";
import ComicList from "@/features/ComcList/components/business/ComicList";
import ComicCreatorModal from "./ComicCreatorModal";
import WorksetCreatorModal from "./WorksetCreatorModal";
import ComicDetailModal from "../../features/ComicDetailModal/components/business/ComicDetailModal";
import { listWorksets, createWorkset, deleteWorkset } from "../../api/workset";
import { listComics, createComic, getComic } from "../../api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  importChapter,
} from "../../api/chapter";
import {
  listPages,
  deletePage,
  reserveChapterPages,
  updatePage,
  uploadToPresignedUrl,
} from "../../api/page";
import type { WorksetInfo } from "@/types/workset";
import { api } from "@/api/util";
import type { ComicInfo, ChapterInfo } from "@/types";
import { matchComicClientFilters, type ComicClientFilters } from "../../types/comic";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { MemberInfo } from "@/types/member";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";
import type { CreateWorksetArgs } from "../../types/workset";
import type { CreateComicArgs } from "../../types/comic";
import type { ListChapterArgs, WorkflowTransition } from "../../types/chapter";
import { unwrapRawAssignmentInfo, type RawAssignmentInfo } from "@/types/raw/assignment";
import type { Role } from "@/types/role";
import { roleMask } from "@/types/role";
import { listMembers } from "@/api/member";

export default function ComicPlayground() {
  const { activeTeamId: teamId } = useActiveTeam();
  const currentUserId = useAppStore((s) => s.loginState?.userInfo.id ?? null);
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [worksets, setWorksets] = useState<WorksetInfo[]>([]);
  const [activeWorksetId, setActiveWorksetId] = useState<string>("");

  const [activeFuzzyTitle, setActiveFuzzyTitle] = useState<string>("");
  const [activeUploadStatus, setActiveUploadStatus] =
    useState<BinaryFilter>("unset");
  const [activeTranslateStatus, setActiveTranslateStatus] =
    useState<TripleFilter>("unset");
  const [activeProofreadStatus, setActiveProofreadStatus] =
    useState<TripleFilter>("unset");
  const [activeTypesetStatus, setActiveTypesetStatus] =
    useState<TripleFilter>("unset");
  const [activeReviewStatus, setActiveReviewStatus] =
    useState<BinaryFilter>("unset");
  const [activePublishStatus, setActivePublishStatus] =
    useState<BinaryFilter>("unset");

  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [showComicCreatorModal, setShowComicCreatorModal] = useState(false);
  const [showWorksetCreatorModal, setShowWorksetCreatorModal] = useState(false);
  const [selectedComic, setSelectedComic] = useState<ComicInfo | null>(null);
  const [selectedComicPinnedChapter, setSelectedComicPinnedChapter] =
    useState<ChapterInfo | null>(null);

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

  const loadWorksets = useCallback(async () => {
    if (!teamId) {
      setWorksets([]);
      setActiveWorksetId("");
      return;
    }
    const result = await listWorksets({ teamId, offset: 0, limit: 100 });
    if (!result.success) {
      console.error("[ComicPlayground] 加载作品集失败:", result.error);
      showToast(result.error, "error");
      return;
    }
    setWorksets(result.data);
    setActiveWorksetId((prev) =>
      result.data.some((workset) => workset.id === prev)
        ? prev
        : result.data[0]?.id || "",
    );
  }, [teamId, showToast]);

  useEffect(() => {
    loadWorksets();
  }, [loadWorksets]);

  const comicFilters = useMemo<ComicClientFilters>(
    () => ({
      fuzzyTitle: activeFuzzyTitle,
      uploadStatus: activeUploadStatus,
      translateStatus: activeTranslateStatus,
      proofreadStatus: activeProofreadStatus,
      typesetStatus: activeTypesetStatus,
      reviewStatus: activeReviewStatus,
      publishStatus: activePublishStatus,
    }),
    [
      activeFuzzyTitle,
      activeUploadStatus,
      activeTranslateStatus,
      activeProofreadStatus,
      activeTypesetStatus,
      activeReviewStatus,
      activePublishStatus,
    ],
  );

  const handleLoadComics = useCallback(
    async (offset: number, limit: number): Promise<ComicInfo[] | string> => {
      if (!activeWorksetId) return [];
      const result = await listComics({
        worksetId: activeWorksetId,
        offset: 0,
        limit: 200,
      });
      if (!result.success) return result.error;

      const comicsWithChapter = await Promise.all(
        result.data.map(async (comic) => {
          const chapterResult = await listChapters({
            comicId: comic.id,
            offset: 0,
            limit: 1,
          });

          if (!chapterResult.success) {
            throw new Error(chapterResult.error);
          }

          return {
            comic,
            chapter: chapterResult.data[0] ?? null,
          };
        }),
      );

      const filtered = comicsWithChapter
        .filter(({ comic, chapter }) =>
          matchComicClientFilters(comic, chapter, comicFilters),
        )
        .map(({ comic }) => comic);

      return filtered.slice(offset, offset + limit);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorksetId, comicFilters, comicListRefreshKey],
  );

  const handleLoadLatestChapter = useCallback(
    async (comicInfo: ComicInfo): Promise<Result<ChapterInfo | null>> => {
      const result = await listChapters({
        comicId: comicInfo.id,
        offset: 0,
        limit: 1,
      });
      if (!result.success) return result;
      return { success: true, data: result.data[0] ?? null };
    },
    [],
  );

  const handleOpenComicDetail = useCallback(
    (comicInfo: ComicInfo, desiredChapterId?: string | null) => {
      setSelectedComic(comicInfo);
      setSelectedComicPinnedChapter(null);
      setComicDetailSearchParams(comicInfo.id, desiredChapterId ?? null);

      handleLoadLatestChapter(comicInfo).then((pinnedResult) => {
        if (!pinnedResult.success) {
          showToast(pinnedResult.error, "error");
          return;
        }

        setSelectedComicPinnedChapter(pinnedResult.data);
        if (!desiredChapterId) {
          setComicDetailSearchParams(comicInfo.id, pinnedResult.data?.id ?? null);
        }
      });
    },
    [handleLoadLatestChapter, setComicDetailSearchParams, showToast],
  );

  useEffect(() => {
    if (!urlComicId || selectedComic?.id === urlComicId) {
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
        console.error("[ComicPlayground] 恢复漫画详情失败:", err);
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

  const handleLoadAssignments = useCallback(
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

  const handleLoadAssignmentsForComic = useCallback(
    async (comicInfo: ComicInfo): Promise<Result<AssignmentInfo[]>> => {
      const pinnedResult = await handleLoadLatestChapter(comicInfo);
      if (!pinnedResult.success) {
        return pinnedResult;
      }

      const chapter = pinnedResult.data;
      if (!chapter) {
        return { success: true, data: [] };
      }

      return handleLoadAssignments(chapter.id);
    },
    [handleLoadAssignments, handleLoadLatestChapter],
  );

  const handleRemoveAssignment = useCallback(
    async (chapterId: string, userId: string): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignments(chapterId);
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
    [handleLoadAssignments],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId, offset: 0, limit: 200 });
  }, []);

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
      const assignmentResult = await handleLoadAssignments(chapterId);
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
    [handleLoadAssignments],
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

  const handleNavigateToTranslator = useCallback(
    (chapterId: string, pageId: string) => {
      if (!selectedComic?.id) {
        navigate(`/translator/${chapterId}/${pageId}`);
        return;
      }

      const nextSearchParams = new URLSearchParams({
        returnTo: "/comic-playground",
        comicId: selectedComic.id,
        chapterId,
      });

      navigate({
        pathname: `/translator/${chapterId}/${pageId}`,
        search: `?${nextSearchParams.toString()}`,
      });
    },
    [navigate, selectedComic?.id],
  );

  const handleDeleteWorkset = async (worksetId: string) => {
    const result = await deleteWorkset(worksetId);
    if (!result.success) {
      console.error("[ComicPlayground] 删除作品集失败:", result.error);
      showToast(result.error, "error");
      return;
    }
    await loadWorksets();
  };

  const handleCreateWorkset = async (
    args: CreateWorksetArgs,
  ): Promise<Result<string>> => {
    const result = await createWorkset(args);
    if (!result.success) {
      console.error("[ComicPlayground] 创建作品集失败:", result.error);
      showToast(result.error, "error");
    } else {
      await loadWorksets();
    }
    return result;
  };

  const handleCreateComic = async (
    args: CreateComicArgs,
  ): Promise<Result<string>> => {
    const result = await createComic(args);
    if (!result.success) {
      console.error("[ComicPlayground] 创建漫画失败:", result.error);
      showToast(result.error, "error");
    } else {
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);
    }
    return result;
  };

  const activeWorkset = worksets.find((w) => w.id === activeWorksetId);

  return (
    <>
      <ComicList
        mode="translator"
        worksets={worksets}
        activeWorksetId={activeWorksetId}
        onChangeWorkset={setActiveWorksetId}
        onCreateWorkset={() => setShowWorksetCreatorModal(true)}
        onDeleteWorkset={handleDeleteWorkset}
        onLoadComics={handleLoadComics}
        onLoadLatestChapter={handleLoadLatestChapter}
        onLoadAssignments={handleLoadAssignmentsForComic}
        onComicClick={handleOpenComicDetail}
        onCreateComic={() => setShowComicCreatorModal(true)}
        onChangeFuzzyTitle={setActiveFuzzyTitle}
        activeFuzzyTitle={activeFuzzyTitle}
        activeUploadStatus={activeUploadStatus}
        activeTranslateStatus={activeTranslateStatus}
        activeProofreadStatus={activeProofreadStatus}
        activeTypesetStatus={activeTypesetStatus}
        activeReviewStatus={activeReviewStatus}
        activePublishStatus={activePublishStatus}
        onChangeUploadStatus={setActiveUploadStatus}
        onChangeTranslateStatus={setActiveTranslateStatus}
        onChangeProofreadStatus={setActiveProofreadStatus}
        onChangeTypesetStatus={setActiveTypesetStatus}
        onChangeReviewStatus={setActiveReviewStatus}
        onChangePublishStatus={setActivePublishStatus}
      />
      {selectedComic && (
        <ComicDetailModal
          key={selectedComic.id}
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          initialChapterId={urlChapterId}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignments}
          onLoadPages={handleLoadPages}
          onTransiteWorkflow={handleTransiteWorkflow}
          onRemoveAssignment={handleRemoveAssignment}
          onLoadAssignableMembers={handleLoadAssignableMembers}
          onAddAssignment={handleAddAssignment}
          onCreateChapter={handleCreateChapter}
          onDeleteChapter={handleDeleteChapter}
          onNavigateToTranslator={handleNavigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={handleAddPages}
          onDeletePage={handleDeletePage}
          onImportChapter={handleImportChapter}
          onExportChapter={handleExportChapter}
          onClose={() => {
            setSelectedComic(null);
            setSelectedComicPinnedChapter(null);
            setComicDetailSearchParams(null, null);
          }}
        />
      )}
      {showComicCreatorModal && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          onCreateComic={handleCreateComic}
          onClose={() => setShowComicCreatorModal(false)}
        />
      )}
      {showWorksetCreatorModal && teamId && (
        <WorksetCreatorModal
          teamId={teamId}
          onCreateWorkset={handleCreateWorkset}
          onClose={() => setShowWorksetCreatorModal(false)}
        />
      )}
    </>
  );
}
