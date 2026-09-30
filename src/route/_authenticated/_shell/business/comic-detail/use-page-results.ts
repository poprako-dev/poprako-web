import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiClient } from "@/api/client";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { getPage } from "@/route/_authenticated/business/page/page-request";
import { useAppStore } from "@/route/business/session/session-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { DetailContract } from "./comic-detail-type";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { getPageUploadTaskState, type PageUploadTaskView } from "./upload/page-upload-store";

type Args = {
  client: ApiClient;
  chapterId: string | null;
  available: boolean;
  tasks: Map<string, PageUploadTaskView>;
  onLoadPages: DetailContract["onLoadPages"];
  showToast: (message: string, type: ToastType) => void;
};
type Owner = {
  active: boolean;
  chapterId: string | null;
  generation: number;
  epoch: number;
  listSequence: number;
  revision: number;
  fills: Map<string, { page: PageInfo; revision: number }>;
  pending: Set<string>;
  succeeded: Set<string>;
  failed: Set<string>;
};
function createOwner(chapterId: string | null, generation: number): Owner {
  return {
    active: true,
    chapterId,
    generation,
    epoch: 0,
    listSequence: 0,
    revision: 0,
    fills: new Map(),
    pending: new Set(),
    succeeded: new Set(),
    failed: new Set(),
  };
}
function latestTask(pageId: string, chapterId: string | null): PageUploadTaskView | undefined {
  return Object.values(getPageUploadTaskState().tasks)
    .filter((task) => task.chapterId === chapterId && task.pageId === pageId)
    .at(-1);
}
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
  const ownerRef = useRef<Owner>(createOwner(chapterId, generation));
  const [serverPages, setServerPages] = useState<PageInfo[]>([]);
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [pageRecoveryNeeded, setPageRecoveryNeeded] = useState(false);
  const isCurrent = useCallback(
    (owner: Owner, epoch = owner.epoch) =>
      owner.active &&
      ownerRef.current === owner &&
      owner.epoch === epoch &&
      useAppStore.getState().generation === owner.generation,
    [],
  );

  const load = useCallback(
    async (owner: Owner) => {
      if (!owner.chapterId) return;
      const epoch = owner.epoch;
      const sequence = ++owner.listSequence;
      const revision = owner.revision;
      setIsPagesLoading(true);
      try {
        const res = await onLoadPages(owner.chapterId);
        if (!isCurrent(owner, epoch) || sequence !== owner.listSequence) return;
        if (!res.success) {
          console.error("[ComicDetailModal] 加载页面失败", {
            chapterId: owner.chapterId,
            sequence,
            result: res,
          });
          setPageRecoveryNeeded(true);
          showLocalApiFailure(res, showToast, "加载页面失败");
          return;
        }
        const pages = new Map(res.data.map((page) => [page.id, page]));
        for (const [id, fill] of owner.fills) {
          if (fill.revision > revision) pages.set(id, fill.page);
        }
        setServerPages([...pages.values()]);
        setPageRecoveryNeeded(owner.failed.size > 0);
      } catch (error) {
        if (!isCurrent(owner, epoch) || sequence !== owner.listSequence) return;
        console.error("[ComicDetailModal] 加载页面异常", {
          chapterId: owner.chapterId,
          sequence,
          error,
        });
        setPageRecoveryNeeded(true);
        showLocalCaughtError(error, showToast, "加载页面失败");
      } finally {
        if (isCurrent(owner, epoch) && sequence === owner.listSequence) setIsPagesLoading(false);
      }
    },
    [isCurrent, onLoadPages, showToast],
  );

  useEffect(() => {
    const owner = createOwner(available ? chapterId : null, generation);
    ownerRef.current = owner;
    // eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect
    setServerPages([]);
    setPageRecoveryNeeded(false); // eslint-disable-line @eslint-react/set-state-in-effect
    setIsPagesLoading(false); // eslint-disable-line @eslint-react/set-state-in-effect
    void load(owner);
    return () => {
      owner.active = false;
    };
  }, [available, chapterId, client, generation, load]);

  const fill = useCallback(
    async (owner: Owner, task: PageUploadTaskView) => {
      if (
        !task.pageId ||
        task.status !== "succeeded" ||
        owner.pending.has(task.taskId) ||
        owner.succeeded.has(task.taskId) ||
        owner.failed.has(task.taskId)
      )
        return;
      const pageId = task.pageId;
      const epoch = owner.epoch;
      owner.pending.add(task.taskId);
      try {
        const res = await getPage(client, pageId);
        if (!isCurrent(owner, epoch) || latestTask(pageId, owner.chapterId)?.taskId !== task.taskId)
          return;
        if (!res.success) {
          console.error("[ComicDetailModal] 上传页面回填失败", {
            chapterId: owner.chapterId,
            pageId,
            taskId: task.taskId,
            result: res,
          });
          owner.failed.add(task.taskId);
          setPageRecoveryNeeded(true);
          showLocalApiFailure(res, showToast, "上传后的页面信息加载失败，请重新加载页面");
          return;
        }
        if (res.data.chapterId !== owner.chapterId || res.data.id !== pageId) {
          throw new Error("回填结果不属于当前章节页面");
        }
        owner.succeeded.add(task.taskId);
        owner.fills.set(pageId, { page: res.data, revision: ++owner.revision });
        setServerPages((pages) => {
          if (
            !isCurrent(owner, epoch) ||
            latestTask(pageId, owner.chapterId)?.taskId !== task.taskId
          )
            return pages;
          return [...pages.filter((page) => page.id !== pageId), res.data];
        });
      } catch (error) {
        if (!isCurrent(owner, epoch) || latestTask(pageId, owner.chapterId)?.taskId !== task.taskId)
          return;
        console.error("[ComicDetailModal] 上传页面回填异常", {
          chapterId: owner.chapterId,
          pageId,
          taskId: task.taskId,
          error,
        });
        owner.failed.add(task.taskId);
        setPageRecoveryNeeded(true);
        showLocalCaughtError(error, showToast, "上传后的页面信息加载失败，请重新加载页面");
      } finally {
        owner.pending.delete(task.taskId);
      }
    },
    [client, isCurrent, showToast],
  );
  useEffect(() => {
    const owner = ownerRef.current;
    if (!owner.chapterId) return;
    for (const task of tasks.values()) void fill(owner, task);
  }, [tasks, fill, chapterId, generation, available]);

  const reloadCurrentPages = useCallback(async () => {
    const owner = ownerRef.current;
    if (!isCurrent(owner) || !owner.chapterId) return;
    owner.failed.clear();
    await Promise.all([load(owner), ...[...tasks.values()].map((task) => fill(owner, task))]);
  }, [fill, isCurrent, load, tasks]);
  const capture = useCallback(() => {
    const owner = ownerRef.current;
    const epoch = owner.epoch;
    return () => isCurrent(owner, epoch);
  }, [isCurrent]);
  const captureSession = useCallback(() => {
    const expected = ownerRef.current.generation;
    return () => useAppStore.getState().generation === expected;
  }, []);
  const clear = useCallback(() => {
    const owner = ownerRef.current;
    owner.epoch++;
    owner.fills.clear();
    owner.pending.clear();
    owner.failed.clear();
    owner.succeeded.clear();
    setServerPages([]);
    setIsPagesLoading(false);
    setPageRecoveryNeeded(false);
  }, []);
  return {
    serverPages,
    isPagesLoading,
    pageRecoveryNeeded,
    reloadCurrentPages,
    capture,
    captureSession,
    clear,
  };
}
