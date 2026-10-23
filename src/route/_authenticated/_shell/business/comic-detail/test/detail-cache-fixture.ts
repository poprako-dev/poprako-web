import { vi } from "vitest";
import { createApiClient } from "@/api/client";
import { requestAddress } from "@/test-resource/api-client";
import { detailChapter, detailComic } from "../../test/detail-request-fixture";

export function detailResponse(input: RequestInfo | URL, title?: string): Response {
  const path = new URL(requestAddress(input), "https://test.invalid").pathname;
  const comicId = path.split("/")[4] ?? "comic";
  const data = path.endsWith("/chapters/pinned")
    ? detailChapter(comicId)
    : { ...detailComic(comicId), title: title ?? comicId };
  return Response.json({ code: 0, data });
}

export function detailClient(): {
  client: ReturnType<typeof createApiClient>;
  fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockImplementation((input) => Promise.resolve(detailResponse(input)));
  const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => "token", fetchImpl });
  return { client, fetchImpl };
}
