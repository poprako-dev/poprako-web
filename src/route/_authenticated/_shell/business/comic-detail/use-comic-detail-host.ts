import { useCallback, useEffect } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";
import { useAppStore } from "@/route/business/session/session-store";
import { useComicDetailData } from "./use-comic-detail-data";
import { preloadComicDetail } from "./comic-detail-module";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { MemberInfo } from "@/route/business/identity/member";
import type { Result } from "@/shared/utility/result";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import {
  type AssignableMemberArgs,
  type ComicDetailData,
  findComicMember,
  listComicMembers,
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
  openComicDetail: (comicId: string, chapterId?: string | null) => void;
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
  const urlComicId = search.comicId ?? null;
  const urlChapterId = search.chapterId ?? null;
  const { session, resource } = useHostDetail(client, urlComicId, showToast);
  const { memberInfos, userInfo } = session;
  const { detail, error, refresh: retryComicDetail } = resource;
  const detailMode = usePreferredDetailMode(search, userInfo.id);
  const selectedComic = detail?.comicInfo ?? null;
  const detailActiveMember = selectedComic ? findComicMember(selectedComic, memberInfos) : null;

  const setComicDetailSearchParams = useComicDetailSearchParams(onChangeSearch, detailMode);
  const { openComicDetail, clearComicDetail } = useComicDetailSearchActions(
    setComicDetailSearchParams,
    userInfo.id,
  );
  const loadAssignableMembers = useAssignableMemberLoader(client, selectedComic);
  const navigateToWorkbench = useWorkbenchNavigator(onNavigateToWorkbench, returnTo, urlComicId);

  return {
    selectedComic,
    selectedComicPinnedChapter: detail?.pinnedChapter ?? null,
    detailActiveMember,
    loadAssignableMembers,
    isDetailOpen: Boolean(urlComicId),
    detailError: error,
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

function useHostDetail(
  client: ReturnType<typeof useApiClient>,
  comicId: string | null,
  showToast: Args["showToast"],
): {
  session: ReturnType<typeof useReadySession>;
  resource: ReturnType<typeof useComicDetailData>;
} {
  const session = useReadySession();
  const teamId = useAppStore((state) => state.selectedTeamId);
  const scope = { userId: session.userInfo.id, generation: session.generation, teamId };
  const resource = useComicDetailData(client, scope, comicId, showToast);
  return { session, resource };
}

function usePreferredDetailMode(search: ComicDetailSearch, userId: string): ComicDetailMode {
  const detailMode = isComicDetailMode(search.detailMode)
    ? search.detailMode
    : readComicDetailMode(userId);
  useEffect(() => {
    if (search.comicId && isComicDetailMode(search.detailMode))
      saveComicDetailMode(userId, search.detailMode);
  }, [search.comicId, search.detailMode, userId]);
  return detailMode;
}

function useComicDetailSearchParams(
  onChangeSearch: Args["onChangeSearch"],
  detailMode: ComicDetailMode,
): Args["onChangeSearch"] {
  return useCallback(
    (comicId: string | null, chapterId: string | null, mode?: ComicDetailMode) => {
      onChangeSearch(
        comicId,
        comicId ? chapterId : null,
        comicId ? (mode ?? detailMode) : undefined,
      );
    },
    [onChangeSearch, detailMode],
  );
}

function useComicDetailSearchActions(
  setSearchParams: ReturnType<typeof useComicDetailSearchParams>,
  userId: string,
): Pick<ComicDetailHostState, "openComicDetail" | "clearComicDetail"> {
  const openComicDetail = useCallback(
    (comicId: string, chapterId?: string | null) => {
      void preloadComicDetail().catch(() => undefined);
      const nextMode = readComicDetailMode(userId);
      setSearchParams(comicId, chapterId ?? null, nextMode);
    },
    [setSearchParams, userId],
  );
  const clearComicDetail = useCallback(() => {
    setSearchParams(null, null);
  }, [setSearchParams]);
  return { openComicDetail, clearComicDetail };
}

function useAssignableMemberLoader(
  client: ReturnType<typeof useApiClient>,
  comic: ComicDetailData["comicInfo"] | null,
): NonNullable<DetailContract["onLoadAssignableMembers"]> {
  return useCallback(
    (_chapterId: string, args: AssignableMemberArgs): Promise<Result<MemberInfo[]>> => {
      if (!comic) return Promise.resolve({ success: false, error: "漫画详情尚未加载完成" });
      return listComicMembers(client, comic, args);
    },
    [client, comic],
  );
}

function useWorkbenchNavigator(
  navigate: Args["onNavigateToWorkbench"],
  returnTo: Args["returnTo"],
  comicId: string | null,
): ComicDetailHostState["navigateToWorkbench"] {
  return useCallback(
    (
      chapterId: string,
      pageId: string,
      isReadOnly?: boolean,
      mode: ComicDetailMode = "translator",
    ): void => {
      if (!comicId) return;
      navigate({
        returnTo,
        comicId,
        chapterId,
        pageId,
        readOnly: mode === "reviewer" || (isReadOnly ?? false),
        mode,
      });
    },
    [navigate, returnTo, comicId],
  );
}
