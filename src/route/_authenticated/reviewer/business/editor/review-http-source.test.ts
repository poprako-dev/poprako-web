import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { parseRequestBody } from "@/test-resource/api-client";
import { createReviewHttpSource } from "./review-http-source";
import { ReviewChangedError } from "./review-editing";
import { createCategoryPresets } from "./category-presets";

function fixture(): {
  request: ReturnType<typeof vi.fn<typeof fetch>>;
  source: ReturnType<typeof createReviewHttpSource>;
  document: {
    page_artwork_id: string;
    review_key: string;
    revision: string;
    chapter_revision: string;
    image_version: number;
    issues: never[];
  };
} {
  const request = vi.fn<typeof fetch>();
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  const source = createReviewHttpSource(client, "chapter", "account");
  const document = {
    page_artwork_id: "page",
    review_key: "chapter:1",
    revision: "4",
    chapter_revision: "9",
    image_version: 2,
    issues: [],
  };
  return { request, source, document };
}

test("saves stable identities and baseline context without advancing review", async () => {
  const { request, source, document } = fixture();
  request.mockImplementation(() => Promise.resolve(Response.json({ code: 0, data: document })));
  const baseline = await source.load("page", new AbortController().signal);
  const issues = [
    { id: "stable", pageArtworkId: "page", index: 0, variant: "字体", rect: null, note: "" },
  ];
  await source.save("page", { baseline, issues }, "batch");
  expect(request.mock.calls[1]?.[0]).toBe("/api/v1/page-artworks/page/issues/save?save_id=batch");
  expect(parseRequestBody(request.mock.calls[1]?.[1]?.body)).toEqual({
    review_key: "chapter:1",
    revision: "4",
    image_version: 2,
    issues: [{ id: "stable", variant: "字体", rect: null, note: "" }],
  });
  expect(request).toHaveBeenCalledTimes(2);
});

test("conflicts reload the current document for review session reconciliation", async () => {
  const { request, source, document } = fixture();
  request.mockResolvedValueOnce(Response.json({ code: 0, data: document }));
  const baseline = await source.load("page", new AbortController().signal);
  request.mockResolvedValueOnce(Response.json({ code: 409, message: "changed" }, { status: 409 }));
  request.mockResolvedValueOnce(Response.json({ code: 0, data: { ...document, revision: "5" } }));
  await expect(source.save("page", { baseline, issues: [] }, "batch")).rejects.toBeInstanceOf(
    ReviewChangedError,
  );
  expect(request.mock.calls[2]?.[0]).toBe("/api/v1/page-artworks/page/issues");
});

test("personal category presets persist across chapters while accounts remain isolated", () => {
  const account = `review-${crypto.randomUUID()}`;
  const first = createCategoryPresets(account);
  first.write(["气泡留白", "气泡留白"]);
  expect(createCategoryPresets(account).read()).toEqual(["气泡留白"]);
  expect(createCategoryPresets(`${account}-other`).read()).toEqual([]);
  first.write([]);
  expect(createCategoryPresets(account).read()).toEqual([]);
});

test("separate prototype preset stores never persist across story instances", () => {
  const first = createCategoryPresets();
  first.write(["节奏"]);
  expect(first.read()).toEqual(["节奏"]);
  expect(createCategoryPresets().read()).toEqual([]);
});
