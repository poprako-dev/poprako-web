import { afterEach, expect, test, vi } from "vitest";
import { createApiClient, type ApiClient } from "@/api/client";
import { listComics } from "@/route/_authenticated/business/comic/comic-request";
import { listMembers } from "@/route/business/identity/member-request";
import { getUser } from "@/route/business/identity/user-request";
import { listMyMembers, listOnlineUserIds } from "@/api/identity/identity-api";

afterEach(() => vi.restoreAllMocks());

const readers: [string, (client: ApiClient, signal: AbortSignal) => Promise<unknown>][] = [
  [
    "comics",
    (client, signal) =>
      listComics(
        client,
        {
          worksetId: "workset",
          offset: 0,
          limit: 12,
        },
        signal,
      ),
  ],
  [
    "members",
    (client, signal) =>
      listMembers(
        client,
        {
          teamId: "team",
          offset: 0,
          limit: 20,
          includes: ["user"],
        },
        signal,
      ),
  ],
  ["members/me", (client, signal) => listMyMembers(client, { offset: 0, limit: 20 }, signal)],
  ["users", (client, signal) => getUser(client, "user", signal)],
  ["online users", (client, signal) => listOnlineUserIds(client, "team", signal)],
];

test.each(readers)(
  "%s forwards cancellation through the API boundary to fetch",
  async (_, read) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              reject(new DOMException("aborted", "AbortError"));
            },
            { once: true },
          );
        }),
    );
    const client = createApiClient({
      baseUrl: "/api/v1",
      getAccessToken: () => "token",
      fetchImpl,
    });
    const controller = new AbortController();
    const pending = read(client, controller.signal);
    const fetchSignal = fetchImpl.mock.calls[0]?.[1]?.signal;
    expect(fetchSignal?.aborted).toBe(false);
    controller.abort();
    expect(fetchSignal?.aborted).toBe(true);
    expect(await pending).toMatchObject({ success: false, failureKind: "aborted" });
  },
);
