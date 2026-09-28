import type { ApiClient } from "@/api/client";
import {
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
import type { Result } from "@/shared/utility/result";
export type SysMailInfo = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: number;
};

function decodeSysMail(value: unknown): SysMailInfo {
  const object = decodeObject(value, "system mail");
  return {
    id: decodeString(object["id"], "system mail.id"),
    title: decodeString(object["title"], "system mail.title"),
    content: decodeString(object["content"], "system mail.content"),
    isRead: decodeBoolean(object["isRead"], "system mail.isRead"),
    createdAt: decodeNumber(object["createdAt"], "system mail.createdAt"),
  };
}

export function listSysMails(
  client: ApiClient,
  offset = 0,
  limit = 10,
  isRead?: boolean,
): Promise<Result<SysMailInfo[]>> {
  return client.get("/system-mails", {
    query: { isRead, offset, limit },
    decode: (value) => decodeArray(value, decodeSysMail, "system mails"),
  });
}

export function markSysMailRead(client: ApiClient, sysMailId: string): Promise<Result<undefined>> {
  return client.post("/system-mails/mark-read", { ids: [sysMailId] }, { decode: decodeVoid });
}
