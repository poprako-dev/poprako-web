import type { ApiClient } from "@/api/client";
import { hasRole } from "@/route/business/identity/role";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type { Page } from "@/route/_authenticated/business/page/page";
import type { Project } from "@/route/_authenticated/translator/business/unit/project";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { listAssignmentsByChapter } from "@/route/_authenticated/business/assignment/assignment-request";
import { getChapter } from "@/route/_authenticated/business/chapter/chapter-request";
import { useReadySession } from "@/route/business/session/ready-session";
import { useApiClient } from "@/route/business/api-context";
import type { Result } from "@/shared/utility/result";

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
type UseTranslatorProjectResult = {
  state: TranslatorProjectState;
  setState: ProjectStateSetter;
};

const ASSIGNMENT_PAGE_SIZE = 100;

export type TranslatorAccess = {
  canTranslate: boolean;
  canProofread: boolean;
};

export async function loadTranslatorAccess(
  client: ApiClient,
  chapterId: string,
  userId: string,
  loadAssignments: typeof listAssignmentsByChapter = listAssignmentsByChapter,
): Promise<Result<TranslatorAccess>> {
  for (let offset = 0; ; offset += ASSIGNMENT_PAGE_SIZE) {
    const result = await loadAssignments(client, {
      chapterId,
      offset,
      limit: ASSIGNMENT_PAGE_SIZE,
    });
    if (!result.success) return result;

    const assignment = result.data.find((item) => item.userId === userId);
    if (assignment) {
      return {
        success: true,
        data: {
          canTranslate: hasRole(assignment, "translator"),
          canProofread: hasRole(assignment, "proofreader"),
        },
      };
    }
    if (result.data.length < ASSIGNMENT_PAGE_SIZE) {
      return {
        success: true,
        data: { canTranslate: false, canProofread: false },
      };
    }
  }
}

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

export function useTranslatorProject(chapterId: string): UseTranslatorProjectResult {
  const client = useApiClient();
  const {
    userInfo: { id: userId },
  } = useReadySession();
  const [state, setState] = useState<TranslatorProjectState>({
    status: "loading",
  });

  useEffect(() => {
    let isCancelled = false;

    async function load(): Promise<void> {
      setState({ status: "loading" });
      const [chapterResult, pagesResult] = await Promise.all([
        getChapter(client, chapterId),
        listPages(client, { chapterId }),
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

      const accessResult = await loadTranslatorAccess(client, chapterId, userId);
      if (isCancelled) return;
      if (!accessResult.success) {
        setState({ status: "error", message: accessResult.error });
        return;
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

      setState({
        status: "ready",
        project,
        comicId: chapterResult.data.comicId,
        ...accessResult.data,
      });
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [chapterId, client, userId]);

  return { state, setState };
}
