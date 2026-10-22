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
import type { TranslatorCompletionStage } from "../contract/access";
import type { TranslatorProjectState } from "./use-translator-project";
import { usePageUnitActions, type PageUnitActions } from "./use-page-unit-source";
import type { DraftStore } from "../persistence/draft-store";
import { selectPageImageUrl } from "./page-image";
import { toApiRequestError } from "@/route/business/request-error";
import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { Result } from "@/shared/utility/result";

type Options = {
  client: ApiClient;
  chapterId: string;
  currentUser: UserInfo;
  drafts: DraftStore;
  state: TranslatorProjectState;
  setState: Dispatch<SetStateAction<TranslatorProjectState>>;
  activeRef: RefObject<boolean>;
  latestLoadsRef: RefObject<Map<string, symbol>>;
};

type UnwrapResult<Value> = Value extends Promise<Result<infer Data>> ? Data : never;
interface ApiActions extends PageUnitActions {
  handleResolveUser: (userId: string) => Promise<Result<UserInfo>>;
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
    ...usePageUnitActions(options),
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
