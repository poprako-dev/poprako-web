import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import BaseTranslator from "@/features/BaseTranslator";
import type {
  TerminologyDataSource,
  UnitSearchTransformDataSource,
} from "@/features/BaseTranslator";
import type { Project } from "@/types/project";
import type { UnitDiff, UnitSaveResult } from "@/features/BaseTranslator/types/type";
import type { Page, PageImageQuality } from "@/types/page";
import { useAppStore } from "@/store/app";
import LoadingCircle from "@/components/ui/LoadingCircle";
import {
  listUnits,
  saveUnits,
  listPages,
  listPageUnitDiffStats,
  searchChapterUnits,
  completeChapterStage,
  transformChapterUnits,
} from "../../api/translator";
import { listAssignmentsByChapter } from "@/api/assignment";
import { getUser } from "@/api/user";
import { getChapter } from "@/features/ComicPlayground/api/chapter";
import { toApiRequestError } from "@/api/util";
import {
  createTerm,
  deleteTerm,
  listTerms,
  updateTerm,
} from "@/features/ComicPlayground/api/term";
import {
  createComicTermbase,
  deleteTermbase,
  listComicTermbases,
  updateTermbase,
} from "@/features/ComicPlayground/api/termbase";
import { selectPageImageUrl } from "../../pageImage";

import type { TranslatorMode } from "@/types/translatorMode";
import type {
  TranslatorCompletionStage,
} from "@/features/BaseTranslator/types/access";

interface Props {
  chapterId: string;
  startPageId: string;
  onExit: () => void;
  startMode: TranslatorMode | "auto";
}

type LoadingState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      project: Project;
      comicId: string;
      canTranslate: boolean;
      canProofread: boolean;
    };

const ASSIGNMENT_PAGE_SIZE = 100;

function aggregateProjectCounters(pages: Page[]) {
  const totalUnitCount = pages.reduce((sum, page) => sum + page.totalUnitCount, 0);
  const translatedUnitCount = pages.reduce(
    (sum, page) => sum + page.translatedUnitCount,
    0,
  );
  const proofreadUnitCount = pages.reduce(
    (sum, page) => sum + page.proofreadUnitCount,
    0,
  );

  return { totalUnitCount, translatedUnitCount, proofreadUnitCount };
}

function mergePageCounters(
  pages: Page[],
  pageId: string,
  counters: Pick<Page, "totalUnitCount" | "translatedUnitCount" | "proofreadUnitCount">,
) {
  return pages.map((page) =>
    page.id === pageId
      ? {
          ...page,
          totalUnitCount: counters.totalUnitCount,
          translatedUnitCount: counters.translatedUnitCount,
          proofreadUnitCount: counters.proofreadUnitCount,
        }
      : page,
  );
}

