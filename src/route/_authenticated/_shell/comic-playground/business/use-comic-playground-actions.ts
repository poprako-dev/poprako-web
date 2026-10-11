import { useCallback } from "react";
import { createComic, listComics } from "@/route/_authenticated/business/comic/comic-request";
import { updateWorkset } from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-request";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { CreateComicArgs } from "@/route/_authenticated/business/comic/comic-input";
import type { Result } from "@/shared/utility/result";
import type { ApiClient } from "@/api/client";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

type LoadArgs = {
  offset: number;
  limit: number;
  mode: "translator" | "reviewer";
  client: ApiClient;
  worksetId: string | null;
  title: string;
  stages: number | undefined;
};

interface ComicPlaygroundActionSet {
  handleLoadComics: (
    offset: number,
    limit: number,
    mode: "translator" | "reviewer",
  ) => Promise<Result<ComicInfo[]>>;
  handleUpdateWorkset: (
    id: string,
    update: { name: string; description?: string | undefined },
  ) => Promise<Result<void>>;
  handleCreateComic: (comicArgs: CreateComicArgs) => Promise<Result<string>>;
  handleDetailChanged: () => void;
}

async function loadComicPage(args: LoadArgs): Promise<Result<ComicInfo[]>> {
  if (!args.worksetId) {
    return { success: true, data: [] };
  }
  return listComics(args.client, {
    worksetId: args.worksetId,
    withs:
      args.mode === "reviewer"
        ? ["pinned_chapter", "pinned_chapter_assignment"]
        : ["pinned_chapter"],
    fuzzyTitle: args.title || undefined,
    stages: args.stages,
    offset: args.offset,
    limit: args.limit,
  });
}

async function saveWorkset(
  client: ApiClient,
  id: string,
  args: { name: string; description?: string | undefined },
  loadWorksets: () => Promise<void>,
  showToast: ReturnType<typeof useToastStore.getState>["showToast"],
): Promise<Result<void>> {
  const result = await updateWorkset(client, id, args);
  if (!result.success) {
    console.error("[ComicPlayground] 更新作品集失败:", result.error);
    showLocalApiFailure(result, showToast);
    return result;
  }
  showToast("作品集信息已更新", "success");
  await loadWorksets();
  return result;
}

async function submitComic(
  client: ApiClient,
  args: CreateComicArgs,
  loadWorksets: () => Promise<void>,
  setRefreshKey: (update: (current: number) => number) => void,
  showToast: ReturnType<typeof useToastStore.getState>["showToast"],
): Promise<Result<string>> {
  const result = await createComic(client, args);
  if (result.success) {
    await loadWorksets();
    setRefreshKey((current) => current + 1);
  } else {
    console.error("[ComicPlayground] 创建漫画失败:", result.error);
    showLocalApiFailure(result, showToast);
  }
  return result;
}

export function useComicPlaygroundActions(args: {
  client: ApiClient;
  activeWorksetId: string | null;
  activeTitle: string;
  activeStages: number | undefined;
  loadWorksets: () => Promise<void>;
  retryComicDetail: () => void;
  setRefreshKey: (update: (current: number) => number) => void;
}): ComicPlaygroundActionSet {
  const {
    client,
    activeWorksetId,
    activeTitle,
    activeStages,
    loadWorksets,
    retryComicDetail,
    setRefreshKey,
  } = args;
  const showToast = useToastStore((state) => state.showToast);
  const handleLoadComics = useCallback(
    (offset: number, limit: number, mode: "translator" | "reviewer") =>
      loadComicPage({
        offset,
        limit,
        mode,
        client,
        worksetId: activeWorksetId,
        title: activeTitle,
        stages: activeStages,
      }),
    [activeStages, activeTitle, activeWorksetId, client],
  );
  const handleUpdateWorkset = useCallback(
    (id: string, update: { name: string; description?: string | undefined }) =>
      saveWorkset(client, id, update, loadWorksets, showToast),
    [client, loadWorksets, showToast],
  );
  const handleCreateComic = (comicArgs: CreateComicArgs): Promise<Result<string>> =>
    submitComic(client, comicArgs, loadWorksets, setRefreshKey, showToast);
  const handleDetailChanged = useCallback(() => {
    setRefreshKey((current) => current + 1);
    retryComicDetail();
    void loadWorksets();
  }, [loadWorksets, retryComicDetail, setRefreshKey]);
  return { handleLoadComics, handleUpdateWorkset, handleCreateComic, handleDetailChanged };
}
