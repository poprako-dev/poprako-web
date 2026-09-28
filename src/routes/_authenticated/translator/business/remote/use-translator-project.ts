import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type { Page } from "@/routes/_authenticated/business/page/page";
import type { Project } from "@/routes/_authenticated/translator/business/unit/project";
import { listPages } from "@/routes/_authenticated/translator/business/remote/translator-request";
import { listAssignmentsByChapter } from "@/routes/_authenticated/business/assignment/assignment-request";
import { getChapter } from "@/routes/_authenticated/business/chapter/chapter-request";
import { useAppStore } from "@/routes/business/session/session-store";

export type TranslatorProjectState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      project: Project;
      comicId: string;
      canTranslate: boolean;
      canProofread: boolean;
    };

type ProjectCounters = Pick<Page, "totalUnitCount" | "translatedUnitCount" | "proofreadUnitCount">;

type ProjectStateSetter = Dispatch<SetStateAction<TranslatorProjectState>>;
type Result = { state: TranslatorProjectState; setState: ProjectStateSetter };

const ASSIGNMENT_PAGE_SIZE = 100;

export function aggregateProjectCounters(pages: Page[]): ProjectCounters {
  return pages.reduce<ProjectCounters>(
    (counters, page) => ({
      totalUnitCount: counters.totalUnitCount + page.totalUnitCount,
      translatedUnitCount: counters.translatedUnitCount + page.translatedUnitCount,
      proofreadUnitCount: counters.proofreadUnitCount + page.proofreadUnitCount,
    }),
    { totalUnitCount: 0, translatedUnitCount: 0, proofreadUnitCount: 0 },
  );
}

export function mergePageCounters(
  pages: Page[],
  pageId: string,
  counters: ProjectCounters,
): Page[] {
  return pages.map((page) => (page.id === pageId ? { ...page, ...counters } : page));
}

export function useTranslatorProject(chapterId: string): Result {
  const [state, setState] = useState<TranslatorProjectState>({
    status: "loading",
  });

  useEffect(() => {
    let isCancelled = false;

    async function load(): Promise<void> {
      setState({ status: "loading" });
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

      const pages = pagesResult.data.sort((left, right) => left.index - right.index);
      if (pages.length === 0) {
        if (!isCancelled) {
          setState({ status: "error", message: "当前章节暂无页面" });
        }
        return;
      }

      const userId = useAppStore.getState().loginState?.userInfo.id;
      let canTranslate = false;
      let canProofread = false;
      if (userId) {
        for (let offset = 0; ; offset += ASSIGNMENT_PAGE_SIZE) {
          const result = await listAssignmentsByChapter({
            chapterId,
            offset,
            limit: ASSIGNMENT_PAGE_SIZE,
          });
          if (!result.success) break;
          const assignment = result.data.find((item) => item.userId === userId);
          if (assignment) {
            canTranslate = assignment.assignedTranslatorAt !== undefined;
            canProofread = assignment.assignedProofreaderAt !== undefined;
            break;
          }
          if (result.data.length < ASSIGNMENT_PAGE_SIZE) break;
        }
      }

      const counters = aggregateProjectCounters(pages);
      const project: Project = {
        id: chapterId,
        title: `Chapter ${chapterId}`,
        author: "Unknown",
        pageCount: pages.length,
        ...counters,
        pages: pages.map((page) => ({ ...page })),
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
    return () => {
      isCancelled = true;
    };
  }, [chapterId]);

  return { state, setState };
}
