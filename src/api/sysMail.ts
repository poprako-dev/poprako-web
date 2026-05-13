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
): Promise<Result<SysMailInfo[]>> {
  const result = await api.get<RawSysMailVal[] | null>("/sys-mails", {
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
    `/sys-mails/${sysMailId}/read`,
    {},
  );

  if (!result.success) return result;

  return { success: true, data: undefined };
}
