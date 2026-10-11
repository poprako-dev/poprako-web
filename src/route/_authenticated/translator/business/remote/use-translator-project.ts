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
    void loadTranslatorProject(client, chapterId, userId, setState, () => !isCancelled);
    return () => {
      isCancelled = true;
    };
  }, [chapterId, client, userId]);

  return { state, setState };
}

async function loadTranslatorProject(
  client: ApiClient,
  chapterId: string,
  userId: string,
  setState: ProjectStateSetter,
  isCurrent: () => boolean,
): Promise<void> {
  setState({ status: "loading" });
  const [chapterResult, pagesResult] = await Promise.all([
    getChapter(client, chapterId),
    listPages(client, { chapterId }),
  ]);
  if (!chapterResult.success) {
    setProjectError(setState, isCurrent, chapterResult.error);
    return;
  }
  if (!pagesResult.success) {
    setProjectError(setState, isCurrent, pagesResult.error);
    return;
  }
  const pages = pagesResult.data.sort((left, right) => left.index - right.index);
  if (pages.length === 0) {
    setProjectError(setState, isCurrent, "当前章节暂无页面");
    return;
  }
  const accessResult = await loadTranslatorAccess(client, chapterId, userId);
  if (!isCurrent()) return;
  if (!accessResult.success) {
    setState({ status: "error", message: accessResult.error });
    return;
  }
  setReadyProject(setState, chapterId, chapterResult.data.comicId, pages, accessResult.data);
}

function setProjectError(
  setState: ProjectStateSetter,
  isCurrent: () => boolean,
  message: string,
): void {
  if (isCurrent()) setState({ status: "error", message });
}

function setReadyProject(
  setState: ProjectStateSetter,
  chapterId: string,
  comicId: string,
  pages: Page[],
  access: TranslatorAccess,
): void {
  const project: Project = {
    id: chapterId,
    title: `Chapter ${chapterId}`,
    author: "Unknown",
    pageCount: pages.length,
    ...aggregateProjectCounters(pages),
    pages: pages.map((page) => ({ ...page })),
  };
  setState({ status: "ready", project, comicId, ...access });
}
