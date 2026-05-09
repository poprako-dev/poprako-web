import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { useAppStore } from "@/store/app";
import ComicList from "@/features/ComcList/components/business/ComicList";
import ComicCreatorModal from "./ComicCreatorModal";
import WorksetCreatorModal from "./WorksetCreatorModal";
import ComicDetailModal from "../../features/ComicDetailModal/components/business/ComicDetailModal";
import { listWorksets, createWorkset, deleteWorkset } from "../../api/workset";
import { listComics, createComic, deleteComic, getComic } from "../../api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  importChapter,
  joinChapter,
} from "../../api/chapter";
import {
  listPages,
  deleteChapterPages,
  reserveChapterPages,
  reserveExistingPageUpload,
  updatePage,
  uploadToPresignedUrl,
} from "../../api/page";
import type { WorksetInfo } from "@/types/workset";
import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/api/assignment";
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
import type { Role } from "@/types/role";
import { roleMask } from "@/types/role";
import { listMembers } from "@/api/member";

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
      return listAssignmentsByChapter({
        chapterId,
        offset: 0,
        limit: 100,
        includes: ["user"],
      });
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

  const handleRemoveRole = useCallback(
    async (chapterId: string, userId: string, role: Role): Promise<Result<void>> => {
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
    [handleLoadAssignments],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId, offset: 0, limit: 200 });
  }, []);

  const handleLoadAssignableMembers = useCallback(
    async (chapterId: string): Promise<Result<MemberInfo[]>> => {
      void chapterId;
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

      const result = await upsertAssignment({
        chapterId,
        userId,
        roleMask: roleMask(mergedRoles),
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

  const handleJoinChapterRole = useCallback(
    async (chapterId: string, role: Role): Promise<Result<void>> => {
      const result = await joinChapter(chapterId, roleMask([role]));
      if (!result.success) {
        console.error("[ComicPlayground] 加入章节分工失败:", result.error);
      }
      return result;
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
    async (chapterId: string, files: File[]) => {
      const fileExtension = getUniformFileExtension(files);
      if (fileExtension === null) {
        const errorMessage = "所选文件后缀必须一致";
        console.error("[ComicPlayground] 批量加页文件后缀不一致", {
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
        console.error("[ComicPlayground] 预留页面失败:", reserveResult.error);
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
          console.error("[ComicPlayground] 上传页面失败:", uploadResult.error);
          throw new Error(uploadResult.error);
        }

        const markResult = await updatePage(creation.pageId, { isUploaded: true });
        if (!markResult.success) {
          console.error("[ComicPlayground] 标记页面上传状态失败:", markResult.error);
          throw new Error(markResult.error);
        }
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
        console.error("[ComicPlayground] 删除漫画失败:", result.error);
        return result;
      }

      setSelectedComic(null);
      setSelectedComicPinnedChapter(null);
      setComicDetailSearchParams(null, null);
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);

      return result;
    },
    [loadWorksets, setComicDetailSearchParams],
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
          onClose={() => {
            userClosedRef.current = true;
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
