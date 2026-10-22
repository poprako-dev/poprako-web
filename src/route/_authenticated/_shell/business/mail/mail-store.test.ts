import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { requestAddress } from "@/test-resource/api-client";
import { useAppStore } from "@/route/business/session/session-store";
import { useMailStore } from "./mail-store";
import { MAIL_STALE_TIME_MS } from "./mail-state";
import { mail, mailResponse, makeMailClient, pendingMailResponse } from "./mail-test-fixture";

beforeEach(() => {
  useAppStore.getState().setAccessToken("mail-session");
});

afterEach(() => {
  useAppStore.getState().setAccessToken(null);
  vi.restoreAllMocks();
});

test("shares one pending unread existence query without loading the mailbox", async () => {
  const response = pendingMailResponse();
  const fetchImpl = vi.fn<typeof fetch>().mockReturnValue(response.promise);
  const client = makeMailClient(fetchImpl);
  const first = useMailStore.getState().loadUnread(client);
  const second = useMailStore.getState().loadUnread(client);
  expect(second).toBe(first);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(requestAddress(fetchImpl.mock.calls[0]?.[0])).toBe(
    "https://example.test/api/v1/system-mails?is_read=false&offset=0&limit=1",
  );
  response.finish(mailResponse([mail]));
  expect(await first).toEqual({ success: true, data: true });
  expect(useMailStore.getState()).toMatchObject({ mails: [], hasUnread: true, loadState: "idle" });
});

test("loads the full first page only on mailbox entry and reuses it on return", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(
      mailResponse([
        { ...mail, is_read: true },
        { ...mail, id: "mail-2" },
      ]),
    );
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadUnread(client);
  expect(useMailStore.getState().mails).toEqual([]);
  await useMailStore.getState().loadInitial(client, 1);
  await useMailStore.getState().loadInitial(client, 1);
  await useMailStore.getState().loadUnread(client);
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  expect(requestAddress(fetchImpl.mock.calls[1]?.[0])).toBe(
    "https://example.test/api/v1/system-mails?offset=0&limit=2",
  );
  expect(useMailStore.getState()).toMatchObject({
    mails: [{ id: "mail-1", isRead: true }],
    hasMore: true,
    hasUnread: true,
  });
});

test("shares the actual first-page result with every pending caller", async () => {
  const response = pendingMailResponse();
  const fetchImpl = vi.fn<typeof fetch>().mockReturnValue(response.promise);
  const client = makeMailClient(fetchImpl);
  const first = useMailStore.getState().loadInitial(client);
  const second = useMailStore.getState().loadInitial(client);
  expect(second).toBe(first);
  response.finish(mailResponse([mail]));
  expect(await second).toMatchObject({ success: true, data: [{ id: "mail-1" }] });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test("keeps the old page visible during a stale refresh and loads new mail", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const refresh = pendingMailResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockReturnValueOnce(refresh.promise);
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadInitial(client);
  clock.mockReturnValue(1_000 + MAIL_STALE_TIME_MS);
  const pending = useMailStore.getState().loadInitial(client);
  expect(useMailStore.getState()).toMatchObject({
    loadState: "ready",
    isRefreshing: true,
    mails: [{ id: "mail-1" }],
  });
  refresh.finish(mailResponse([{ ...mail, id: "new-mail" }, mail]));
  await pending;
  expect(useMailStore.getState()).toMatchObject({
    isRefreshing: false,
    mails: [{ id: "new-mail" }, { id: "mail-1" }],
  });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("keeps first-page errors distinct from an empty mailbox and allows retry", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json({ code: 503, message: "邮件服务暂不可用" }, { status: 503 }),
    )
    .mockResolvedValueOnce(mailResponse([]));
  const client = makeMailClient(fetchImpl);
  expect((await useMailStore.getState().loadInitial(client)).success).toBe(false);
  expect(useMailStore.getState()).toMatchObject({
    loadState: "error",
    loadError: "邮件服务暂不可用",
    mails: [],
  });
  await useMailStore.getState().loadInitial(client);
  expect(useMailStore.getState()).toMatchObject({
    loadState: "ready",
    loadError: null,
    mails: [],
    hasMore: false,
  });
});

test("retains loaded mail when a background refresh fails", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(Response.json({ code: 503, message: "暂不可用" }, { status: 503 }));
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadInitial(client);
  const result = await useMailStore.getState().loadInitial(client, 15, true);
  expect(result.success).toBe(false);
  expect(useMailStore.getState()).toMatchObject({
    loadState: "ready",
    isRefreshing: false,
    loadError: "暂不可用",
    mails: [{ id: "mail-1" }],
  });
});

test("refreshes unread existence after its freshness window", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(1_000);
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([]))
    .mockResolvedValueOnce(mailResponse([mail]));
  const client = makeMailClient(fetchImpl);
  expect(await useMailStore.getState().loadUnread(client)).toEqual({ success: true, data: false });
  clock.mockReturnValue(1_000 + MAIL_STALE_TIME_MS - 1);
  await useMailStore.getState().loadUnread(client);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  clock.mockReturnValue(1_000 + MAIL_STALE_TIME_MS);
  expect(await useMailStore.getState().loadUnread(client)).toEqual({ success: true, data: true });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test("does not erase a known unread badge when its refresh fails", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(Response.json({ code: 503, message: "暂不可用" }, { status: 503 }));
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadUnread(client);
  expect((await useMailStore.getState().loadUnread(client, true)).success).toBe(false);
  expect(useMailStore.getState().hasUnread).toBe(true);
});

test("marking the last visible unread mail rechecks for unread mail on later pages", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(mailResponse([mail, { ...mail, id: "older" }]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(mailResponse([{ ...mail, id: "older" }]));
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadUnread(client);
  await useMailStore.getState().loadInitial(client, 1);
  await useMailStore.getState().markRead(client, mail.id);
  await useMailStore.getState().loadUnread(client);
  expect(useMailStore.getState()).toMatchObject({
    hasUnread: true,
    mails: [{ id: "mail-1", isRead: true }],
  });
  expect(requestAddress(fetchImpl.mock.calls[3]?.[0])).toContain("is_read=false&offset=0&limit=1");
  await useMailStore.getState().markRead(client, mail.id);
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});
