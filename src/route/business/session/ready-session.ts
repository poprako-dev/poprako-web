import type { LoginState } from "@/route/business/identity/login-state";
import { createContext, use } from "react";

export type ReadySession = LoginState & { generation: number };

export const ReadySessionContext = createContext<ReadySession | null>(null);

export function useReadySession(): ReadySession {
  const session = use(ReadySessionContext);
  if (!session) {
    throw new Error("Ready session is only available inside authenticated routes");
  }
  return session;
}
