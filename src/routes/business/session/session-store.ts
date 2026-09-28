import { create } from "zustand/react";
import { persist } from "zustand/middleware";
import type { LoginState } from "@/routes/business/identity/login-state";

type SessionData = {
  accessToken: string | null;
  loginState: LoginState | null;
  selectedTeamId: string | null;
  generation: number;
};
interface SessionActions {
  getAccessToken(): string | null;
  setAccessToken(token: string | null): void;
  getLoginState(): LoginState | null;
  setLoginState(state: LoginState | null): void;
  getSelectedTeamId(): string | null;
  setSelectedTeamId(teamId: string | null): void;
}

export function persistSessionData(
  state: SessionData & SessionActions,
): Pick<SessionData, "accessToken" | "selectedTeamId"> {
  return { accessToken: state.accessToken, selectedTeamId: state.selectedTeamId };
}

export const useAppStore = create<SessionData & SessionActions>()(
  persist(
    (set, get) => ({
      accessToken: null,
      loginState: null,
      selectedTeamId: null,
      generation: 0,
      getAccessToken: () => get().accessToken,
      setAccessToken: (accessToken) =>
        set((state) => ({
          accessToken,
          loginState: null,
          generation: state.generation + 1,
          selectedTeamId: accessToken === null ? null : state.selectedTeamId,
        })),
      getLoginState: () => get().loginState,
      setLoginState: (loginState) =>
        set((state) => ({
          loginState,
          selectedTeamId: loginState?.memberInfos.some((m) => m.teamId === state.selectedTeamId)
            ? state.selectedTeamId
            : (loginState?.memberInfos[0]?.teamId ?? null),
        })),
      getSelectedTeamId: () => get().selectedTeamId,
      setSelectedTeamId: (teamId) => {
        if (teamId !== null && !get().loginState?.memberInfos.some((m) => m.teamId === teamId)) {
          throw new Error("无法选择不属于当前身份的团队");
        }
        set({ selectedTeamId: teamId });
      },
    }),
    {
      name: "app-store",
      partialize: persistSessionData,
    },
  ),
);
