import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { SysMailInfo } from "@/types/sysMail";
import {
  unwrapRawSysMailVal,
  type RawSysMailVal,
} from "@/types/raw/sysMail";

export async function listSysMails(
  offset: number = 0,
  limit: number = 10,
  isRead?: boolean,
): Promise<Result<SysMailInfo[]>> {
  const result = await api.get<RawSysMailVal[] | null>("/system-mails", {
    is_read: isRead,
    offset,
    limit,
  });

  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawSysMailVal),
  };
}

export async function markSysMailRead(
  sysMailId: string,
): Promise<Result<void>> {
  const result = await api.post<void, object>(
    "/system-mails/mark-read",
    { ids: [sysMailId] },
  );

  if (!result.success) return result;

  return { success: true, data: undefined };
}
