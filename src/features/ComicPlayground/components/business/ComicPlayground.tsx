import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  BookOpen,
  CirclePlus,
  Layers3,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import ComicList from "@/features/ComcList/components/business/ComicList";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/features/ComcList/types/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { ChapterInfo, ComicInfo, PageInfo } from "@/types";
import type { WorksetInfo } from "@/types/workset";
import type { Result } from "@/types/utils/result";
import type { WorkflowTransition } from "../../types/chapter";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import ComicCreatorModal from "./ComicCreatorModal";
import WorksetCreatorModal from "./WorksetCreatorModal";
import ComicDetailModal from "../../features/ComicDetailModal/components/business/ComicDetailModal";
import { listComics, createComic } from "../../api/comic";
import { listWorksets, createWorkset, deleteWorkset } from "../../api/workset";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
} from "../../api/chapter";
import { listPages } from "../../api/page";
import { api } from "@/api/util";
import {
  unwrapRawAssignmentInfo,
  type RawAssignmentInfo,
} from "@/types/raw/assignment";

type HeaderStatProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

type LoadChapterPagesArgs = {
  comicId: string;
  offset: number;
  limit: number;
};

type EmptyStateProps = {
  teamName: string;
  isLoading: boolean;
  onCreateWorkset: () => void;
};

function HeaderStat({ label, value, icon }: HeaderStatProps) {
  return (
    <div
      className={clsx(
        "flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/70",
        "bg-white/80 px-3 py-2 shadow-[0_8px_24px_rgba(120,120,120,0.08)]",
      )}
    >
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          "bg-slate-50 text-slate-500",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className={clsx(
            "text-[11px] font-medium uppercase",
            "tracking-[0.18em] text-slate-400",
          )}
        >
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-slate-700">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyComicPlaygroundState({
  teamName,
  isLoading,
  onCreateWorkset,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex h-full min-h-0 items-center justify-center rounded-[28px]",
        "border border-dashed border-slate-200 bg-white/70 px-6 py-10",
        "shadow-[0_16px_40px_rgba(120,120,120,0.06)] backdrop-blur-sm",
      )}
    >
      <div className="max-w-xl text-center">
        <div
          className={clsx(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
            "bg-emerald-50 text-emerald-600 shadow-sm",
          )}
        >
          <Sparkles size={24} />
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-800">
          先准备一个作品集，再开始组装漫画广场
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {isLoading
            ? "正在同步当前团队的作品集，请稍候。"
            : `${teamName} 下面还没有可用的作品集。创建一个作品集后，这里会自动切换成漫画列表与详情面板。`}
        </p>
        <button
          type="button"
          onClick={onCreateWorkset}
          className={clsx(
            "mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3",
            "bg-emerald-600 text-sm font-semibold text-white",
            "shadow-[0_12px_28px_rgba(16,185,129,0.22)]",
            "transition-transform hover:-translate-y-0.5 active:translate-y-0",
          )}
        >
          <CirclePlus size={18} />
          新建作品集
        </button>
      </div>
    </div>
  );
}

async function loadPinnedChapter(
  comicInfo: ComicInfo,
): Promise<Result<ChapterInfo | null>> {
  const result = await listChapters({
    comicId: comicInfo.id,
    offset: 0,
    limit: 20,
  });
  if (!result.success) return result;

  const pinned = result.data.find((chapter) => chapter.isPinned) ?? null;
  return { success: true, data: pinned ?? result.data[0] ?? null };
}

async function loadComicAssignments(
  comicInfo: ComicInfo,
): Promise<Result<AssignmentInfo[]>> {
  const chaptersResult = await listChapters({
    comicId: comicInfo.id,
    offset: 0,
    limit: 20,
  });
  if (!chaptersResult.success) return chaptersResult;

  const pinnedChapter =
    chaptersResult.data.find((chapter) => chapter.isPinned) ??
    chaptersResult.data[0];
  if (!pinnedChapter) return { success: true, data: [] };

  const result = await api.get<RawAssignmentInfo[]>(
    "/assignments",
    {
      chapter_id: pinnedChapter.id,
      offset: 0,
      limit: 50,
    },
    true,
  );
  if (!result.success) return result;

  return {
    success: true,
    data: result.data.map((raw) => unwrapRawAssignmentInfo(raw)),
  };
}

