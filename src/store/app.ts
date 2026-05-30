import { create } from "zustand/react";
import { persist } from "zustand/middleware";
import type { LoginState } from "@/types/loginState";
import type { SysMailInfo } from "@/types/sysMail";

export type SysMailCache = {
  mails: SysMailInfo[];
  hasMore: boolean;
};

type AppStore = {
  accessToken: string | null;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  loginState: LoginState | null;
  getLoginState: () => LoginState | null;
  setLoginState: (info: LoginState | null) => void;
  selectedTeamId: string | null;
  getSelectedTeamId: () => string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  sysMailCache: SysMailCache | null;
  setSysMailCache: (cache: SysMailCache | null) => void;
  markSysMailCacheRead: (mailId: string) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      getAccessToken: () => get().accessToken,
      setAccessToken: (token) => set({ accessToken: token }),
      loginState: null,
      getLoginState: () => get().loginState,
      setLoginState: (state) =>
        set((curr) => ({
          loginState: state,
          selectedTeamId: state
            ? state.memberInfos.some((m) => m.teamId === curr.selectedTeamId)
              ? curr.selectedTeamId
              : state.memberInfos[0]?.teamId ?? null
            : null,
        })),
      selectedTeamId: null,
      getSelectedTeamId: () => get().selectedTeamId,
      setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),
      sysMailCache: null,
      setSysMailCache: (cache) => set({ sysMailCache: cache }),
      markSysMailCacheRead: (mailId) =>
        set((curr) => {
          if (!curr.sysMailCache) return curr;
          return {
            sysMailCache: {
              ...curr.sysMailCache,
              mails: curr.sysMailCache.mails.map((m) =>
                m.id === mailId ? { ...m, read: true } : m,
              ),
            },
          };
        }),
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
        selectedTeamId: state.selectedTeamId,
      }),
    },
  ),
);
