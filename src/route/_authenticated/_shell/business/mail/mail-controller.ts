import type { ApiClient } from "@/api/client";
import { listSysMails, markSysMailRead, type SysMailInfo } from "@/api/system-mail";
import type { Result } from "@/shared/utility/result";
import { canceledMailRequest, MailRequests } from "./mail-requests";
import { initialMailData, isMailFresh, type MailGetter, type MailSetter } from "./mail-state";

export class MailController {
  private readonly requests = new MailRequests();
  private readonly readRevisions = new Map<string, number>();
  private revision = 0;
  private readonly set: MailSetter;
  private readonly get: MailGetter;

  constructor(set: MailSetter, get: MailGetter) {
    this.set = set;
    this.get = get;
  }

  reset(generation: number): void {
    this.requests.reset();
    this.readRevisions.clear();
    this.revision = 0;
    this.set(initialMailData(generation));
  }

  loadUnread(client: ApiClient, force = false): Promise<Result<boolean>> {
    const pending = this.requests.get<boolean>("unread");
    if (pending) return pending;
    const state = this.get();
    if (!force && isMailFresh(state.unreadUpdatedAt)) {
      return Promise.resolve({ success: true, data: state.hasUnread });
    }
    return this.requests.run("unread", async (signal) => {
      const result = await listSysMails(client, 0, 1, false, signal);
      if (signal.aborted) return canceledMailRequest();
      if (!result.success) return result;
      const hasUnread = result.data.length > 0;
      this.set({ hasUnread, unreadUpdatedAt: Date.now() });
      return { success: true, data: hasUnread };
    });
  }

  loadInitial(client: ApiClient, pageSize: number, force = false): Promise<Result<SysMailInfo[]>> {
    const pending = this.requests.get<SysMailInfo[]>("initial");
    if (pending) return pending;
    const current = this.get();
    if (!force && isMailFresh(current.updatedAt)) {
      return Promise.resolve({ success: true, data: current.mails });
    }
    this.requests.cancel("more");
    this.set({
      loadState: current.updatedAt === null ? "loading" : "ready",
      isRefreshing: current.updatedAt !== null,
      loadError: null,
      isLoadingMore: false,
      loadMoreError: null,
    });
    return this.requests.run("initial", (signal) => this.fetchInitial(client, pageSize, signal));
  }

  private async fetchInitial(
    client: ApiClient,
    pageSize: number,
    signal: AbortSignal,
  ): Promise<Result<SysMailInfo[]>> {
    const revision = this.revision;
    const result = await listSysMails(client, 0, pageSize + 1, undefined, signal);
    if (signal.aborted) return canceledMailRequest();
    if (!result.success) {
      this.set({
        loadState: this.get().updatedAt === null ? "error" : "ready",
        isRefreshing: false,
        loadError: result.error,
      });
      return result;
    }
    const mails = this.applyReadChanges(result.data.slice(0, pageSize), revision);
    this.set({
      mails,
      hasMore: result.data.length > pageSize,
      loadState: "ready",
      isRefreshing: false,
      loadError: null,
      updatedAt: Date.now(),
    });
    return { success: true, data: mails };
  }

  loadMore(client: ApiClient, pageSize: number): Promise<Result<SysMailInfo[]>> {
    const pending = this.requests.get<SysMailInfo[]>("more");
    if (pending) return pending;
    const current = this.get();
    if (current.loadState !== "ready" || !current.hasMore || current.isRefreshing) {
      return Promise.resolve({ success: true, data: current.mails });
    }
    this.set({ isLoadingMore: true, loadMoreError: null });
    return this.requests.run("more", (signal) =>
      this.fetchMore(client, pageSize, current.mails.length, signal),
    );
  }

  private async fetchMore(
    client: ApiClient,
    pageSize: number,
    offset: number,
    signal: AbortSignal,
  ): Promise<Result<SysMailInfo[]>> {
    const revision = this.revision;
    const result = await listSysMails(client, offset, pageSize + 1, undefined, signal);
    if (signal.aborted) return canceledMailRequest();
    if (!result.success) {
      this.set({ isLoadingMore: false, loadMoreError: result.error });
      return result;
    }
    const batch = this.applyReadChanges(result.data.slice(0, pageSize), revision);
    const latest = this.get().mails;
    const seen = new Set(latest.map((mail) => mail.id));
    const mails = [...latest, ...batch.filter((mail) => !seen.has(mail.id))];
    this.set({
      mails,
      hasMore: result.data.length > pageSize && mails.length > latest.length,
      isLoadingMore: false,
      loadMoreError: null,
    });
    return { success: true, data: mails };
  }

  markRead(client: ApiClient, mailId: string): Promise<Result<undefined>> {
    if (this.get().mails.some((mail) => mail.id === mailId && mail.isRead)) {
      return Promise.resolve({ success: true, data: undefined });
    }
    return this.requests.run(`read:${mailId}`, async (signal) => {
      const result = await markSysMailRead(client, mailId, signal);
      if (signal.aborted) return canceledMailRequest();
      if (!result.success) return result;
      this.revision += 1;
      this.readRevisions.set(mailId, this.revision);
      this.set({
        mails: this.get().mails.map((mail) =>
          mail.id === mailId ? { ...mail, isRead: true } : mail,
        ),
        unreadUpdatedAt: null,
      });
      this.requests.cancel("unread");
      void this.loadUnread(client, true);
      return result;
    });
  }

  private applyReadChanges(mails: SysMailInfo[], requestRevision: number): SysMailInfo[] {
    return mails.map((mail) =>
      (this.readRevisions.get(mail.id) ?? 0) > requestRevision ? { ...mail, isRead: true } : mail,
    );
  }
}
