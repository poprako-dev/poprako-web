import { useCallback, useEffect, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/routes/business/request";
import { useAppStore } from "@/routes/business/session/session-store";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { MemberInfo } from "@/routes/business/identity/member";
import type { Result } from "@/shared/utility/result";
import {
  type AssignableMemberArgs,
  type ComicDetailData,
  findComicMember,
  listComicMembers,
  loadComicDetail,
} from "@/routes/_authenticated/_shell/business/comic-detail/detail-request";

export type ComicDetailSearch = {
  comicId?: string | undefined;
  chapterId?: string | undefined;
};

export type TranslatorDestination = {
  returnTo: "/workspace" | "/comic-playground";
  comicId: string;
  chapterId: string;
  pageId: string;
  readOnly: boolean;
};

type Args = {
  returnTo: TranslatorDestination["returnTo"];
  showToast: (message: string, type: ToastType) => void;
  search: ComicDetailSearch;
  onChangeSearch: (comicId: string | null, chapterId: string | null) => void;
  onNavigateToTranslator: (destination: TranslatorDestination) => void;
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
  openComicDetail: (comicId: string, chapterId?: string | null) => void;
  clearComicDetail: () => void;
  retryComicDetail: () => void;
  navigateToTranslator: (chapterId: string, pageId: string, isReadOnly?: boolean) => void;
};

export function useComicDetailHost({
  returnTo,
  showToast,
  search,
  onChangeSearch,
  onNavigateToTranslator,
}: Args): ComicDetailHostState {
  const [loadedDetail, setLoadedDetail] = useState<LoadedDetail | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const memberInfos = useAppStore((s) => s.loginState?.memberInfos);
  const urlComicId = search.comicId ?? null;
  const urlChapterId = search.chapterId ?? null;
  const result = loadedDetail?.comicId === urlComicId ? loadedDetail.result : undefined;
  const detail = result?.success ? result.data : null;
  const selectedComic = detail?.comicInfo ?? null;
  const detailActiveMember = selectedComic
    ? findComicMember(selectedComic, memberInfos ?? [])
    : null;

  const setComicDetailSearchParams = useCallback(
    (comicId: string | null, chapterId: string | null) => {
      onChangeSearch(comicId, comicId ? chapterId : null);
    },
    [onChangeSearch],
  );

  const openComicDetail = useCallback(
    (comicId: string, chapterId?: string | null) => {
      setComicDetailSearchParams(comicId, chapterId ?? null);
    },
    [setComicDetailSearchParams],
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
        const nextResult = await loadComicDetail(urlComicId);
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
  }, [loadRevision, showToast, urlComicId]);

  const loadAssignableMembers = useCallback(
    (_chapterId: string, args: AssignableMemberArgs): Promise<Result<MemberInfo[]>> => {
      if (!selectedComic) {
        return Promise.resolve({
          success: false,
          error: "漫画详情尚未加载完成",
        });
      }
      return listComicMembers(selectedComic, args);
    },
    [selectedComic],
  );

  const navigateToTranslator = useCallback(
    (chapterId: string, pageId: string, isReadOnly?: boolean): void => {
      if (!urlComicId) return;
      onNavigateToTranslator({
        returnTo,
        comicId: urlComicId,
        chapterId,
        pageId,
        readOnly: isReadOnly ?? false,
      });
    },
    [onNavigateToTranslator, returnTo, urlComicId],
  );

  return {
    selectedComic,
    selectedComicPinnedChapter: detail?.pinnedChapter ?? null,
    detailActiveMember,
    loadAssignableMembers,
    isDetailOpen: Boolean(urlComicId),
    detailError: result && !result.success ? result.error : null,
    urlChapterId,
    openComicDetail,
    clearComicDetail,
    retryComicDetail,
    navigateToTranslator,
  };
}
