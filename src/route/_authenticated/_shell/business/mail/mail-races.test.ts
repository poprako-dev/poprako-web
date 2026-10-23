import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { requestAddress } from "@/test-resource/api-client";
import { useAppStore } from "@/route/business/session/session-store";
import { useMailStore } from "./mail-store";
import { mail, mailResponse, makeMailClient, pendingMailResponse } from "./mail-test-fixture";

beforeEach(() => {
  useAppStore.getState().setAccessToken("mail-race-session");
});

afterEach(() => {
  useAppStore.getState().setAccessToken(null);
});

test("deduplicates pagination and preserves a read mutation while the page is pending", async () => {
  const page = pendingMailResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail, { ...mail, id: "mail-2" }]))
    .mockReturnValueOnce(page.promise)
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(mailResponse([{ ...mail, id: "mail-2" }]));
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadInitial(client, 1);
  const first = useMailStore.getState().loadMore(client, 2);
  expect(useMailStore.getState().loadMore(client, 2)).toBe(first);
  await useMailStore.getState().markRead(client, mail.id);
  await useMailStore.getState().loadUnread(client);
  page.finish(mailResponse([mail, { ...mail, id: "mail-2" }]));
  expect(await first).toMatchObject({
    success: true,
    data: [
      { id: "mail-1", isRead: true },
      { id: "mail-2", isRead: false },
    ],
  });
  expect(requestAddress(fetchImpl.mock.calls[1]?.[0])).toContain("offset=1&limit=3");
  expect(useMailStore.getState()).toMatchObject({ hasMore: false, isLoadingMore: false });
  expect(await useMailStore.getState().loadInitial(client, 1)).toEqual(await first);
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});

test("an earlier unread request cannot restore the badge after a successful mark-read", async () => {
  const oldUnread = pendingMailResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(oldUnread.promise)
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(mailResponse([]));
  const client = makeMailClient(fetchImpl);
  const oldRequest = useMailStore.getState().loadUnread(client);
  await useMailStore.getState().loadInitial(client);
  const mutation = useMailStore.getState().markRead(client, mail.id);
  expect(useMailStore.getState().markRead(client, mail.id)).toBe(mutation);
  await mutation;
  await useMailStore.getState().loadUnread(client);
  expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  oldUnread.finish(mailResponse([mail]));
  expect(await oldRequest).toMatchObject({ success: false, failureKind: "aborted" });
  expect(useMailStore.getState()).toMatchObject({
    hasUnread: false,
    mails: [{ id: "mail-1", isRead: true }],
  });
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});

test("a first-page response started before mark-read preserves the new read state", async () => {
  const page = pendingMailResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(page.promise)
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(mailResponse([]));
  const client = makeMailClient(fetchImpl);
  const first = useMailStore.getState().loadInitial(client);
  await useMailStore.getState().markRead(client, mail.id);
  await useMailStore.getState().loadUnread(client);
  page.finish(mailResponse([mail]));
  await first;
  expect(useMailStore.getState()).toMatchObject({
    hasUnread: false,
    mails: [{ id: "mail-1", isRead: true }],
  });
});

test("identity changes cancel both unread and page reads without affecting the new session", async () => {
  const oldUnread = pendingMailResponse();
  const oldPage = pendingMailResponse();
  const newUnread = pendingMailResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(oldUnread.promise)
    .mockReturnValueOnce(oldPage.promise)
    .mockReturnValueOnce(newUnread.promise)
    .mockResolvedValueOnce(mailResponse([{ ...mail, id: "new-session-mail" }]));
  const client = makeMailClient(fetchImpl);
  const firstUnread = useMailStore.getState().loadUnread(client);
  const firstPage = useMailStore.getState().loadInitial(client);
  useAppStore.getState().setAccessToken("another-session");
  const currentUnread = useMailStore.getState().loadUnread(client);
  await useMailStore.getState().loadInitial(client);
  expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  expect(fetchImpl.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
  oldUnread.finish(mailResponse([mail]));
  oldPage.finish(mailResponse([mail]));
  await Promise.all([firstUnread, firstPage]);
  expect(useMailStore.getState().loadUnread(client)).toBe(currentUnread);
  newUnread.finish(mailResponse([]));
  await currentUnread;
  expect(useMailStore.getState()).toMatchObject({
    mails: [{ id: "new-session-mail" }],
    hasUnread: false,
    generation: useAppStore.getState().generation,
  });
  expect(fetchImpl).toHaveBeenCalledTimes(4);
});

test("a late mutation from a previous identity cannot start another unread query", async () => {
  const mutation = pendingMailResponse();
  const fetchImpl = vi.fn<typeof fetch>().mockReturnValueOnce(mutation.promise);
  const client = makeMailClient(fetchImpl);
  const pending = useMailStore.getState().markRead(client, mail.id);
  useAppStore.getState().setAccessToken("another-session");
  mutation.finish(new Response(null, { status: 204 }));
  expect(await pending).toMatchObject({ success: false, failureKind: "aborted" });
  expect(useMailStore.getState()).toMatchObject({ mails: [], hasUnread: false, loadState: "idle" });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test("refreshing the head rejects an older pending page", async () => {
  const olderPage = pendingMailResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail, { ...mail, id: "mail-2" }]))
    .mockReturnValueOnce(olderPage.promise)
    .mockResolvedValueOnce(mailResponse([{ ...mail, id: "new-mail" }]));
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadInitial(client, 1);
  const pagination = useMailStore.getState().loadMore(client, 1);
  await useMailStore.getState().loadInitial(client, 1, true);
  olderPage.finish(mailResponse([{ ...mail, id: "mail-2" }]));
  expect(await pagination).toMatchObject({ success: false, failureKind: "aborted" });
  expect(useMailStore.getState()).toMatchObject({
    mails: [{ id: "new-mail" }],
    hasMore: false,
    isLoadingMore: false,
  });
});

test("failed mark-read leaves the mailbox and unread indicator unchanged", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(mailResponse([mail]))
    .mockResolvedValueOnce(Response.json({ code: 503, message: "暂不可用" }, { status: 503 }));
  const client = makeMailClient(fetchImpl);
  await useMailStore.getState().loadUnread(client);
  await useMailStore.getState().loadInitial(client);
  expect((await useMailStore.getState().markRead(client, mail.id)).success).toBe(false);
  expect(useMailStore.getState()).toMatchObject({
    hasUnread: true,
    mails: [{ id: "mail-1", isRead: false }],
  });
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
