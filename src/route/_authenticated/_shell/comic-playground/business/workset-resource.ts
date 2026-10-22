import type { SetStateAction } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useAppStore } from "@/route/business/session/session-store";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { listWorksets } from "./workset/workset-request";
import {
  hasFreshWorksets,
  readWorksetCache,
  selectCachedWorkset,
  subscribeWorksetInvalidation,
  trackWorksetRead,
  writeWorksetCache,
  type WorksetScope,
} from "./workset/workset-cache";

export type WorksetOwner = WorksetScope & { active: boolean };
export type WorksetSnapshot = { worksets: WorksetInfo[]; activeWorksetId: string };
type ShowToast = (message: string, type: ToastType) => void;

export function isWorksetScopeCurrent(scope: WorksetOwner): boolean {
  const state = useAppStore.getState();
  return (
    scope.active && state.generation === scope.generation && state.selectedTeamId === scope.teamId
  );
}

export class WorksetResource {
  readonly owner: WorksetOwner;
  private snapshot: WorksetSnapshot;
  private request: AbortController | null = null;
  private unsubscribe: (() => void) | undefined;
  private readonly listeners = new Set<() => void>();

  constructor(scope: WorksetScope) {
    this.owner = { ...scope, active: false };
    const cached = readWorksetCache(scope);
    this.snapshot = {
      worksets: cached?.worksets ?? [],
      activeWorksetId: cached?.activeWorksetId ?? "",
    };
  }

  readonly getSnapshot = (): WorksetSnapshot => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  activate(showToast: ShowToast): void {
    this.owner.active = true;
    if (!this.owner.teamId || !isWorksetScopeCurrent(this.owner)) return;
    this.unsubscribe = subscribeWorksetInvalidation(this.owner, () => {
      void this.load(showToast);
    });
    if (!hasFreshWorksets(this.owner)) void this.load(showToast);
  }

  dispose(): void {
    this.owner.active = false;
    this.request?.abort();
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  readonly select = (update: SetStateAction<string>): void => {
    if (!isWorksetScopeCurrent(this.owner)) return;
    const previous = this.snapshot.activeWorksetId;
    const activeWorksetId = typeof update === "function" ? update(previous) : update;
    selectCachedWorkset(this.owner, activeWorksetId);
    this.publish({ ...this.snapshot, activeWorksetId });
  };

  async load(showToast: ShowToast): Promise<void> {
    const scope = this.owner;
    if (!scope.teamId || !isWorksetScopeCurrent(scope)) return;
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    const isCacheCurrent = trackWorksetRead(scope);
    const isCurrent = (): boolean =>
      !request.signal.aborted &&
      this.request === request &&
      isWorksetScopeCurrent(scope) &&
      isCacheCurrent();
    try {
      const result = await listWorksets(scope.client, {
        teamId: scope.teamId,
        offset: 0,
        limit: 20,
        signal: request.signal,
      });
      if (!isCurrent()) return;
      if (result.success) this.accept(result.data);
      else {
        console.error("[ComicPlayground] 加载作品集失败:", result.error);
        showLocalApiFailure(result, showToast);
      }
    } catch (error) {
      if (!isCurrent()) return;
      console.error("[ComicPlayground] 加载作品集异常:", error);
      showLocalCaughtError(error, showToast, "加载作品集失败");
    }
  }

  private accept(worksets: WorksetInfo[]): void {
    const selected = this.snapshot.activeWorksetId;
    const activeWorksetId = worksets.some((workset) => workset.id === selected)
      ? selected
      : (worksets[0]?.id ?? "");
    writeWorksetCache(this.owner, worksets, activeWorksetId);
    this.publish({ worksets, activeWorksetId });
  }

  private publish(snapshot: WorksetSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}
