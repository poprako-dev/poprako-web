import { create } from "zustand/react";
import type { ToastData, ToastType } from "./types";

type ToastStore = {
  toast: ToastData | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,

  showToast: (message, type) => {
    // 先清空再设置，确保连续调用也能触发动画
    set({ toast: null });
    requestAnimationFrame(() => {
      set({ toast: { message, type } });
    });
  },

  hideToast: () => set({ toast: null }),
}));
