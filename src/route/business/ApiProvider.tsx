import type { ReactNode, ReactElement } from "react";
import type { ApiClient } from "@/api/client";
import { ApiContext } from "./api-context";

type Props = { client: ApiClient; children: ReactNode };

export function ApiProvider({ client, children }: Props): ReactElement {
  return <ApiContext value={client}>{children}</ApiContext>;
}
