import { parseRequestBody } from "@/test-resource/api-client";
import { expect, test, vi } from "vitest";
import { createApiClient } from "./client";
import { decodeVoid } from "./contract";
test("queries repeat includes, preserve false and zero, and omit missing values", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  const client = createApiClient({
    baseUrl: "/api",
    getAccessToken: () => "token",
    fetchImpl: request,
  });
  await client.get("/members?active=true", {
    query: {
      ownerId: "user 1",
      incl: ["team", "user"],
      offset: 0,
      isPending: false,
      omitted: undefined,
    },
    decode: decodeVoid,
  });
  expect(request.mock.calls[0]?.[0]).toBe(
    "/api/members?active=true&owner_id=user+1&incl=team&incl=user&offset=0&is_pending=false",
  );
});
test("body conversion retains explicit null clears while omitting undefined", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  const client = createApiClient({
    baseUrl: "/api",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  await client.post(
    "/edit",
    { nextId: null, nested: { keep: false, remove: undefined }, items: [null, { keep: 0 }] },
    { decode: decodeVoid },
  );
  expect(parseRequestBody(request.mock.calls[0]?.[1]?.body)).toEqual({
    next_id: null,
    nested: { keep: false },
    items: [null, { keep: 0 }],
  });
});
test("malformed HTTP failures and network failures stay distinct", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response("broken", { status: 502, statusText: "Bad Gateway" }))
    .mockRejectedValueOnce(new Error("offline"));
  const client = createApiClient({
    baseUrl: "/api",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  expect(await client.get("/proxy", { decode: decodeVoid })).toMatchObject({
    success: false,
    httpStatus: 502,
    failureKind: "http",
  });
  expect(await client.get("/offline", { decode: decodeVoid })).toMatchObject({
    success: false,
    failureKind: "network",
  });
});
