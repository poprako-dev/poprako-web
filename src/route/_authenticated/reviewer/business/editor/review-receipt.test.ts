import { expect, test, vi, type Mock } from "vitest";
import { createApiClient } from "@/api/client";
import { parseRequestBody } from "@/test-resource/api-client";
import { deferred } from "@/test-resource/deferred";
import { createReviewHttpSource } from "./review-http-source";
import { pageIsDirty } from "./review-editing";
import { ReviewSession } from "./review-session";

const page = {
  page_artwork_id: "page_artwork--00000000001",
  review_key: "review",
  revision: "1",
  chapter_revision: "1",
  image_version: 1,
  issues: [],
};
const local = {
  id: "draft-1",
  pageArtworkId: page.page_artwork_id,
  index: 0,
  variant: "文字",
  note: "初稿",
  rect: null,
};
const savedId = "issue--00000000001";

function acknowledgement(note = local.note, created = true): Response {
  return Response.json({
    code: 0,
    data: {
      page: {
        ...page,
        revision: "2",
        issues: [
          {
            id: savedId,
            page_artwork_id: page.page_artwork_id,
            index: 0,
            variant: local.variant,
            rect: null,
            note,
          },
        ],
      },
      created_issue_ids: created ? [{ local_id: local.id, issue_id: savedId }] : [],
    },
  });
}

async function fixture(): Promise<{ session: ReviewSession; request: Mock<typeof fetch> }> {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: page }));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  const source = createReviewHttpSource(client, "chapter--00000000001", crypto.randomUUID());
  source.readDraft = () => Promise.resolve(null);
  source.writeDraft = () => Promise.resolve();
  const session = new ReviewSession(source);
  await session.load(page.page_artwork_id, new AbortController().signal);
  session.commit(page.page_artwork_id, [local]);
  return { session, request };
}

test("new issues use local IDs and apply canonical receipts without duplicate issues", async () => {
  const { session, request } = await fixture();
  request.mockResolvedValueOnce(acknowledgement());
  await session.save(page.page_artwork_id);
  expect(parseRequestBody(request.mock.calls[1]?.[1]?.body)).toMatchObject({
    issues: [{ local_id: local.id, variant: local.variant, note: local.note, rect: null }],
  });
  const current = session.page(page.page_artwork_id);
  expect(current.issues).toHaveLength(1);
  expect(current.issues[0]?.id).toBe(savedId);
  expect(pageIsDirty(current)).toBe(false);
  session.undo(page.page_artwork_id);
  expect(session.page(page.page_artwork_id).issues).toEqual([]);
});

test("edits during creation acknowledgement are resaved using the server ID", async () => {
  const { session, request } = await fixture();
  const entered = deferred<undefined>();
  const response = deferred<Response>();
  request.mockImplementationOnce(() => {
    entered.resolve(undefined);
    return response.promise;
  });
  request.mockResolvedValueOnce(acknowledgement("保存期间修改", false));
  const saving = session.save(page.page_artwork_id);
  await entered.promise;
  session.commit(page.page_artwork_id, [{ ...local, note: "保存期间修改" }]);
  response.resolve(acknowledgement());
  await saving;
  expect(parseRequestBody(request.mock.calls[2]?.[1]?.body)).toMatchObject({
    issues: [{ id: savedId, note: "保存期间修改" }],
  });
  expect(session.page(page.page_artwork_id).issues).toHaveLength(1);
  expect(pageIsDirty(session.page(page.page_artwork_id))).toBe(false);
});
