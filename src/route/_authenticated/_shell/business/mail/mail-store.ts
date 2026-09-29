import { create } from "zustand/react";
import type { ApiClient } from "@/api/client";
import { useAppStore } from "@/route/business/session/session-store";
import type { Result } from "@/shared/utility/result";
import type { SysMailInfo } from "@/api/system-mail";
import { listSysMails, markSysMailRead } from "@/api/system-mail";

type MailLoadState = "idle" | "loading" | "ready" | "error";

type MailData = {
  mails: SysMailInfo[];
  hasMore: boolean;
  loadState: MailLoadState;
  loadError: string | null;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  generation: number;
};

interface MailActions {
  loadInitial: (client: ApiClient, pageSize?: number) => Promise<Result<SysMailInfo[]>>;
  loadMore: (client: ApiClient, pageSize?: number) => Promise<Result<SysMailInfo[]>>;
  markRead: (client: ApiClient, mailId: string) => Promise<Result<undefined>>;
}

function initialMailData(): MailData {
  return {
    mails: [],
    hasMore: true,
    loadState: "idle",
    loadError: null,
    isLoadingMore: false,
    loadMoreError: null,
    generation: useAppStore.getState().generation,
  };
}

export const useMailStore = create<MailData & MailActions>((set, get) => ({
  ...initialMailData(),

  loadInitial: async (client, pageSize = 15) => {
    const generation = useAppStore.getState().generation;
    if (get().generation !== generation) set({ ...initialMailData(), generation });
    const current = get();
    if (current.loadState === "loading") {
      return { success: true, data: current.mails };
    }
    if (current.loadState === "ready") {
      return { success: true, data: current.mails };
    }

    set({ loadState: "loading", loadError: null, isLoadingMore: false, loadMoreError: null });
    const result = await listSysMails(client, 0, pageSize + 1);
    if (generation !== useAppStore.getState().generation) return result;

    if (!result.success) {
      set({ loadState: "error", loadError: result.error });
      return result;
    }

    const mails = result.data.slice(0, pageSize);
    set({
      mails,
      hasMore: result.data.length > pageSize,
      loadState: "ready",
      loadError: null,
      isLoadingMore: false,
      loadMoreError: null,
      generation,
    });
    return { success: true, data: mails };
  },

  loadMore: async (client, pageSize = 15) => {
    const generation = useAppStore.getState().generation;
    const current = get();
    if (
      current.generation !== generation ||
      current.loadState !== "ready" ||
      !current.hasMore ||
      current.isLoadingMore
    ) {
      return { success: true, data: current.mails };
    }

    set({ isLoadingMore: true, loadMoreError: null });
    const result = await listSysMails(client, current.mails.length, pageSize + 1);
    if (generation !== useAppStore.getState().generation) return result;

    if (!result.success) {
      set({ isLoadingMore: false, loadMoreError: result.error });
      return result;
    }

    const batch = result.data.slice(0, pageSize);
    const latestMails = get().mails;
    const seen = new Set(latestMails.map((mail) => mail.id));
    const mails = [...latestMails, ...batch.filter((mail) => !seen.has(mail.id))];
    set({
      mails,
      hasMore: result.data.length > pageSize,
      isLoadingMore: false,
      loadMoreError: null,
    });
    return { success: true, data: mails };
  },

  markRead: async (client, mailId) => {
    const generation = useAppStore.getState().generation;
    const result = await markSysMailRead(client, mailId);
    if (generation !== useAppStore.getState().generation || !result.success) return result;
    set((state) => ({
      mails: state.mails.map((mail) => (mail.id === mailId ? { ...mail, isRead: true } : mail)),
    }));
    return result;
  },
}));

/** Clear request-owned state whenever the authenticated identity changes. */
export function subscribeMailSession(): () => void {
  return useAppStore.subscribe((state, previous) => {
    if (state.generation !== previous.generation) {
      useMailStore.setState({ ...initialMailData(), generation: state.generation });
    }
  });
}

const unsubscribe = subscribeMailSession();
if (import.meta.hot) import.meta.hot.dispose(unsubscribe);
