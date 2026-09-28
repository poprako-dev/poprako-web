import { create } from "zustand/react";
import { useAppStore } from "@/routes/business/session/session-store";
import type { SysMailInfo } from "@/routes/_authenticated/_shell/business/mail/sys-mail";

type SysMailCache = { mails: SysMailInfo[]; hasMore: boolean };
type MailData = { sysMailCache: SysMailCache | null; generation: number };
interface MailActions {
  setSysMailCache(cache: SysMailCache | null, generation?: number): void;
  markSysMailCacheRead(mailId: string): void;
}
export const useMailStore = create<MailData & MailActions>((set) => ({
  sysMailCache: null,
  generation: useAppStore.getState().generation,
  setSysMailCache: (sysMailCache, generation = useAppStore.getState().generation) => {
    if (generation !== useAppStore.getState().generation) return;
    set({ sysMailCache, generation });
  },
  markSysMailCacheRead: (mailId) => {
    set((state) => ({
      sysMailCache: state.sysMailCache && {
        ...state.sysMailCache,
        mails: state.sysMailCache.mails.map((mail) =>
          mail.id === mailId ? { ...mail, isRead: true } : mail,
        ),
      },
    }));
  },
}));

/** Subscription belongs to the child module, never to root session code. */
export function subscribeMailSession(): () => void {
  return useAppStore.subscribe((state, previous) => {
    if (state.generation !== previous.generation) {
      useMailStore.setState({
        sysMailCache: null,
        generation: state.generation,
      });
    }
  });
}
const unsubscribe = subscribeMailSession();
if (import.meta.hot) import.meta.hot.dispose(unsubscribe);
