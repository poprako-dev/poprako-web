import type { Dispatch, SetStateAction } from "react";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { DetailContract } from "./comic-detail-type";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { isCurrentPageResultsOwner, type PageResultsOwner } from "./page-results-owner";

type LoadArgs = {
  owner: PageResultsOwner;
  ownerRef: React.RefObject<PageResultsOwner | null>;
  onLoadPages: DetailContract["onLoadPages"];
  showToast: (message: string, type: ToastType) => void;
  setServerPages: Dispatch<SetStateAction<PageInfo[]>>;
  setIsPagesLoading: Dispatch<SetStateAction<boolean>>;
  setPageRecoveryNeeded: Dispatch<SetStateAction<boolean>>;
};

export async function loadPageResults(args: LoadArgs): Promise<void> {
  const { owner, ownerRef, onLoadPages, showToast } = args;
  if (!owner.chapterId) return;
  const epoch = owner.epoch;
  const sequence = ++owner.listSequence;
  const revision = owner.revision;
  args.setIsPagesLoading(true);
  try {
    const result = await onLoadPages(owner.chapterId);
    if (!isCurrentPageResultsOwner(owner, ownerRef, epoch) || sequence !== owner.listSequence)
      return;
    if (!result.success) {
      reportPageListFailure(owner, sequence, result, showToast, args.setPageRecoveryNeeded);
      return;
    }
    const pages = mergePageList(result.data, owner, revision);
    args.setServerPages([...pages.values()]);
    args.setPageRecoveryNeeded(owner.failed.size > 0);
  } catch (error) {
    if (!isCurrentPageResultsOwner(owner, ownerRef, epoch) || sequence !== owner.listSequence)
      return;
    console.error("[ComicDetailModal] 加载页面异常", {
      chapterId: owner.chapterId,
      sequence,
      error,
    });
    args.setPageRecoveryNeeded(true);
    showLocalCaughtError(error, showToast, "加载页面失败");
  } finally {
    if (isCurrentPageResultsOwner(owner, ownerRef, epoch) && sequence === owner.listSequence) {
      args.setIsPagesLoading(false);
    }
  }
}

function mergePageList(
  serverPages: PageInfo[],
  owner: PageResultsOwner,
  revision: number,
): Map<string, PageInfo> {
  const pages = new Map(serverPages.map((page) => [page.id, page]));
  for (const [id, fill] of owner.fills) {
    if (fill.revision > revision) pages.set(id, fill.page);
  }
  return pages;
}

function reportPageListFailure(
  owner: PageResultsOwner,
  sequence: number,
  result: Extract<
    Awaited<ReturnType<NonNullable<DetailContract["onLoadPages"]>>>,
    { success: false }
  >,
  showToast: LoadArgs["showToast"],
  setPageRecoveryNeeded: LoadArgs["setPageRecoveryNeeded"],
): void {
  console.error("[ComicDetailModal] 加载页面失败", {
    chapterId: owner.chapterId,
    sequence,
    result,
  });
  setPageRecoveryNeeded(true);
  showLocalApiFailure(result, showToast, "加载页面失败");
}
