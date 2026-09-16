import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showLocalApiFailure, showLocalCaughtError } from "@/api/util";
import { useAppStore } from "@/store/app";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { MemberInfo } from "@/types/member";
import type { Result } from "@/types/utils/result";
import {
  findComicMember,
  listComicMembers,
  loadComicDetail,
  type AssignableMemberArgs,
  type ComicDetailData,
} from "../api/detail";

interface Args {
  returnTo: string;
  showToast: (message: string, type: ToastType) => void;
}

interface LoadedDetail { comicId: string; result: Result<ComicDetailData> }

export function useComicDetailHost({ returnTo, showToast }: Args) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadedDetail, setLoadedDetail] = useState<LoadedDetail | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const memberInfos = useAppStore((s) => s.loginState?.memberInfos);
  const urlComicId = searchParams.get("comicId");
  const urlChapterId = searchParams.get("chapterId");
  const result = loadedDetail?.comicId === urlComicId ? loadedDetail.result : undefined;
  const detail = result?.success ? result.data : null;
  const selectedComic = detail?.comicInfo ?? null;
  const detailActiveMember = selectedComic
    ? findComicMember(selectedComic, memberInfos ?? [])
    : null;

  const setComicDetailSearchParams = useCallback(
    (comicId: string | null, chapterId: string | null) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (comicId) {next.set("comicId", comicId);}
        else {next.delete("comicId");}
        if (comicId && chapterId) {next.set("chapterId", chapterId);}
        else {next.delete("chapterId");}
        return next;
      }, { replace: true });
    },
    [setSearchParams],
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
    if (!urlComicId) {return;}
    let isCancelled = false;

    const loadDetail = async () => {
      try {
        const nextResult = await loadComicDetail(urlComicId);
        if (isCancelled) {return;}
        setLoadedDetail({ comicId: urlComicId, result: nextResult });
        if (!nextResult.success) {
          // eslint-disable-next-line no-console
          console.error("[ComicDetail] 加载详情失败:", nextResult.error);
          showLocalApiFailure(nextResult, showToast);
        }
      } catch (error) {
        if (isCancelled) {return;}
        console.error("[ComicDetail] 加载详情异常:", error); // eslint-disable-line no-console
        setLoadedDetail({
          comicId: urlComicId,
          result: { success: false, error: "加载漫画详情失败，请重试" },
        });
        showLocalCaughtError(error, showToast, "加载漫画详情失败");
      }
    };
    void loadDetail();
    return () => { isCancelled = true; };
  }, [loadRevision, showToast, urlComicId]);

  const loadAssignableMembers = useCallback(
    (_chapterId: string, args: AssignableMemberArgs): Promise<Result<MemberInfo[]>> => {
      if (!selectedComic) {
        return Promise.resolve({ success: false, error: "漫画详情尚未加载完成" });
      }
      return listComicMembers(selectedComic, args);
    },
    [selectedComic],
  );

  const navigateToTranslator = useCallback(
    (chapterId: string, pageId: string, isReadOnly?: boolean) => {
      if (!urlComicId) {return;}
      const nextSearchParams = new URLSearchParams({
        returnTo,
        comicId: urlComicId,
        chapterId,
      });
      if (isReadOnly) {nextSearchParams.set("readOnly", "true");}
      void navigate({
        pathname: `/translator/${chapterId}/${pageId}`,
        search: `?${nextSearchParams.toString()}`,
      });
    },
    [navigate, returnTo, urlComicId],
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
