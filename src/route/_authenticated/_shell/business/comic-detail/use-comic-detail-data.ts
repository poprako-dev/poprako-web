import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiClient } from "@/api/client";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ComicDetailData } from "./detail-request";
import {
  invalidateComicDetails,
  loadCachedComicDetail,
  peekComicDetail,
  subscribeComicDetails,
} from "./comic-detail-cache";
import type { DetailScope } from "./comic-detail-cache";

type Owner = { client: ApiClient; scope: DetailScope; comicId: string | null };
type DetailState = { owner: Owner; data: ComicDetailData | null; error: string | null };
type ShowToast = (message: string, type: ToastType) => void;

export function useComicDetailData(
  client: ApiClient,
  scope: DetailScope,
  comicId: string | null,
  showToast: ShowToast,
): { detail: ComicDetailData | null; error: string | null; refresh: () => void } {
  const { userId, generation, teamId } = scope;
  const owner = useMemo(
    () => ({ client, scope: { userId, generation, teamId }, comicId }),
    [client, userId, generation, teamId, comicId],
  );
  const [state, setState] = useState<DetailState | null>(null);
  const [revision, setRevision] = useState(0);
  const currentOwnerRef = useRef<Owner | null>(null);
  useDetailSubscription(owner, setRevision, setState);
  useEffect(() => {
    currentOwnerRef.current = owner;
    let current = true;
    void loadDetail(owner, showToast, setState, () => current);
    return () => {
      currentOwnerRef.current = null;
      current = false;
    };
  }, [owner, revision, showToast]);
  const refresh = useCallback(() => {
    if (currentOwnerRef.current !== owner || !owner.comicId) return;
    invalidateComicDetails(owner.client, owner.scope, owner.comicId);
  }, [owner]);
  const cached = comicId ? (peekComicDetail(client, scope, comicId) ?? null) : null;
  return {
    detail: state?.owner === owner ? state.data : cached,
    error: state?.owner === owner ? state.error : null,
    refresh,
  };
}

function useDetailSubscription(
  owner: Owner,
  setRevision: React.Dispatch<React.SetStateAction<number>>,
  setState: React.Dispatch<React.SetStateAction<DetailState | null>>,
): void {
  useEffect(() => {
    if (!owner.comicId) return;
    return subscribeComicDetails(owner.client, owner.scope, owner.comicId, (discard) => {
      if (discard) setState({ owner, data: null, error: null });
      setRevision((value) => value + 1);
    });
  }, [owner, setRevision, setState]);
}

async function loadDetail(
  owner: Owner,
  showToast: ShowToast,
  publish: (state: DetailState) => void,
  isCurrent: () => boolean,
): Promise<void> {
  if (!owner.comicId) return;
  const { client, scope, comicId } = owner;
  try {
    const result = await loadCachedComicDetail(client, scope, comicId);
    if (!isCurrent()) return;
    if (result.success) {
      publish({ owner, data: result.data, error: null });
      return;
    }
    publish({ owner, data: peekComicDetail(client, scope, comicId) ?? null, error: result.error });
    showLocalApiFailure(result, showToast, "加载漫画详情失败");
  } catch (error) {
    if (!isCurrent()) return;
    publish({
      owner,
      data: peekComicDetail(client, scope, comicId) ?? null,
      error: "加载漫画详情失败，请重试",
    });
    showLocalCaughtError(error, showToast, "加载漫画详情失败");
  }
}
