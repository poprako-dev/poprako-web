import { create } from "zustand/react";
import { useAppStore } from "@/route/business/session/session-store";
import { MailController } from "./mail-controller";
import { initialMailData, type MailState } from "./mail-state";

let controller: MailController;

export const useMailStore = create<MailState>((set, get) => {
  controller = new MailController(set, get);
  return {
    ...initialMailData(useAppStore.getState().generation),
    loadUnread: (client, force = false) => controller.loadUnread(client, force),
    loadInitial: (client, pageSize = 15, force = false) =>
      controller.loadInitial(client, pageSize, force),
    loadMore: (client, pageSize = 15) => controller.loadMore(client, pageSize),
    markRead: (client, mailId) => controller.markRead(client, mailId),
  };
});

/** Clear request-owned state whenever the authenticated identity changes. */
export function subscribeMailSession(): () => void {
  return useAppStore.subscribe((state, previous) => {
    if (state.generation !== previous.generation) controller.reset(state.generation);
  });
}

const unsubscribe = subscribeMailSession();
if (import.meta.hot) import.meta.hot.dispose(unsubscribe);
