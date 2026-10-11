import { useCallback, useEffect } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ApiClient } from "@/api/client";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { PageResultsOwner } from "./page-results-owner";
import { fillPageResult } from "./page-results-fill";
import type { PageUploadTaskView } from "./upload/page-upload-store";

type Args = {
  client: ApiClient;
  ownerRef: RefObject<PageResultsOwner>;
  tasks: Map<string, PageUploadTaskView>;
  chapterId: string | null;
  generation: number;
  available: boolean;
  showToast: (message: string, type: ToastType) => void;
  setServerPages: Dispatch<SetStateAction<PageInfo[]>>;
  setPageRecoveryNeeded: Dispatch<SetStateAction<boolean>>;
};

export function usePageResultsFill(
  args: Args,
): (owner: PageResultsOwner, task: PageUploadTaskView) => Promise<void> {
  const fill = useCallback(
    (owner: PageResultsOwner, task: PageUploadTaskView) =>
      fillPageResult({
        client: args.client,
        owner,
        ownerRef: args.ownerRef,
        task,
        showToast: args.showToast,
        setServerPages: args.setServerPages,
        setPageRecoveryNeeded: args.setPageRecoveryNeeded,
      }),
    [args.client, args.ownerRef, args.setPageRecoveryNeeded, args.setServerPages, args.showToast],
  );
  useEffect(() => {
    const owner = args.ownerRef.current;
    if (!owner.chapterId) return;
    for (const task of args.tasks.values()) void fill(owner, task);
  }, [args.tasks, fill, args.chapterId, args.generation, args.available, args.ownerRef]);
  return fill;
}
