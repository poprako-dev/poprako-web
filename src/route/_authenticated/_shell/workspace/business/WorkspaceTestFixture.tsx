import type { ReactElement, ReactNode } from "react";
import type { ApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import type { ReadySession } from "@/route/business/session/ready-session";

type Props = { client: ApiClient; session: ReadySession; children: ReactNode };

export function WorkspaceTestProvider({ client, session, children }: Props): ReactElement {
  return (
    <ApiProvider client={client}>
      <ReadySessionProvider value={session}>{children}</ReadySessionProvider>
    </ApiProvider>
  );
}
