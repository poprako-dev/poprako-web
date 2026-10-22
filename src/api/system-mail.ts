import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";
export type SysMailInfo = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: number;
};

export function listSysMails(
  client: ApiClient,
  offset = 0,
  limit = 10,
  isRead?: boolean,
): Promise<Result<SysMailInfo[]>> {
  return client.get<SysMailInfo[]>("/system-mails", {
    query: { isRead, offset, limit },
  });
}

export function markSysMailRead(client: ApiClient, sysMailId: string): Promise<Result<undefined>> {
  return client.post<undefined>("/system-mails/mark-read", { ids: [sysMailId] });
}
