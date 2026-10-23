import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { SetStateAction } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "./comic-detail-type";

type AssignmentEntry = { assignments: AssignmentInfo[]; loading: boolean };
type AssignmentSnapshot = ReadonlyMap<string, AssignmentEntry>;
type ShowToast = (message: string, type: ToastType) => void;
type Request = { promise: Promise<AssignmentInfo[] | null>; controller: AbortController };

/** One owner for selected and pinned chapters; consumers never abort shared reads. */
export class AssignmentResources {
  private snapshot: AssignmentSnapshot = new Map();
  private readonly listeners = new Set<() => void>();
  private readonly pending = new Map<string, Request>();
  private readonly seeded = new Map<string, AssignmentInfo[]>();
  private readonly loadAssignments: DetailContract["onLoadAssignments"];
  private readonly showToast: ShowToast;
  private active = false;

  constructor(loadAssignments: DetailContract["onLoadAssignments"], showToast: ShowToast) {
    this.loadAssignments = loadAssignments;
    this.showToast = showToast;
  }

  getSnapshot = (): AssignmentSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  activate(): void {
    this.active = true;
  }

  dispose(): void {
    this.active = false;
    for (const request of this.pending.values()) request.controller.abort();
    this.pending.clear();
    this.seeded.clear();
    this.snapshot = new Map();
  }

  private publish(chapterId: string, entry: AssignmentEntry): void {
    this.snapshot = new Map(this.snapshot).set(chapterId, entry);
    for (const listener of this.listeners) listener();
  }

  retain(chapterIds: string[]): void {
    const keep = new Set(chapterIds);
    this.snapshot = new Map([...this.snapshot].filter(([id]) => keep.has(id)));
    for (const id of this.seeded.keys()) if (!keep.has(id)) this.seeded.delete(id);
    for (const [id, request] of this.pending) {
      if (keep.has(id)) continue;
      this.pending.delete(id);
      request.controller.abort();
    }
  }

  seed(chapterId: string, assignments: AssignmentInfo[]): void {
    if (!this.active || this.seeded.get(chapterId) === assignments) return;
    this.seeded.set(chapterId, assignments);
    const pending = this.pending.get(chapterId);
    this.pending.delete(chapterId);
    pending?.controller.abort();
    this.publish(chapterId, { assignments, loading: false });
  }

  update(chapterId: string, update: SetStateAction<AssignmentInfo[]>): void {
    if (!this.active) return;
    const current = this.snapshot.get(chapterId)?.assignments ?? [];
    const assignments = typeof update === "function" ? update(current) : update;
    this.publish(chapterId, { assignments, loading: false });
  }

  load(chapterId: string, refresh = false): Promise<AssignmentInfo[] | null> {
    if (!this.active) return Promise.resolve(null);
    const current = this.snapshot.get(chapterId);
    const pending = this.pending.get(chapterId);
    if (!refresh && pending) return pending.promise;
    if (!refresh && current && !current.loading) return Promise.resolve(current.assignments);
    const request = {
      promise: Promise.resolve<AssignmentInfo[] | null>(null),
      controller: new AbortController(),
    };
    this.pending.set(chapterId, request);
    pending?.controller.abort();
    this.publish(chapterId, { assignments: current?.assignments ?? [], loading: true });
    request.promise = this.execute(chapterId, request);
    return request.promise;
  }

  private async execute(chapterId: string, request: Request): Promise<AssignmentInfo[] | null> {
    try {
      const result = await this.loadAssignments(chapterId, request.controller.signal);
      if (this.pending.get(chapterId) !== request) return null;
      if (!result.success) {
        showLocalApiFailure(result, this.showToast, "加载分工失败");
        return null;
      }
      this.publish(chapterId, { assignments: result.data, loading: false });
      return result.data;
    } catch (error) {
      if (this.pending.get(chapterId) === request)
        showLocalCaughtError(error, this.showToast, "加载分工失败");
      return null;
    } finally {
      if (this.pending.get(chapterId) === request) this.finish(chapterId);
    }
  }

  private finish(chapterId: string): void {
    this.pending.delete(chapterId);
    const current = this.snapshot.get(chapterId);
    if (!current?.loading) return;
    const snapshot = new Map(this.snapshot);
    snapshot.delete(chapterId);
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
}
