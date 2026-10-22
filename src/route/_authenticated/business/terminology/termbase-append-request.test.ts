import { afterEach, expect, test, vi } from "vitest";
import type { ApiClient } from "@/api/client";
import { createApiClient } from "@/api/client";
import { appendTermbase } from "./termbase-append-request";
import { MAX_APPEND_FILE_BYTES } from "./termbase-append-document";

const content = JSON.stringify({
  terms: [{ source: " Elf ", targets: ["精灵", "妖精"], comment: "旧注\n新注" }],
});

function client(fetchImpl: typeof fetch): ApiClient {
  return createApiClient({ baseUrl: "/api/v1", getAccessToken: () => "token", fetchImpl });
}

afterEach(() => vi.restoreAllMocks());

test("appends the complete document once to the selected base and returns all counts", async () => {
  const counts = { added: 1, updated: 2, unchanged: 3 };
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 0, data: counts }));
  await expect(appendTermbase(client(fetchImpl), "base-1", content)).resolves.toEqual({
    success: true,
    data: counts,
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
  const [url, init] = fetchImpl.mock.calls[0] ?? [];
  expect(url).toBe("/api/v1/termbases/base-1/append");
  expect(init?.method).toBe("POST");
  expect(init?.body).toBe(content);
  expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token");
});

test.each([
  "{broken",
  "null",
  "[]",
  "{}",
  '{"terms":[],"name":"base"}',
  '{"terms":[],"description":null}',
  '{"terms":[],"terms":[]}',
  '{"terms":[],"ter\\u006ds":[]}',
  '{"terms":[{"source":"x","source":"y","targets":["z"]}]}',
  '{"terms":[{"source":"x","targets":["y"],"id":"existing"}]}',
  '{"terms":[{"source":null,"targets":["y"]}]}',
  '{"terms":[{"source":"x","targets":[1]}]}',
  '{"terms":[{"source":"x","targets":["y"],"comment":{}}]}',
])("rejects invalid or non-portable documents without a write: %s", async (document) => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>();
  expect((await appendTermbase(client(fetchImpl), "base", document)).success).toBe(false);
  expect(fetchImpl).not.toHaveBeenCalled();
});

test.each([
  '{"terms":[]}',
  '{"terms":[{"source":"x","targets":["y"]}]}',
  '{"terms":[{"source":"x","targets":["y"],"comment":null}]}',
  JSON.stringify({ terms: [{ source: '"{source}":', targets: ['"x":{}'], comment: "x" }] }),
])("accepts valid portable documents including empty batches: %s", async (document) => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      code: 0,
      data: { added: 0, updated: 0, unchanged: 0 },
    }),
  );
  expect((await appendTermbase(client(fetchImpl), "base", document)).success).toBe(true);
  expect(fetchImpl).toHaveBeenCalledOnce();
});

test("bounds document size before parsing", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>();
  const result = await appendTermbase(
    client(fetchImpl),
    "base",
    " ".repeat(MAX_APPEND_FILE_BYTES + 1),
  );
  expect(result).toEqual({ success: false, error: "术语文件不能超过 8 MiB" });
  expect(fetchImpl).not.toHaveBeenCalled();
});

test.each([403, 422, 500])("preserves server failures without replay (%i)", async (status) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 123, message: "追加失败" }, { status }));
  expect(await appendTermbase(client(fetchImpl), "base", content)).toMatchObject({
    success: false,
    httpStatus: status,
    failureKind: "http",
    error: "追加失败",
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
});

test.each([
  null,
  {},
  { added: -1, updated: 0, unchanged: 0 },
  { added: 1, updated: "2", unchanged: 0 },
])("treats malformed success counts as an uncertain protocol failure: %j", async (data) => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 0, data }));
  expect(await appendTermbase(client(fetchImpl), "base", content)).toMatchObject({
    success: false,
    failureKind: "protocol",
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
});

test("does not replay after a network failure", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline"));
  expect(await appendTermbase(client(fetchImpl), "base", content)).toMatchObject({
    success: false,
    failureKind: "network",
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
});