async function loadComicAssignmentsForChapter(
  chapterId: string,
): Promise<Result<AssignmentInfo[]>> {
  const result = await api.get<RawAssignmentInfo[]>(
    "/assignments",
    {
      chapter_id: chapterId,
      offset: 0,
      limit: 50,
    },
    true,
  );
  if (!result.success) return result;

  return {
    success: true,
    data: result.data.map((raw) => unwrapRawAssignmentInfo(raw)),
  };
}

async function loadChapterPages(
  chapterId: string,
): Promise<Result<PageInfo[]>> {
  return listPages({ chapterId, offset: 0, limit: 50 });
}

export default function ComicPlayground() {
  const loginState = useAppStore((state) => state.loginState);
  const { showToast } = useToastStore();

  const teamId = loginState?.memberInfos[0]?.teamId ?? "";
  const teamName = loginState?.memberInfos[0]?.team?.name ?? "当前团队";

  const [worksets, setWorksets] = useState<WorksetInfo[]>([]);
  const [activeWorksetId, setActiveWorksetId] = useState("");
  const [isWorksetsLoading, setIsWorksetsLoading] = useState(false);
  const [worksetVersion, setWorksetVersion] = useState(0);
  const [listVersion, setListVersion] = useState(0);
  const [fuzzyTitle, setFuzzyTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState<BinaryFilter>("unset");
  const [translateStatus, setTranslateStatus] = useState<TripleFilter>("unset");
  const [proofreadStatus, setProofreadStatus] = useState<TripleFilter>("unset");
  const [typesetStatus, setTypesetStatus] = useState<TripleFilter>("unset");
  const [reviewStatus, setReviewStatus] = useState<BinaryFilter>("unset");
  const [publishStatus, setPublishStatus] = useState<BinaryFilter>("unset");
  const [isComicCreatorOpen, setIsComicCreatorOpen] = useState(false);
  const [isWorksetCreatorOpen, setIsWorksetCreatorOpen] = useState(false);
  const [selectedComic, setSelectedComic] = useState<ComicInfo | null>(null);

  useEffect(() => {
    if (!teamId) {
      setWorksets([]);
      setActiveWorksetId("");
      setSelectedComic(null);
      setIsComicCreatorOpen(false);
      setIsWorksetCreatorOpen(false);
      return;
    }

    let isAlive = true;

    const loadWorksets = async () => {
      setIsWorksetsLoading(true);
      try {
        const result = await listWorksets({
          teamId,
          offset: 0,
          limit: 100,
          includes: ["team"],
        });
        if (!isAlive) return;

        if (!result.success) {
          console.error("[ComicPlayground] 加载作品集失败:", result);
          showToast(result.error, "error");
          setWorksets([]);
          setActiveWorksetId("");
          return;
        }

        setWorksets(result.data);
        setActiveWorksetId((current) => {
          if (
            current &&
            result.data.some((workset) => workset.id === current)
          ) {
            return current;
          }
          return result.data[0]?.id ?? "";
        });
      } catch (err) {
        console.error("[ComicPlayground] 加载作品集异常:", err);
        showToast("加载作品集失败", "error");
      } finally {
        if (isAlive) setIsWorksetsLoading(false);
      }
    };

    void loadWorksets();

    return () => {
      isAlive = false;
    };
  }, [teamId, worksetVersion, showToast]);

  const activeWorkset =
    worksets.find((workset) => workset.id === activeWorksetId) ?? null;

  const listKey = [
    teamId,
    activeWorksetId,
    fuzzyTitle,
    uploadStatus,
    translateStatus,
    proofreadStatus,
    typesetStatus,
    reviewStatus,
    publishStatus,
    listVersion,
  ].join("|");

  const handleRefresh = () => {
    setWorksetVersion((current) => current + 1);
    setListVersion((current) => current + 1);
  };

  const handleChangeWorkset = (worksetId: string) => {
    setActiveWorksetId(worksetId);
    setSelectedComic(null);
  };

  const handleCreateWorkset = async (args: {
    teamId: string;
    name: string;
    description?: string;
  }): Promise<Result<string>> => {
    const result = await createWorkset({
      ...args,
      teamId,
    });

    if (!result.success) {
      console.error("[ComicPlayground] 创建作品集失败:", result);
      showToast(result.error, "error");
      return result;
    }

    setActiveWorksetId(result.data);
    setWorksetVersion((current) => current + 1);
    return result;
  };

  const handleDeleteWorkset = (worksetId: string) => {
    void (async () => {
      const result = await deleteWorkset(worksetId);
      if (!result.success) {
        console.error("[ComicPlayground] 删除作品集失败:", result);
        showToast(result.error, "error");
        return;
      }

      const nextWorksetId =
        worksets.find((workset) => workset.id !== worksetId)?.id ?? "";

      setWorksets((prev) => prev.filter((workset) => workset.id !== worksetId));
      setActiveWorksetId((current) =>
        current === worksetId ? nextWorksetId : current,
      );
      setSelectedComic(null);
      setWorksetVersion((current) => current + 1);
      setListVersion((current) => current + 1);
    })();
  };

  const handleCreateComic = async (args: {
    worksetId: string;
    title: string;
    author: string;
    description?: string;
  }): Promise<Result<string>> => {
    const result = await createComic(args);
    if (!result.success) {
      console.error("[ComicPlayground] 创建漫画失败:", result);
      showToast(result.error, "error");
      return result;
    }

    setListVersion((current) => current + 1);
    setWorksetVersion((current) => current + 1);
    return result;
  };

  const handleLoadComics = async (
    offset: number,
    limit: number,
  ): Promise<ComicInfo[] | string> => {
    if (!activeWorksetId) return [];

    const result = await listComics({
      worksetId: activeWorksetId,
      fuzzyTitle: fuzzyTitle.trim() || undefined,
      uploadStatus,
      translateStatus,
      proofreadStatus,
      typesetStatus,
      reviewStatus,
      publishStatus,
      includes: ["workset", "creator"],
      offset,
      limit,
    });

    if (!result.success) return result.error;
    return result.data;
  };

  const handleOpenComicCreator = () => {
    if (!activeWorkset) {
      showToast("请先选择一个作品集", "error");
      return;
    }
    setIsComicCreatorOpen(true);
  };

  const handleOpenWorksetCreator = () => {
    if (!teamId) {
      showToast("未获取到当前团队信息", "error");
      return;
    }
    setIsWorksetCreatorOpen(true);
  };

  const handleComicClick = (comicInfo: ComicInfo) => {
    setSelectedComic(comicInfo);
  };

  const handleCreateChapter = async ({
    comicId,
    subtitle,
  }: {
    comicId: string;
    subtitle?: string;
  }): Promise<Result<string>> => {
    const result = await createChapter({ comicId, subtitle });
    if (result.success) {
      setListVersion((current) => current + 1);
    }
    return result;
  };

  const handleDeleteChapter = async (
    chapterId: string,
  ): Promise<Result<void>> => {
    const result = await deleteChapter(chapterId);
    if (result.success) {
      setListVersion((current) => current + 1);
    }
    return result;
  };

  const handleTransiteWorkflow = async (
    chapterId: string,
    transition: WorkflowTransition,
  ): Promise<Result<void>> => {
    const result = await updateChapter(chapterId, {
      workflowTransition: transition,
    });
    if (result.success) {
      setListVersion((current) => current + 1);
    }
    return result;
  };

  const handleCloseComicDetail = () => {
    setSelectedComic(null);
  };

  const header = (
    <section
      className={clsx(
        "rounded-[28px] border border-slate-200/70 bg-white/85 px-5 py-4",
        "shadow-[0_16px_40px_rgba(120,120,120,0.08)] backdrop-blur-sm",
      )}
    >
      <div
        className={clsx(
          "flex flex-col gap-4",
          "lg:flex-row lg:items-end lg:justify-between",
        )}
      >
        <div className="max-w-2xl">
          <div
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border",
              "border-emerald-100 bg-emerald-50 px-3 py-1",
              "text-[11px] font-semibold uppercase tracking-[0.22em]",
              "text-emerald-700",
            )}
          >
            <BookOpen size={12} />
            Comic Playground
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
            漫画广场
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
            这里是一个以漫画列表为中心的管理台，作品集、筛选、详情和章节流程都在这里统一处理。
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="grid gap-3 sm:grid-cols-3">
            <HeaderStat
              label="团队"
              value={teamName}
              icon={<Users size={18} />}
            />
            <HeaderStat
              label="作品集"
              value={String(worksets.length)}
              icon={<Layers3 size={18} />}
            />
            <HeaderStat
              label="当前漫画"
              value={String(activeWorkset?.comicCount ?? 0)}
              icon={<Sparkles size={18} />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              className={clsx(
                "inline-flex items-center gap-2 rounded-2xl border border-slate-200",
                "bg-white px-4 py-2.5 text-sm font-semibold text-slate-600",
                "transition-colors hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <RefreshCw size={16} />
              刷新
            </button>
            <button
              type="button"
              onClick={handleOpenWorksetCreator}
              className={clsx(
                "inline-flex items-center gap-2 rounded-2xl border border-emerald-100",
                "bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700",
                "transition-colors hover:bg-emerald-100",
              )}
            >
              <CirclePlus size={16} />
              新建作品集
            </button>
            <button
              type="button"
              onClick={handleOpenComicCreator}
              disabled={!activeWorkset}
              className={clsx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold",
                activeWorkset
                  ? [
                      "bg-slate-800 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]",
                      "transition-transform hover:-translate-y-0.5 active:translate-y-0",
                    ]
                  : "cursor-not-allowed bg-slate-100 text-slate-400",
              )}
            >
              <CirclePlus size={16} />
              新建漫画
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const handleLoadChapterAssignments = async (
    chapterId: string,
  ): Promise<Result<AssignmentInfo[]>> =>
    loadComicAssignmentsForChapter(chapterId);

  const handleLoadChapters = ({
    comicId,
    offset,
    limit,
  }: LoadChapterPagesArgs) => listChapters({ comicId, offset, limit });

  const listArea = activeWorkset ? (
    <ComicList
      key={listKey}
      mode="translator"
      worksets={worksets}
      activeWorksetId={activeWorksetId}
      onChangeWorkset={handleChangeWorkset}
      onCreateWorkset={handleOpenWorksetCreator}
      onDeleteWorkset={handleDeleteWorkset}
      onLoadComics={handleLoadComics}
      onLoadLatestChapter={loadPinnedChapter}
      onLoadAssignments={loadComicAssignments}
      onComicClick={handleComicClick}
      onCreateComic={handleOpenComicCreator}
      onChangeFuzzyTitle={setFuzzyTitle}
      activeFuzzyTitle={fuzzyTitle}
      activeUploadStatus={uploadStatus}
      activeTranslateStatus={translateStatus}
      activeProofreadStatus={proofreadStatus}
      activeTypesetStatus={typesetStatus}
      activeReviewStatus={reviewStatus}
      activePublishStatus={publishStatus}
      onChangeUploadStatus={setUploadStatus}
      onChangeTranslateStatus={setTranslateStatus}
      onChangeProofreadStatus={setProofreadStatus}
      onChangeTypesetStatus={setTypesetStatus}
      onChangeReviewStatus={setReviewStatus}
      onChangePublishStatus={setPublishStatus}
    />
  ) : (
    <EmptyComicPlaygroundState
      teamName={teamName}
      isLoading={isWorksetsLoading}
      onCreateWorkset={handleOpenWorksetCreator}
    />
  );

  return (
    <div
      className={clsx(
        "relative flex h-full min-h-0 flex-col overflow-hidden",
        "bg-[#faf8f2]",
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(236,253,245,0.9), transparent 36%)," +
          "radial-gradient(circle at top right, rgba(248,250,252,0.9), transparent 30%)," +
          "linear-gradient(180deg, #faf8f2 0%, #f5f7f1 100%)",
      }}
    >
      <div className="absolute -left-20 top-12 h-56 w-56 rounded-full bg-emerald-100/35 blur-3xl" />
      <div className="absolute -right-16 top-40 h-64 w-64 rounded-full bg-amber-100/35 blur-3xl" />

      <div className="relative z-10 flex h-full min-h-0 flex-col px-4 py-4 md:px-6 md:py-6">
        {header}

        <div className="mt-4 min-h-0 flex-1">{listArea}</div>
      </div>

      {isComicCreatorOpen && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          onCreateComic={handleCreateComic}
          onClose={() => setIsComicCreatorOpen(false)}
        />
      )}

      {isWorksetCreatorOpen && (
        <WorksetCreatorModal
          teamId={teamId}
          onCreateWorkset={handleCreateWorkset}
          onClose={() => setIsWorksetCreatorOpen(false)}
        />
      )}

      {selectedComic && (
        <ComicDetailModal
          comicInfo={selectedComic}
          pinnedChapter={null}
          onLoadChapters={handleLoadChapters}
          onLoadAssignments={handleLoadChapterAssignments}
          onLoadPages={loadChapterPages}
          onTransiteWorkflow={handleTransiteWorkflow}
          onCreateChapter={handleCreateChapter}
          onDeleteChapter={handleDeleteChapter}
          onClose={handleCloseComicDetail}
        />
      )}
    </div>
  );
}
