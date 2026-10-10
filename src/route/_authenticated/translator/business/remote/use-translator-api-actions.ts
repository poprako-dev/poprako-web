import type { ApiClient } from "@/api/client";
import type { PageImageQuality } from "@/route/_authenticated/business/page/page";
import {
  listPageUnitDiffStats,
  listPageUnitFlaggedStats,
} from "@/route/_authenticated/business/page/page-request";
import { completeChapterStage } from "@/route/_authenticated/business/chapter/chapter-request";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { getUser } from "@/route/business/identity/user-request";
import type { UserInfo } from "@/route/business/identity/user";
import type { UnitDiff, UnitSaveResult } from "../contract/type";
import type { UnitInfo } from "../unit/unit";
import type { TranslatorCompletionStage } from "../contract/access";
import {
  aggregateProjectCounters,
  mergePageCounters,
  type TranslatorProjectState,
} from "./use-translator-project";
import { listUnits, saveUnits } from "./translator-request";
import { selectPageImageUrl } from "./page-image";
import { toApiRequestError } from "@/route/business/request-error";
import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { Result } from "@/shared/utility/result";

type Options = {
  client: ApiClient;
  chapterId: string;
  currentUser: UserInfo;
  state: TranslatorProjectState;
  setState: Dispatch<SetStateAction<TranslatorProjectState>>;
  activeRef: RefObject<boolean>;
  latestLoadsRef: RefObject<Map<string, symbol>>;
};

type UnwrapResult<Value> = Value extends Promise<Result<infer Data>> ? Data : never;
interface ApiActions {
  handleResolveUser: (userId: string) => Promise<Result<UserInfo>>;
  handleFetchUnits: (pageId: string) => Promise<Result<UnitInfo[]>>;
  handleLoadUnits: (pageId: string) => Promise<UnitInfo[]>;
  handleSaveUnits: (pageId: string, diff: UnitDiff, saveId: string) => Promise<UnitSaveResult>;
  handleLoadPageImage: (pageId: string, quality: PageImageQuality) => Promise<string>;
  handleCompleteStage: (stage: TranslatorCompletionStage) => Promise<void>;
  handleListPageUnitFlaggedStats: () => Promise<
    UnwrapResult<ReturnType<typeof listPageUnitFlaggedStats>>
  >;
  handleListPageUnitDiffStats: () => Promise<
    UnwrapResult<ReturnType<typeof listPageUnitDiffStats>>
  >;
}

export function useTranslatorApiActions(options: Options): ApiActions {
  return {
    handleResolveUser: useUserResolver(options.client, options.currentUser),
    handleFetchUnits: useUnitFetcher(options),
    handleLoadUnits: useUnitLoader(options),
    handleSaveUnits: useUnitSaver(options.client),
    handleLoadPageImage: usePageImageLoader(options.client, options.chapterId, options.state),
    handleCompleteStage: useStageCompletion(options.client, options.chapterId),
    handleListPageUnitFlaggedStats: useFlaggedStatsLoader(options.client, options.chapterId),
    handleListPageUnitDiffStats: useDiffStatsLoader(options.client, options.chapterId),
  };
}

function useUserResolver(
  client: ApiClient,
  currentUser: UserInfo,
): ApiActions["handleResolveUser"] {
  return useCallback(
    (userId: string): Promise<Result<UserInfo>> => {
      return resolveUser(client, currentUser, userId);
    },
    [client, currentUser],
  );
}

async function resolveUser(
  client: ApiClient,
  currentUser: UserInfo,
  userId: string,
): Promise<Result<UserInfo>> {
  if (currentUser.id === userId) return { success: true, data: currentUser };
  return await getUser(client, userId);
}

function useUnitFetcher(options: Options): ApiActions["handleFetchUnits"] {
  const { client, chapterId, setState, activeRef, latestLoadsRef } = options;
  return useCallback(
    (pageId: string) => fetchUnits(client, chapterId, setState, activeRef, latestLoadsRef, pageId),
    [activeRef, chapterId, client, latestLoadsRef, setState],
  );
}

async function fetchUnits(
  client: ApiClient,
  chapterId: string,
  setState: Dispatch<SetStateAction<TranslatorProjectState>>,
  activeRef: RefObject<boolean>,
  latestLoadsRef: RefObject<Map<string, symbol>>,
  pageId: string,
): Promise<Result<UnitInfo[]>> {
  const generation = Symbol();
  latestLoadsRef.current.set(pageId, generation);
  const result = await listUnits(client, pageId);
  if (!result.success) return result;
  mergeFetchedPageCounters(
    setState,
    chapterId,
    activeRef,
    latestLoadsRef,
    pageId,
    generation,
    result.data,
  );
  return {
    success: true as const,
    data: [...result.data.units].sort((left, right) => left.index - right.index),
  };
}

