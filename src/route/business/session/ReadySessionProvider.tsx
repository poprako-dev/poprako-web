import type { ReactNode } from "react";
import type { ReactElement } from "react";
import { type ReadySession, ReadySessionContext } from "@/route/business/session/ready-session";

type Props = {
  value: ReadySession;
  children: ReactNode;
};

export function ReadySessionProvider({ value, children }: Props): ReactElement {
  return <ReadySessionContext value={value}>{children}</ReadySessionContext>;
}
