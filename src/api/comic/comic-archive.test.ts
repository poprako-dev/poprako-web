import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { exportComicArchives } from "./comic-archive";

test("exports repeated month filters and preserves opaque archive JSON", async () => {
  const data = { "2026-09": ['{"comic_id":"comic-1","archived_at":123}'] };
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 0, data }));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    fetchImpl: request,
  });
  const result = await exportComicArchives(
    client,
    "team-1",
    ["2025-12", "2026-09"],
    new AbortController().signal,
  );
  expect(request.mock.calls[0]?.[0]).toBe(
    "/api/v1/teams/team-1/comic-archives/export?month=2025-12&month=2026-09",
  );
  expect(result).toEqual({ success: true, data });
});

test("omits month filters when exporting all archives", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 0, data: {} }));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  await exportComicArchives(client, "team-1", undefined, new AbortController().signal);
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/teams/team-1/comic-archives/export");
});