function mergeFetchedPageCounters(
  setState: Dispatch<SetStateAction<TranslatorProjectState>>,
  chapterId: string,
  activeRef: RefObject<boolean>,
  latestLoadsRef: RefObject<Map<string, symbol>>,
  pageId: string,
  generation: symbol,
  data: { totalUnitCount: number; translatedUnitCount: number; proofreadUnitCount: number },
): void {
  setState((previous) => {
    if (
      !activeRef.current ||
      previous.status !== "ready" ||
      previous.project.id !== chapterId ||
      latestLoadsRef.current.get(pageId) !== generation
    )
      return previous;
    const pages = mergePageCounters(previous.project.pages, pageId, data);
    return {
      ...previous,
      project: { ...previous.project, pages, ...aggregateProjectCounters(pages) },
    };
  });
}

function useUnitLoader(options: Options): ApiActions["handleLoadUnits"] {
  const fetchPage = useUnitFetcher(options);
  return useCallback((pageId: string) => loadUnits(fetchPage, pageId), [fetchPage]);
}

async function loadUnits(
  fetchPage: (pageId: string) => ReturnType<typeof fetchUnits>,
  pageId: string,
): Promise<UnitInfo[]> {
  const result = await fetchPage(pageId);
  if (result.success) return result.data;
  console.error("[WebTranslator] 加载单页单位失败", { pageId, error: result.error });
  throw toApiRequestError(result);
}

function useUnitSaver(client: ApiClient): ApiActions["handleSaveUnits"] {
  return useCallback(
    (pageId: string, diff: UnitDiff, saveId: string): Promise<UnitSaveResult> => {
      return savePageUnits(client, pageId, diff, saveId);
    },
    [client],
  );
}

async function savePageUnits(
  client: ApiClient,
  pageId: string,
  diff: UnitDiff,
  saveId: string,
): Promise<UnitSaveResult> {
  const result = await saveUnits(client, pageId, diff, saveId);
  if (result.success) return result.data;
  console.error("[WebTranslator] 保存单页单位失败", { pageId, diff, error: result.error });
  throw toApiRequestError(result);
}

function usePageImageLoader(
  client: ApiClient,
  chapterId: string,
  state: TranslatorProjectState,
): ApiActions["handleLoadPageImage"] {
  return useCallback(
    (pageId: string, quality: PageImageQuality) => {
      return loadPageImage(client, chapterId, state, pageId, quality);
    },
    [chapterId, client, state],
  );
}

async function loadPageImage(
  client: ApiClient,
  chapterId: string,
  state: TranslatorProjectState,
  pageId: string,
  quality: PageImageQuality,
): Promise<string> {
  if (state.status === "ready") {
    const page = state.project.pages.find((item) => item.id === pageId);
    if (page) return selectPageImageUrl(page, quality);
  }
  const result = await listPages(client, { chapterId });
  if (!result.success) throw toApiRequestError(result);
  const page = result.data.find((item) => item.id === pageId);
  if (page) return selectPageImageUrl(page, quality);
  throw new Error(`[WebTranslator] 页面 ${pageId} 不属于章节 ${chapterId}`);
}

function useStageCompletion(
  client: ApiClient,
  chapterId: string,
): ApiActions["handleCompleteStage"] {
  return useCallback(
    (stage: TranslatorCompletionStage) => completeStage(client, chapterId, stage),
    [chapterId, client],
  );
}

async function completeStage(
  client: ApiClient,
  chapterId: string,
  stage: TranslatorCompletionStage,
): Promise<void> {
  const result = await completeChapterStage(client, chapterId, { stage, oper: "advance" });
  if (!result.success) throw toApiRequestError(result);
}

function useFlaggedStatsLoader(
  client: ApiClient,
  chapterId: string,
): ApiActions["handleListPageUnitFlaggedStats"] {
  return useCallback(() => loadFlaggedStats(client, chapterId), [chapterId, client]);
}

async function loadFlaggedStats(
  client: ApiClient,
  chapterId: string,
): Promise<UnwrapResult<ReturnType<typeof listPageUnitFlaggedStats>>> {
  const result = await listPageUnitFlaggedStats(client, chapterId);
  if (!result.success) throw toApiRequestError(result);
  return result.data;
}

function useDiffStatsLoader(
  client: ApiClient,
  chapterId: string,
): ApiActions["handleListPageUnitDiffStats"] {
  return useCallback(() => loadDiffStats(client, chapterId), [chapterId, client]);
}

async function loadDiffStats(
  client: ApiClient,
  chapterId: string,
): Promise<UnwrapResult<ReturnType<typeof listPageUnitDiffStats>>> {
  const result = await listPageUnitDiffStats(client, chapterId);
  if (!result.success) throw toApiRequestError(result);
  return result.data;
}
