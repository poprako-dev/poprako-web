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
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      getAccessToken: () => get().accessToken,
      setAccessToken: (token) => set({ accessToken: token }),
      loginState: null,
      getLoginState: () => get().loginState,
      setLoginState: (state) => set({ loginState: state }),
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    },
  ),
);
