import { useEffect } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { useMailStore } from "./mail-store";

export function useMailRefresh(scope: "unread" | "mailbox", pageSize = 15): void {
  const client = useApiClient();
  const generation = useAppStore((state) => state.generation);
  useEffect(() => {
    const refresh = (): void => {
      if (document.visibilityState === "hidden" || !useAppStore.getState().accessToken) return;
      const store = useMailStore.getState();
      if (scope === "unread") void store.loadUnread(client);
      else void store.loadInitial(client, pageSize);
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [client, generation, pageSize, scope]);
}
