import { readFileSync } from "node:fs";
import { expect, test, vi, type Mock } from "vitest";
import { createApiClient, type ApiClient } from "@/api/client";
import { getChapter } from "@/api/chapter/chapter-api";
import { listPageUnits, savePageUnits } from "@/api/translator/unit";
import {
  allocChapterPages,
  allocExistingPageUpload,
  deleteChapterPages,
  getPage,
  listPages,
  listPageUnitDiffStats,
  listPageUnitFlaggedStats,
  markPageImageUploaded,
} from "./page-api";

const specification = JSON.parse(
  readFileSync(new URL("../../../docs/swagger.json", import.meta.url), "utf8"),
) as { paths: Record<string, Record<string, unknown>> };

function fixture(data: unknown = []): { client: ApiClient; request: Mock<typeof fetch> } {
  const request = vi.fn<typeof fetch>(() => Promise.resolve(Response.json({ code: 0, data })));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  return { client, request };
}

test("all source-page operations target routes published by the current backend", async () => {
  const { client, request } = fixture();
  await listPages(client, "chapter--00000000001");
  await getPage(client, "page_source--00000000001");
  await listPageUnitDiffStats(client, "chapter--00000000001");
  await listPageUnitFlaggedStats(client, "chapter--00000000001");
  await allocChapterPages(client, "chapter--00000000001", []);
  await allocExistingPageUpload(client, "page_source--00000000001", {
    imageHash: "hash",
    ext: "png",
    newByteLen: 1,
  });
  await markPageImageUploaded(client, "page_source--00000000001", 1);
  await deleteChapterPages(client, "chapter--00000000001");
  await listPageUnits(client, "page_source--00000000001");
  await savePageUnits(client, "page_source--00000000001", [], "save");

  expect(request).toHaveBeenCalledTimes(10);
  for (const [input, init] of request.mock.calls) {
    const url = input instanceof Request ? input.url : String(input);
    const path = (url.split("?")[0] ?? "")
      .replace("chapter--00000000001", "{chapter_id}")
      .replace("page_source--00000000001", "{page_source_id}");
    expect(specification.paths[path], path).toBeDefined();
    expect(specification.paths[path]?.[init?.method?.toLowerCase() ?? "get"], path).toBeDefined();
  }
});

test("chapter page totals consume the canonical response field", async () => {
  const { client } = fixture({ id: "chapter--00000000001", page_source_count: 12 });
  const result = await getChapter(client, "chapter--00000000001");
  expect(result.success && result.data.pageSourceCount).toBe(12);
});
