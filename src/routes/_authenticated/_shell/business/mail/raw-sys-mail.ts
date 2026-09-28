import type { SysMailInfo } from "@/routes/_authenticated/_shell/business/mail/sys-mail";

export type RawSysMailVal = {
  id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: number;
};

export function unwrapRawSysMailVal(raw: RawSysMailVal): SysMailInfo {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    isRead: raw.is_read,
    createdAt: raw.created_at,
  };
}
