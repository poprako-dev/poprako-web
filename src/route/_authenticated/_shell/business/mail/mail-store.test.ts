import { requestAddress } from "@/test-resource/api-client";
import { describe, afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { useAppStore } from "@/route/business/session/session-store";
import { useMailStore } from "@/route/_authenticated/_shell/business/mail/mail-store";

function mailResponse(mails: unknown[]): Response {
  return Response.json({ code: 0, data: mails });
}

function makeClient(fetchImpl: typeof fetch): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "https://example.test/api/v1",
    getAccessToken: () => useAppStore.getState().getAccessToken(),
    fetchImpl,
  });
}

const mail = {
  id: "mail-1",
  title: "更新",
  content: "内容",
  is_read: false,
  created_at: 1,
};

describe("system mail state and session boundary", () => {
  afterEach(() => {
    useAppStore.getState().setAccessToken(null);
  });
  test("loads pages and read state through one store controller", async () => {
    useAppStore.getState().setAccessToken("token-a");
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(mailResponse([mail, { ...mail, id: "mail-2" }]))
      .mockResolvedValueOnce(mailResponse([{ ...mail, id: "mail-2" }]))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = makeClient(fetchImpl);

    const firstPage = await useMailStore.getState().loadInitial(client, 1);
    expect(firstPage.success).toBe(true);
    expect(useMailStore.getState()).toMatchObject({
      mails: [{ id: "mail-1", isRead: false }],
      hasMore: true,
      loadState: "ready",
    });

    const nextPage = await useMailStore.getState().loadMore(client, 1);
    expect(nextPage.success).toBe(true);
    expect(useMailStore.getState().mails.map((item) => item.id)).toEqual(["mail-1", "mail-2"]);
    expect(new URL(requestAddress(fetchImpl.mock.calls[1]?.[0])).searchParams.get("offset")).toBe(
      "1",
    );

    const markReadResult = await useMailStore.getState().markRead(client, "mail-1");
    expect(markReadResult.success).toBe(true);
    expect(useMailStore.getState().mails[0]?.isRead).toBe(true);
  });
});

describe("system mail state and session boundary", () => {
  afterEach(() => {
    useAppStore.getState().setAccessToken(null);
  });
  test("keeps failed loading distinct from an empty mailbox and supports retry", async () => {
    useAppStore.getState().setAccessToken("token-a");
    const client = makeClient(
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({ code: 0, data: null }))
        .mockResolvedValueOnce(mailResponse([])),
    );

    const failed = await useMailStore.getState().loadInitial(client, 15);
    expect(failed.success).toBe(false);
    expect(useMailStore.getState()).toMatchObject({
      loadState: "error",
      loadError: expect.any(String) as unknown,
      mails: [],
    });

    const retried = await useMailStore.getState().loadInitial(client, 15);
    expect(retried.success).toBe(true);
    expect(useMailStore.getState()).toMatchObject({
      loadState: "ready",
      loadError: null,
      mails: [],
      hasMore: false,
    });
  });
});

describe("system mail state and session boundary", () => {
  afterEach(() => {
    useAppStore.getState().setAccessToken(null);
  });
  test("rejects late API completion from the previous login generation", async () => {
    useAppStore.getState().setAccessToken("token-a");
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchImpl = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const request = useMailStore.getState().loadInitial(makeClient(fetchImpl), 15);

    useAppStore.getState().setAccessToken("token-b");
    resolveResponse?.(mailResponse([mail]));
    await request;

    expect(useMailStore.getState()).toMatchObject({
      mails: [],
      loadState: "idle",
      generation: useAppStore.getState().generation,
    });
  });
});
test("pagination preserves a read mutation completed while the next page was pending", async () => {
  useAppStore.getState().setAccessToken("pagination-read-race");
  let finishPage: (response: Response) => void = () => {
    throw new Error("Pagination request has not started");
  };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(mailResponse([mail, { ...mail, id: "mail-2" }]))
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishPage = resolve;
        }),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const client = makeClient(fetchImpl);
  try {
    await useMailStore.getState().loadInitial(client, 1);
    const pendingPage = useMailStore.getState().loadMore(client, 2);
    expect(await useMailStore.getState().markRead(client, mail.id)).toEqual({
      success: true,
      data: undefined,
    });
    expect(useMailStore.getState().mails[0]?.isRead).toBe(true);
    finishPage(mailResponse([mail, { ...mail, id: "mail-2" }]));
    const result = await pendingPage;
    expect(result).toMatchObject({
      success: true,
      data: [
        { id: "mail-1", isRead: true },
        { id: "mail-2", isRead: false },
      ],
    });
    expect(useMailStore.getState().mails).toMatchObject([
      { id: "mail-1", isRead: true },
      { id: "mail-2", isRead: false },
    ]);
    const preserved = await useMailStore.getState().loadInitial(client, 1);
    expect(preserved).toEqual(result);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  } finally {
    useAppStore.getState().setAccessToken(null);
  }
});
