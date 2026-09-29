import { create } from "zustand/react";
import type {
  ToastData,
  ToastType,
} from "@/shared/component/notification-toast/notification-toast-type";

type ToastStore = {
  toast: ToastData | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,

  showToast: (message, type) => {
    set({ toast: null });
    const schedule =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => {
            callback(0);
            return 0;
          };
    schedule(() => {
      set({ toast: { message, type } });
    });
  },

  hideToast: () => {
    set({ toast: null });
  },
}));
