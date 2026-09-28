import { api } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";
import type { SysMailInfo } from "@/routes/_authenticated/_shell/business/mail/sys-mail";
import {
  type RawSysMailVal,
  unwrapRawSysMailVal,
} from "@/routes/_authenticated/_shell/business/mail/raw-sys-mail";

export async function listSysMails(
  offset = 0,
  limit = 10,
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
    data: result.data?.map((item) => unwrapRawSysMailVal(item)) ?? [],
  };
}

export async function markSysMailRead(sysMailId: string): Promise<Result<undefined>> {
  const result = await api.post<undefined, object>("/system-mails/mark-read", { ids: [sysMailId] });

  if (!result.success) return result;

  return { success: true, data: undefined };
}
