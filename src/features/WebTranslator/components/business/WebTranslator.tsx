import { useState, useEffect, useCallback } from "react";
import BaseTranslator from "@/features/BaseTranslator";
import type { Project } from "@/types/project";
import type { UnitDiff } from "@/features/BaseTranslator/types/type";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast";
import LoadingEllipsis from "@/components/ui/LoadingEllipsis";
import {
  listUnits,
  saveUnits,
  listPages,
} from "../../api/translator";
import { unwrapRawAssignmentInfo, type RawAssignmentInfo } from "@/types/raw/assignment";
import { api } from "@/api/util";

type Props = {
  chapterId: string;
  startPageId?: string;
  onExit: () => void;
};

type LoadingState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; project: Project; isCurrUserProofreader: boolean };

export default function WebTranslator({ chapterId, startPageId, onExit }: Props) {
  const [state, setState] = useState<LoadingState>({ status: "loading" });
  const { showToast } = useToastStore();

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

      // 2. Determine if current user is proofreader
      const userId = useAppStore.getState().loginState?.userInfo?.id;
      let isCurrUserProofreader = false;

      if (userId) {
        const assignResult = await api.get<RawAssignmentInfo[]>(
          "/assignments",
          { chapter_id: chapterId, includes: ["user"], offset: 0, limit: 100 },
        );
        if (assignResult.success) {
          const assignments = (assignResult.data ?? []).map(unwrapRawAssignmentInfo);
          isCurrUserProofreader = assignments.some(
            (a) => a.userId === userId && a.assignedProofreaderAt !== undefined,
          );
        }
      }

      // 3. Build Project
      const totalUnitCount = pages.reduce((sum, p) => sum + p.totalUnitCount, 0);
      const translatedUnitCount = pages.reduce(
        (sum, p) => sum + p.translatedUnitCount,
        0,
      );
      const proofreadUnitCount = pages.reduce(
        (sum, p) => sum + p.proofreadUnitCount,
        0,
      );

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
        setState({ status: "ready", project, isCurrUserProofreader });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [chapterId]);

  const handleLoadUnits = useCallback(
    async (pageId: string) => {
      const result = await listUnits(pageId);
      if (!result.success) {
        showToast(result.error, "error");
        return [];
      }
      return result.data;
    },
    [showToast],
  );

  const handleSaveUnits = useCallback(
    async (pageId: string, diff: UnitDiff): Promise<void> => {
      const result = await saveUnits(pageId, diff);
      if (!result.success) {
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

  if (state.status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingEllipsis />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-destructive">{state.message}</p>
        <button
          onClick={onExit}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
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
      onExit={onExit}
      isCurrUserProofreader={state.isCurrUserProofreader}
      startPageId={startPageId}
    />
  );
}
