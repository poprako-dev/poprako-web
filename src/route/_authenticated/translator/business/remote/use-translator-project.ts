import type { ApiClient } from "@/api/client";
import { hasRole } from "@/route/business/identity/role";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type { Page } from "@/route/_authenticated/business/page/page";
import type { Project } from "@/route/_authenticated/translator/business/unit/project";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { listAssignmentsByChapter } from "@/route/_authenticated/business/assignment/assignment-request";
import { getChapter } from "@/route/_authenticated/business/chapter/chapter-request";
import { useReadySession } from "@/route/business/session/ready-session";
import { useSessionOperation } from "@/route/business/session/use-session-operation";
import { useApiClient } from "@/route/business/api-context";
import type { Result } from "@/shared/utility/result";
import { toApiRequestError } from "@/route/business/request-error";

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
  isCurrent: () => boolean = () => true,
  signal?: AbortSignal,
): Promise<Result<TranslatorAccess>> {
  for (let offset = 0; ; offset += ASSIGNMENT_PAGE_SIZE) {
    if (signal?.aborted || !isCurrent()) return cancelledAccess();
    const result = await loadAssignments(
      client,
      { chapterId, offset, limit: ASSIGNMENT_PAGE_SIZE },
      signal,
    );
    if (signal?.aborted || !isCurrent()) return cancelledAccess();
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

function cancelledAccess(): Result<TranslatorAccess> {
  return { success: false, error: "会话已失效", failureKind: "aborted" };
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
  const startOperation = useSessionOperation();
  const [state, setState] = useState<TranslatorProjectState>({
    status: "loading",
  });

  useEffect(() => {
    const operation = startOperation();
    if (!operation.isCurrent()) return;
    const request = new AbortController();
    const abort = (): void => {
      request.abort();
    };
    operation.signal.addEventListener("abort", abort, { once: true });
    void loadTranslatorProject({
      client,
      chapterId,
      userId,
      setState,
      request,
      isCurrent: () => !request.signal.aborted && operation.isCurrent(),
    });
    return () => {
      operation.signal.removeEventListener("abort", abort);
      request.abort();
    };
  }, [chapterId, client, userId, startOperation]);

  return { state, setState };
}

type ProjectLoad = {
  client: ApiClient;
  chapterId: string;
  userId: string;
  setState: ProjectStateSetter;
  isCurrent: () => boolean;
  request: AbortController;
};

async function loadTranslatorProject(options: ProjectLoad): Promise<void> {
  const { client, chapterId, userId, setState, isCurrent, request } = options;
  setState({ status: "loading" });
  try {
    const [chapter, pages, access] = await Promise.all([
      getChapter(client, chapterId, request.signal).then(requireProjectResult),
      loadProjectPages(client, chapterId, request.signal),
      loadTranslatorAccess(
        client,
        chapterId,
        userId,
        listAssignmentsByChapter,
        isCurrent,
        request.signal,
      ).then(requireProjectResult),
    ]);
    if (isCurrent()) setReadyProject(setState, chapterId, chapter.comicId, pages, access);
  } catch (error) {
    if (!isCurrent()) return;
    console.error("[WebTranslator] 加载翻译项目失败:", chapterId, error);
    setState({
      status: "error",
      message: error instanceof Error ? error.message : "加载翻译项目失败",
    });
    request.abort();
  }
}

function requireProjectResult<Value>(result: Result<Value>): Value {
  if (!result.success) throw toApiRequestError(result);
  return result.data;
}

async function loadProjectPages(
  client: ApiClient,
  chapterId: string,
  signal: AbortSignal,
): Promise<Page[]> {
  const pages = requireProjectResult(await listPages(client, { chapterId }, signal));
  if (pages.length === 0) throw new Error("当前章节暂无页面");
  return [...pages].sort((left, right) => left.index - right.index);
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
