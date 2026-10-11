import { useCallback } from "react";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { useAppStore } from "@/route/business/session/session-store";
import { getPageUploadTaskState, type PageUploadTaskView } from "./upload/page-upload-store";

export type PageResultsOwner = {
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

export function createPageResultsOwner(
  chapterId: string | null,
  generation: number,
): PageResultsOwner {
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

export function isCurrentPageResultsOwner(
  owner: PageResultsOwner,
  ownerRef: React.RefObject<PageResultsOwner | null>,
  epoch = owner.epoch,
): boolean {
  return (
    owner.active &&
    ownerRef.current === owner &&
    owner.epoch === epoch &&
    currentAppGeneration() === owner.generation
  );
}

export function usePageResultsCurrentChecker(
  ownerRef: React.RefObject<PageResultsOwner | null>,
): (owner: PageResultsOwner, epoch?: number) => boolean {
  return useCallback(
    (owner: PageResultsOwner, epoch = owner.epoch) =>
      isCurrentPageResultsOwner(owner, ownerRef, epoch),
    [ownerRef],
  );
}

function currentAppGeneration(): number {
  return useAppStore.getState().generation;
}

export function latestPageUploadTask(
  pageId: string,
  chapterId: string | null,
): PageUploadTaskView | undefined {
  return Object.values(getPageUploadTaskState().tasks)
    .filter((task) => task.chapterId === chapterId && task.pageId === pageId)
    .at(-1);
}
