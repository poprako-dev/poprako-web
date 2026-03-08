import { create } from "zustand/react";
import type { UserInfo } from "../types/user";
import { persist } from "zustand/middleware";

type AppStore = {
  // 未登录时为 null，登录后为用户信息
  currUser: UserInfo | null;
  getCurrUser: () => UserInfo | null;
  setCurrUser: (user: UserInfo | null) => void;

  // access token 同样未登录时为 null，登录后为 token 字符串
  accessToken: string | null;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currUser: null,
      getCurrUser: () => get().currUser,
      setCurrUser: (user) => set({ currUser: user }),
      accessToken: null,
      getAccessToken: () => get().accessToken,
      setAccessToken: (token) => set({ accessToken: token }),
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        currUser: state.currUser,
        accessToken: state.accessToken,
      }),
    },
  ),
);
