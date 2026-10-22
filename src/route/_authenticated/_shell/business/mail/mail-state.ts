import type { ApiClient } from "@/api/client";
import type { SysMailInfo } from "@/api/system-mail";
import type { Result } from "@/shared/utility/result";

export const MAIL_STALE_TIME_MS = 60_000;

export type MailData = {
  mails: SysMailInfo[];
  hasMore: boolean;
  hasUnread: boolean;
  updatedAt: number | null;
  unreadUpdatedAt: number | null;
  loadState: "idle" | "loading" | "ready" | "error";
  loadError: string | null;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  generation: number;
};

export interface MailActions {
  loadUnread: (client: ApiClient, force?: boolean) => Promise<Result<boolean>>;
  loadInitial: (
    client: ApiClient,
    pageSize?: number,
    force?: boolean,
  ) => Promise<Result<SysMailInfo[]>>;
  loadMore: (client: ApiClient, pageSize?: number) => Promise<Result<SysMailInfo[]>>;
  markRead: (client: ApiClient, mailId: string) => Promise<Result<undefined>>;
}

export type MailState = MailData & MailActions;
export type MailSetter = (partial: Partial<MailData>) => void;
export type MailGetter = () => MailState;

export function initialMailData(generation: number): MailData {
  return {
    mails: [],
    hasMore: true,
    hasUnread: false,
    updatedAt: null,
    unreadUpdatedAt: null,
    loadState: "idle",
    loadError: null,
    isRefreshing: false,
    isLoadingMore: false,
    loadMoreError: null,
    generation,
  };
}

export function isMailFresh(updatedAt: number | null): boolean {
  return updatedAt !== null && Date.now() - updatedAt < MAIL_STALE_TIME_MS;
}
