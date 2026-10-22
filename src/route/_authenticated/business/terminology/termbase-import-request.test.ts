import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import type { ApiClient } from "@/api/client";
import { importComicTermbase } from "./termbase-request";

afterEach(() => vi.restoreAllMocks());

function createClient(fetchImpl: typeof fetch): ApiClient {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "access-token",
    fetchImpl,
  });
}

const document = {
  name: "角色称谓",
  description: null,
  terms: [{ source: "団長", targets: ["团长", "队长"], comment: null }],
};

test.each([200, 201])("imports native JSON into the current comic (%i)", async (status) => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        code: 0,
        data: { id: "new-base", created: true, created_term_count: 1, merged_term_count: 0 },
      },
      { status },
    ),
  );
  const result = await importComicTermbase(
    createClient(fetchImpl),
    "comic-1",
    JSON.stringify(document),
  );
  expect(result).toEqual({
    success: true,
    data: { id: "new-base", created: true, createdTermCount: 1, mergedTermCount: 0 },
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
  const [url, init] = fetchImpl.mock.calls[0] ?? [];
  expect(url).toBe("/api/v1/comics/comic-1/termbases/import?force_merge=false");
  expect(init?.method).toBe("POST");
  expect(init?.body).toBe(JSON.stringify(document));
  expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access-token");
  expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
});

test.each(["", "{broken", "null trailing"])(
  "rejects invalid JSON before making a request: %s",
  async (content) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(importComicTermbase(createClient(fetchImpl), "comic-1", content)).resolves.toEqual(
      {
        success: false,
        error: "术语库文件不是有效的 JSON",
      },
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  },
);

test.each([403, 422])("preserves server validation and permission errors (%i)", async (status) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 123, message: "术语库名称已存在" }, { status }));
  await expect(
    importComicTermbase(createClient(fetchImpl), "comic-1", JSON.stringify(document)),
  ).resolves.toEqual({
    success: false,
    failureKind: "http",
    httpStatus: status,
    code: 123,
    error: "术语库名称已存在",
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
});

test("leaves document validation to the server", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 123, message: "缺少术语库名称" }, { status: 422 }));
  const result = await importComicTermbase(createClient(fetchImpl), "comic-1", '{"terms":[]}');
  expect(fetchImpl.mock.calls[0]?.[1]?.body).toBe('{"terms":[]}');
  expect(result).toMatchObject({ success: false, error: "缺少术语库名称" });
});

test("reports network errors without retrying the import", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline"));
  await expect(
    importComicTermbase(createClient(fetchImpl), "comic-1", "{}"),
  ).resolves.toMatchObject({
    success: false,
    failureKind: "network",
  });
  expect(fetchImpl).toHaveBeenCalledOnce();
});

test("rejects malformed JSON in a success response", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("{broken"));
  await expect(
    importComicTermbase(createClient(fetchImpl), "comic-1", "{}"),
  ).resolves.toMatchObject({
    success: false,
    failureKind: "protocol",
  });
});
