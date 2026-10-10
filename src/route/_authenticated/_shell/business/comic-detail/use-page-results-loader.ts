import { useCallback, useEffect } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ApiClient } from "@/api/client";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { DetailContract } from "./comic-detail-type";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { createPageResultsOwner, type PageResultsOwner } from "./page-results-owner";
import { loadPageResults } from "./page-results-load";

type Args = {
  ownerRef: RefObject<PageResultsOwner>;
  chapterId: string | null;
  available: boolean;
  generation: number;
  client: ApiClient;
  onLoadPages: DetailContract["onLoadPages"];
  showToast: (message: string, type: ToastType) => void;
  setServerPages: Dispatch<SetStateAction<PageInfo[]>>;
  setIsPagesLoading: Dispatch<SetStateAction<boolean>>;
  setPageRecoveryNeeded: Dispatch<SetStateAction<boolean>>;
};

export function usePageResultsLoader(args: Args): (owner: PageResultsOwner) => Promise<void> {
  const {
    ownerRef,
    onLoadPages,
    showToast,
    setServerPages,
    setIsPagesLoading,
    setPageRecoveryNeeded,
  } = args;
  const load = useCallback(
    (owner: PageResultsOwner) =>
      loadPageResults({
        owner,
        ownerRef,
        onLoadPages,
        showToast,
        setServerPages,
        setIsPagesLoading,
        setPageRecoveryNeeded,
      }),
    [onLoadPages, ownerRef, setIsPagesLoading, setPageRecoveryNeeded, setServerPages, showToast],
  );
  usePageResultsOwnerLifecycle(args, load);
  return load;
}

function usePageResultsOwnerLifecycle(
  {
    ownerRef,
    chapterId,
    available,
    generation,
    client,
    setServerPages,
    setPageRecoveryNeeded,
    setIsPagesLoading,
  }: Args,
  load: (owner: PageResultsOwner) => Promise<void>,
): void {
  useEffect(() => {
    const owner = createPageResultsOwner(available ? chapterId : null, generation);
    const ownerStateRef = ownerRef;
    ownerStateRef.current = owner;
    setServerPages([]);
    setPageRecoveryNeeded(false);
    setIsPagesLoading(false);
    void load(owner);
    return () => {
      owner.active = false;
    };
  }, [
    available,
    chapterId,
    client,
    generation,
    ownerRef,
    setIsPagesLoading,
    setPageRecoveryNeeded,
    setServerPages,
    load,
  ]);
}
