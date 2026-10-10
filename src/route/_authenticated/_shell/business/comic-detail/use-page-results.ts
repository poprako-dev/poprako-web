import { useCallback, useRef, useState } from "react";
import type { ApiClient } from "@/api/client";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { useAppStore } from "@/route/business/session/session-store";
import type { DetailContract } from "./comic-detail-type";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { PageUploadTaskView } from "./upload/page-upload-store";
import {
  createPageResultsOwner,
  type PageResultsOwner,
  usePageResultsCurrentChecker,
} from "./page-results-owner";
import { usePageResultsLoader } from "./use-page-results-loader";
import { usePageResultsFill } from "./use-page-results-fill";
import { usePageResultsControls } from "./use-page-results-controls";

type Args = {
  client: ApiClient;
  chapterId: string | null;
  available: boolean;
  tasks: Map<string, PageUploadTaskView>;
  onLoadPages: DetailContract["onLoadPages"];
  showToast: (message: string, type: ToastType) => void;
};

type PageResults = {
  serverPages: PageInfo[];
  isPagesLoading: boolean;
  pageRecoveryNeeded: boolean;
  reloadCurrentPages: () => Promise<void>;
  capture: () => () => boolean;
  captureSession: () => () => boolean;
  clear: () => void;
};

export function usePageResults({
  client,
  chapterId,
  available,
  tasks,
  onLoadPages,
  showToast,
}: Args): PageResults {
  const generation = useAppStore((state) => state.generation);
  const ownerRef = useRef<PageResultsOwner>(createPageResultsOwner(chapterId, generation));
  const [serverPages, setServerPages] = useState<PageInfo[]>([]);
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [pageRecoveryNeeded, setPageRecoveryNeeded] = useState(false);
  const isCurrent = usePageResultsCurrentChecker(ownerRef);
  const load = usePageResultsLoader({
    ownerRef,
    chapterId,
    available,
    generation,
    client,
    onLoadPages,
    showToast,
    setServerPages,
    setIsPagesLoading,
    setPageRecoveryNeeded,
  });
  const fill = usePageResultsFill({
    client,
    ownerRef,
    tasks,
    chapterId,
    generation,
    available,
    showToast,
    setServerPages,
    setPageRecoveryNeeded,
  });
  const fillTasks = useFillCurrentTasks(ownerRef, tasks, fill);
  const controls = usePageResultsControls({
    ownerRef,
    isCurrent,
    load,
    fillTasks,
    setServerPages,
    setIsPagesLoading,
    setPageRecoveryNeeded,
  });
  return { serverPages, isPagesLoading, pageRecoveryNeeded, ...controls };
}

function useFillCurrentTasks(
  ownerRef: React.RefObject<PageResultsOwner>,
  tasks: Map<string, PageUploadTaskView>,
  fill: (owner: PageResultsOwner, task: PageUploadTaskView) => Promise<void>,
): () => Promise<void> {
  return useCallback(async () => {
    const owner = ownerRef.current;
    await Promise.all([...tasks.values()].map((task) => fill(owner, task)));
  }, [fill, ownerRef, tasks]);
}