export default function WebTranslator({ chapterId, startPageId, onExit, startMode }: Props) {
  const [state, setState] = useState<LoadingState>({ status: "loading" });
  const activeRef = useRef(false);
  const latestLoadsRef = useRef(new Map<string, symbol>());
  useEffect(() => {
    activeRef.current = true;
    const loads = latestLoadsRef.current;
    return () => { activeRef.current = false; loads.clear(); };
  }, [chapterId]);
  const currentUserId = useAppStore((state) => state.loginState?.userInfo.id ?? "");

  const handleResolveUser = useCallback(async (userId: string) => {
    const currentUser = useAppStore.getState().loginState?.userInfo;
    if (currentUser?.id === userId) {
      return { success: true as const, data: currentUser };
    }

    return getUser(userId);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setState({ status: "loading" });

      // 1. Fetch the chapter context and pages together.
      const [chapterResult, pagesResult] = await Promise.all([
        getChapter(chapterId),
        listPages(chapterId),
      ]);
      if (!chapterResult.success) {
        if (!isCancelled) {
          setState({ status: "error", message: chapterResult.error });
        }
        return;
      }
      if (!pagesResult.success) {
        if (!isCancelled) {
          setState({ status: "error", message: pagesResult.error });
        }
        return;
      }
      // eslint-disable-next-line unicorn/no-array-sort
      const pages = pagesResult.data.sort((a, b) => a.index - b.index);
      if (pages.length === 0) {
        if (!isCancelled) {
          setState({ status: "error", message: "当前章节暂无页面" });
        }
        return;
      }

      // 2. Determine the current user's assignment permissions.
      // An unavailable assignment lookup must fail closed to read-only.
      const userId = useAppStore.getState().loginState?.userInfo.id;
      let canTranslate = false;
      let canProofread = false;

      if (userId) {
        for (let offset = 0; ; offset += ASSIGNMENT_PAGE_SIZE) {
          const assignResult = await listAssignmentsByChapter({
            chapterId,
            offset,
            limit: ASSIGNMENT_PAGE_SIZE,
          });
          if (!assignResult.success) {break;}

          const assignment = assignResult.data.find((item) => item.userId === userId);
          if (assignment) {
            canTranslate = assignment.assignedTranslatorAt !== undefined;
            canProofread = assignment.assignedProofreaderAt !== undefined;
            break;
          }
          if (assignResult.data.length < ASSIGNMENT_PAGE_SIZE) {break;}
        }
      }

      // 3. Build Project
      const { totalUnitCount, translatedUnitCount, proofreadUnitCount } =
        aggregateProjectCounters(pages);

      const project: Project = {
        id: chapterId,
        title: `Chapter ${chapterId}`,
        author: "Unknown",
        pageCount: pages.length,
        totalUnitCount,
        translatedUnitCount,
        proofreadUnitCount,
        pages: pages.map((p) => ({
          id: p.id,
          chapterId: p.chapterId,
          index: p.index,
          imageUrl: p.imageUrl,
          imageOptimizedUrl: p.imageOptimizedUrl,
          imageThumbnailUrl: p.imageThumbnailUrl,
          isUploaded: p.isUploaded,
          creatorId: p.creatorId,
          creator: p.creator,
          totalUnitCount: p.totalUnitCount,
          translatedUnitCount: p.translatedUnitCount,
          proofreadUnitCount: p.proofreadUnitCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      };

      if (!isCancelled) {
        setState({
          status: "ready",
          project,
          comicId: chapterResult.data.comicId,
          canTranslate,
          canProofread,
        });
      }
    }

    void load();
    return () => { isCancelled = true; };
  }, [chapterId]);

  const handleFetchUnits = useCallback(
    async (pageId: string) => {
      const generation = Symbol();
      latestLoadsRef.current.set(pageId, generation);
      const result = await listUnits(pageId);
      if (!result.success) {return result;}

      setState((prev) => {
        if (!activeRef.current || prev.status !== "ready" || prev.project.id !== chapterId
          || latestLoadsRef.current.get(pageId) !== generation) {return prev;}

        const nextPages = mergePageCounters(prev.project.pages, pageId, {
          totalUnitCount: result.data.totalUnitCount,
          translatedUnitCount: result.data.translatedUnitCount,
          proofreadUnitCount: result.data.proofreadUnitCount,
        });
        const counters = aggregateProjectCounters(nextPages);

        return {
          ...prev,
          project: {
            ...prev.project,
            pages: nextPages,
            ...counters,
          },
        };
      });

      return {
        success: true as const,
        // eslint-disable-next-line unicorn/no-array-sort
        data: [...result.data.units].sort((lhs, rhs) => lhs.index - rhs.index),
      };
    },
    [chapterId],
  );

  const handleLoadUnits = useCallback(
    async (pageId: string) => {
      const result = await handleFetchUnits(pageId);
      if (!result.success) {
        console.error("[WebTranslator] 加载单页单位失败", { // eslint-disable-line no-console
          pageId,
          error: result.error,
        });
        throw toApiRequestError(result);
      }

      return result.data;
    },
    [handleFetchUnits],
  );

  const handleSaveUnits = useCallback(
    async (pageId: string, diff: UnitDiff, saveId: string): Promise<UnitSaveResult> => {
      const result = await saveUnits(pageId, diff, saveId);
      if (!result.success) {
        // eslint-disable-next-line no-console
        console.error(
          "[WebTranslator] 保存单页单位失败", { pageId, diff, error: result.error },
        );
        throw toApiRequestError(result);
      }
      return result.data;
    },
    [],
  );

  const handleLoadPageImage = useCallback(
    async (
      pageId: string,
      quality: PageImageQuality,
    ): Promise<string> => {
      // Page URLs are already available in project.pages. Optimized loading
      // falls back to the original while older servers are still in use.
      if (state.status === "ready") {
        const page = state.project.pages.find((p) => p.id === pageId);
        if (page) {return selectPageImageUrl(page, quality);}
      }
      // Fallback: fetch pages again
      const result = await listPages(chapterId);
      if (result.success) {
        const page = result.data.find((p) => p.id === pageId);
        if (page) {return selectPageImageUrl(page, quality);}
      }
      return "";
    },
    [chapterId, state],
  );

  const handleCompleteStage = useCallback(
    async (stage: TranslatorCompletionStage) => {
      const result = await completeChapterStage(chapterId, stage);
      if (!result.success) {throw toApiRequestError(result);}
    },
    [chapterId],
  );

  const handleListPageUnitDiffStats = useCallback(async () => {
    const result = await listPageUnitDiffStats(chapterId);
    if (!result.success) {throw toApiRequestError(result);}
    return result.data;
  }, [chapterId]);

  const comicId = state.status === "ready" ? state.comicId : undefined;
  const terminology = useMemo<TerminologyDataSource | undefined>(() => {
    if (!comicId) {return;}

    return {
      listTermbases: (args) => listComicTermbases({ comicId, ...args }),
      listTerms,
      createTermbase: (args) => createComicTermbase({ comicId, ...args }),
      updateTermbase,
      deleteTermbase,
      createTerm,
      updateTerm,
      deleteTerm,
    };
  }, [comicId]);

  const unitSearchTransform = useMemo<UnitSearchTransformDataSource>(() => ({
    search: (args) => searchChapterUnits(chapterId, args),
    transform: (args) => transformChapterUnits(chapterId, args),
    reloadPage: handleFetchUnits,
  }), [chapterId, handleFetchUnits]);

  if (state.status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingCircle />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={
          "flex h-screen w-full flex-col items-center " +
          "justify-center gap-4 bg-background"
        }
      >
        <p className="text-sm text-destructive">{state.message}</p>
        <button
          type="button"
          onClick={onExit}
          className={
            "text-sm text-muted-foreground hover:text-foreground " +
            "transition-colors underline"
          }
        >
          返回
        </button>
      </div>
    );
  }

  if (!currentUserId) {
    throw new Error("[WebTranslator] 缺少当前登录用户 ID");
  }
  if (!terminology) {
    throw new Error("[WebTranslator] 缺少术语数据源");
  }

  return (
    <BaseTranslator
      key={chapterId}
      project={state.project}
      onLoadUnits={handleLoadUnits}
      onSaveUnits={handleSaveUnits}
      onLoadPageImage={handleLoadPageImage}
      onResolveUser={handleResolveUser}
      onCompleteStage={handleCompleteStage}
      onListPageUnitDiffStats={handleListPageUnitDiffStats}
      onExit={onExit}
      currentUserId={currentUserId}
      canTranslate={state.canTranslate}
      canProofread={state.canProofread}
      terminology={terminology}
      unitSearchTransform={unitSearchTransform}
      startPageId={startPageId}
      startMode={startMode}
    />
  );
}
