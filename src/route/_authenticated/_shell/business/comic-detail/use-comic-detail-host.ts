import { useCallback, useEffect, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import {
  type AssignableMemberArgs,
  type ComicDetailData,
  findComicMember,
  listComicMembers,
  loadComicDetail,
} from "@/route/_authenticated/_shell/business/comic-detail/detail-request";

export type ComicDetailSearch = {
  comicId?: string | undefined;
  chapterId?: string | undefined;
  detailMode?: string | undefined;
};

export type { WorkbenchDestination } from "@/route/_authenticated/business/navigation/workbench-navigation";
import {
  isComicDetailMode,
  readComicDetailMode,
  saveComicDetailMode,
} from "@/route/_authenticated/business/navigation/workbench-navigation";
import type {
  ComicDetailMode,
  WorkbenchDestination,
} from "@/route/_authenticated/business/navigation/workbench-navigation";

type Args = {
  returnTo: WorkbenchDestination["returnTo"];
  showToast: (message: string, type: ToastType) => void;
  search: ComicDetailSearch;
  onChangeSearch: (
    comicId: string | null,
    chapterId: string | null,
    mode?: ComicDetailMode,
  ) => void;
  onNavigateToWorkbench: (destination: WorkbenchDestination) => void;
};

type LoadedDetail = { comicId: string; result: Result<ComicDetailData> };

type ComicDetailHostState = {
  selectedComic: ComicDetailData["comicInfo"] | null;
  selectedComicPinnedChapter: ComicDetailData["pinnedChapter"];
  detailActiveMember: MemberInfo | null;
  loadAssignableMembers: (
    chapterId: string,
    args: AssignableMemberArgs,
  ) => Promise<Result<MemberInfo[]>>;
  isDetailOpen: boolean;
  detailError: string | null;
  urlChapterId: string | null;
  detailMode: ComicDetailMode;
  changeDetailMode: (mode: ComicDetailMode, chapterId: string | null) => void;
  openComicDetail: (comicId: string, chapterId?: string | null, mode?: ComicDetailMode) => void;
  clearComicDetail: () => void;
  retryComicDetail: () => void;
  navigateToWorkbench: (
    chapterId: string,
    pageId: string,
    isReadOnly?: boolean,
    mode?: ComicDetailMode,
  ) => void;
};

export function useComicDetailHost({
  returnTo,
  showToast,
  search,
  onChangeSearch,
  onNavigateToWorkbench,
}: Args): ComicDetailHostState {
  const client = useApiClient();
  const [loadedDetail, setLoadedDetail] = useState<LoadedDetail | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const { memberInfos, userInfo } = useReadySession();
  const detailMode = isComicDetailMode(search.detailMode)
    ? search.detailMode
    : readComicDetailMode(userInfo.id);
  useEffect(() => {
    if (search.comicId && isComicDetailMode(search.detailMode))
      saveComicDetailMode(userInfo.id, search.detailMode);
  }, [search.comicId, search.detailMode, userInfo.id]);
  const urlComicId = search.comicId ?? null;
  const urlChapterId = search.chapterId ?? null;
  const result = loadedDetail?.comicId === urlComicId ? loadedDetail.result : undefined;
  const detail = result?.success ? result.data : null;
  const selectedComic = detail?.comicInfo ?? null;
  const detailActiveMember = selectedComic ? findComicMember(selectedComic, memberInfos) : null;

  const setComicDetailSearchParams = useCallback(
    (comicId: string | null, chapterId: string | null, mode?: ComicDetailMode) => {
      onChangeSearch(
        comicId,
        comicId ? chapterId : null,
        comicId ? (mode ?? detailMode) : undefined,
      );
    },
    [onChangeSearch, detailMode],
  );

  const openComicDetail = useCallback(
    (comicId: string, chapterId?: string | null, mode?: ComicDetailMode) => {
      const nextMode = mode ?? readComicDetailMode(userInfo.id);
      saveComicDetailMode(userInfo.id, nextMode);
      setComicDetailSearchParams(comicId, chapterId ?? null, nextMode);
    },
    [setComicDetailSearchParams, userInfo.id],
  );

  const clearComicDetail = useCallback(() => {
    setLoadedDetail(null);
    setComicDetailSearchParams(null, null);
  }, [setComicDetailSearchParams]);

  const retryComicDetail = useCallback(() => {
    setLoadedDetail(null);
    setLoadRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect
    setLoadedDetail(null);
    if (!urlComicId) return;
    let isCancelled = false;

    const loadDetail = async (): Promise<void> => {
      try {
        const nextResult = await loadComicDetail(client, urlComicId);
        if (isCancelled) return;
        setLoadedDetail({ comicId: urlComicId, result: nextResult });
        if (!nextResult.success) {
          console.error("[ComicDetail] 加载详情失败:", nextResult.error);
          showLocalApiFailure(nextResult, showToast);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error("[ComicDetail] 加载详情异常:", error);
        setLoadedDetail({
          comicId: urlComicId,
          result: { success: false, error: "加载漫画详情失败，请重试" },
        });
        showLocalCaughtError(error, showToast, "加载漫画详情失败");
      }
    };
    void loadDetail();
    return () => {
      isCancelled = true;
    };
  }, [client, loadRevision, showToast, urlComicId]);

  const loadAssignableMembers = useCallback(
    (_chapterId: string, args: AssignableMemberArgs): Promise<Result<MemberInfo[]>> => {
      if (!selectedComic) {
        return Promise.resolve({
          success: false,
          error: "漫画详情尚未加载完成",
        });
      }
      return listComicMembers(client, selectedComic, args);
    },
    [client, selectedComic],
  );

  const navigateToWorkbench = useCallback(
    (
      chapterId: string,
      pageId: string,
      isReadOnly?: boolean,
      mode: ComicDetailMode = "translator",
    ): void => {
      if (!urlComicId) return;
      onNavigateToWorkbench({
        returnTo,
        comicId: urlComicId,
        chapterId,
        pageId,
        readOnly: mode === "reviewer" || (isReadOnly ?? false),
        mode,
      });
    },
    [onNavigateToWorkbench, returnTo, urlComicId],
  );

  return {
    selectedComic,
    selectedComicPinnedChapter: detail?.pinnedChapter ?? null,
    detailActiveMember,
    loadAssignableMembers,
    isDetailOpen: Boolean(urlComicId),
    detailError: result && !result.success ? result.error : null,
    urlChapterId,
    detailMode,
    changeDetailMode(mode, chapterId) {
      saveComicDetailMode(userInfo.id, mode);
      setComicDetailSearchParams(urlComicId, chapterId, mode);
    },
    openComicDetail,
    clearComicDetail,
    retryComicDetail,
    navigateToWorkbench,
  };
}
