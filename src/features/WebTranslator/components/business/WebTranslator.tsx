import { useState, useEffect, useCallback } from "react";
import BaseTranslator from "@/features/BaseTranslator";
import type { Project } from "@/types/project";
import type { UnitDiff } from "@/features/BaseTranslator/types/type";
import type { Page } from "@/types/page";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast";
import LoadingCircle from "@/components/ui/LoadingCircle";
import {
  listUnits,
  saveUnits,
  listPages,
  completeChapterStage,
} from "../../api/translator";
import { listAssignmentsByChapter } from "@/api/assignment";
import { getUser } from "@/api/user";

import type { TranslatorMode } from "@/types/translatorMode";
import type {
  TranslatorCompletionStage,
} from "@/features/BaseTranslator/types/access";

type Props = {
  chapterId: string;
  startPageId?: string;
  onExit: () => void;
  startMode?: TranslatorMode;
};

type LoadingState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      project: Project;
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
  const { showToast } = useToastStore();
  const currentUserId = useAppStore((state) => state.loginState?.userInfo?.id);

  const handleResolveUser = useCallback(async (userId: string) => {
    const currentUser = useAppStore.getState().loginState?.userInfo;
    if (currentUser?.id === userId) {
      return { success: true as const, data: currentUser };
    }

    return getUser(userId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      // 1. Fetch pages
      const pagesResult = await listPages(chapterId);
      if (!pagesResult.success) {
        if (!cancelled) {
          setState({ status: "error", message: pagesResult.error });
        }
        return;
      }
      const pages = pagesResult.data.sort((a, b) => a.index - b.index);
      if (pages.length === 0) {
        if (!cancelled) {
          setState({ status: "error", message: "当前章节暂无页面" });
        }
        return;
      }

      // 2. Determine the current user's assignment permissions.
      // An unavailable assignment lookup must fail closed to read-only.
      const userId = useAppStore.getState().loginState?.userInfo?.id;
      let canTranslate = false;
      let canProofread = false;

      if (userId) {
        for (let offset = 0; ; offset += ASSIGNMENT_PAGE_SIZE) {
          const assignResult = await listAssignmentsByChapter({
            chapterId,
            offset,
            limit: ASSIGNMENT_PAGE_SIZE,
          });
          if (!assignResult.success) break;

          const assignment = assignResult.data.find((item) => item.userId === userId);
          if (assignment) {
            canTranslate = assignment.assignedTranslatorAt != null;
            canProofread = assignment.assignedProofreaderAt != null;
            break;
          }
          if (assignResult.data.length < ASSIGNMENT_PAGE_SIZE) break;
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
          isUploaded: p.isUploaded,
          creatorId: p.creatorId ?? "",
          creator: p.creator,
          totalUnitCount: p.totalUnitCount,
          translatedUnitCount: p.translatedUnitCount,
          proofreadUnitCount: p.proofreadUnitCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      };

      if (!cancelled) {
        setState({ status: "ready", project, canTranslate, canProofread });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [chapterId]);

  const handleLoadUnits = useCallback(
    async (pageId: string) => {
      const result = await listUnits(pageId);
      if (!result.success) {
        console.error("[WebTranslator] 加载单页单位失败", { pageId, error: result.error });
        showToast(result.error, "error");
        return [];
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;

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

      return [...result.data.units].sort((lhs, rhs) => lhs.index - rhs.index);
    },
    [showToast],
  );

  const handleSaveUnits = useCallback(
    async (pageId: string, diff: UnitDiff): Promise<void> => {
      const result = await saveUnits(pageId, diff);
      if (!result.success) {
        console.error("[WebTranslator] 保存单页单位失败", { pageId, diff, error: result.error });
        throw new Error(result.error);
      }

    },
    [],
  );

  const handleLoadPageImage = useCallback(
    async (pageId: string): Promise<string> => {
      // Page imageUrl is already available in the project.pages array
      // BaseTranslator calls this per-page, so we just return the
      // imageUrl from the project
      if (state.status === "ready") {
        const page = state.project.pages.find((p) => p.id === pageId);
        if (page) return page.imageUrl;
      }
      // Fallback: fetch pages again
      const result = await listPages(chapterId);
      if (result.success) {
        const page = result.data.find((p) => p.id === pageId);
        if (page) return page.imageUrl;
      }
      return "";
    },
    [chapterId, state],
  );

  const handleCompleteStage = useCallback(
    async (stage: TranslatorCompletionStage) => {
      const result = await completeChapterStage(chapterId, stage);
      if (!result.success) throw new Error(result.error);
    },
    [chapterId],
  );

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

  return (
    <BaseTranslator
      project={state.project}
      onLoadUnits={handleLoadUnits}
      onSaveUnits={handleSaveUnits}
      onLoadPageImage={handleLoadPageImage}
      onResolveUser={handleResolveUser}
      onCompleteStage={handleCompleteStage}
      onExit={onExit}
      currentUserId={currentUserId}
      canTranslate={state.canTranslate}
      canProofread={state.canProofread}
      startPageId={startPageId}
      startMode={startMode}
    />
  );
}
