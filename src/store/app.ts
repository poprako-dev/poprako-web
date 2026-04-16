import { create } from "zustand/react";
import { persist } from "zustand/middleware";
import type { LoginState } from "@/types/loginState";

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
