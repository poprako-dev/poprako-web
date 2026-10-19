import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import type { ApiClient } from "@/api/client";
import { exportTermbase } from "./termbase-request";

afterEach(() => vi.restoreAllMocks());

function createClient(fetchImpl: typeof fetch): ApiClient {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "access-token",
    fetchImpl,
  });
}

test.each([
  '{"name":"空库","description":null,"terms":[]}',
  '{ "name": "角色", "terms": [{"source":"団長","targets":["团长","队长"],"comment":null}] }\n',
])("downloads native JSON without unwrapping or reserializing: %s", async (content) => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(content));
  const result = await exportTermbase(createClient(fetchImpl), "base-1");
  expect(result).toEqual({ success: true, data: content });
  expect(fetchImpl).toHaveBeenCalledOnce();
  const [url, init] = fetchImpl.mock.calls[0] ?? [];
  expect(url).toBe("/api/v1/termbases/base-1/export/download");
  expect(init?.method).toBe("GET");
  expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access-token");
});

test.each([403, 422])("preserves export HTTP errors (%i)", async (status) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 123, message: "无法导出此术语库" }, { status }));
  await expect(exportTermbase(createClient(fetchImpl), "base-1")).resolves.toEqual({
    success: false,
    failureKind: "http",
    httpStatus: status,
    code: 123,
    error: "无法导出此术语库",
  });
});

test("reports a network error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline"));
  await expect(exportTermbase(createClient(fetchImpl), "base-1")).resolves.toMatchObject({
    success: false,
    failureKind: "network",
  });
});

test("forwards cancellation to the authenticated request", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Cancelled", "AbortError"));
        });
      }),
  );
  const controller = new AbortController();
  const result = exportTermbase(createClient(fetchImpl), "base-1", controller.signal);
  controller.abort();
  await expect(result).resolves.toMatchObject({ success: false, failureKind: "aborted" });
  expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
});
