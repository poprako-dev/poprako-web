import { afterEach, describe, expect, test } from "vitest";
import { useAppStore } from "@/routes/business/session/session-store";
import { useMailStore } from "@/routes/_authenticated/_shell/business/mail/mail-store";

const mail = {
  id: "mail-1",
  title: "更新",
  content: "内容",
  isRead: false,
  createdAt: 1,
};

describe("system mail cache session boundary", () => {
  afterEach(() => {
    useMailStore.getState().setSysMailCache(null);
    useAppStore.getState().setAccessToken(null);
  });

  test("rejects cache writes from an expired session generation", () => {
    useAppStore.getState().setAccessToken("token-a");
    const generation = useAppStore.getState().generation;
    useMailStore.getState().setSysMailCache({ mails: [mail], hasMore: false }, generation);

    useAppStore.getState().setAccessToken("token-b");
    useMailStore
      .getState()
      .setSysMailCache({ mails: [{ ...mail, id: "stale" }], hasMore: false }, generation);
    expect(useMailStore.getState().sysMailCache).toBeNull();
  });

  test("marks a cached message read without replacing the session cache", () => {
    useAppStore.getState().setAccessToken("token-a");
    useMailStore.getState().setSysMailCache({ mails: [mail], hasMore: true });
    useMailStore.getState().markSysMailCacheRead("mail-1");

    expect(useMailStore.getState().sysMailCache).toEqual({
      mails: [{ ...mail, isRead: true }],
      hasMore: true,
    });
  });
});
