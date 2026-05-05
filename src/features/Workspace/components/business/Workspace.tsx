import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { WorkspaceTab } from "../../types/types";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import type { AssignmentInfo } from "@/types/assignment";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import WorkspaceHeaderNav from "./WorkspaceHeaderNav";
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
  updateChapter,
  exportChapter,
  importChapter,
} from "@/features/ComicPlayground/api/chapter";
import {
  listPages,
  deleteChapterPages,
  reserveChapterPages,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import { api } from "@/api/util";
import { unwrapRawAssignmentInfo, type RawAssignmentInfo } from "@/types/raw/assignment";
import type { ListChapterArgs, WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import clsx from "clsx";

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export default function Workspace() {
  const loginState = useAppStore((s) => s.loginState);
  const currentUserId = loginState?.userInfo.id ?? null;
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("workspace");
  const [selectedComic, setSelectedComic] = useState<ComicInfo | null>(null);
  const [selectedComicPinnedChapter, setSelectedComicPinnedChapter] =
    useState<ChapterInfo | null>(null);
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);

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
      const result = await api.get<RawAssignmentInfo[]>(
        `/assignments/chapters/${chapterId}`,
        {
        offset: 0,
        limit: 100,
        },
      );
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
    (chapterId: string, pageId: string) => {
      if (!selectedComic?.id) {
        navigate(`/translator/${chapterId}/${pageId}`);
        return;
      }

      const nextSearchParams = new URLSearchParams({
        returnTo: "/workspace",
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
          key={selectedComic.id}
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          initialChapterId={urlChapterId}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignmentsForChapter}
          onLoadPages={handleLoadPages}
          onTransiteWorkflow={handleTransiteWorkflow}
          onNavigateToTranslator={handleNavigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={handleAddPages}
          onDeleteChapterPages={handleDeleteChapterPages}
          onImportChapter={handleImportChapter}
          onExportChapter={handleExportChapter}
          onDeleteComic={handleDeleteComic}
          onClose={() => {
            setSelectedComic(null);
            setSelectedComicPinnedChapter(null);
            setComicDetailSearchParams(null, null);
          }}
        />
      )}
    </>
  );
}
