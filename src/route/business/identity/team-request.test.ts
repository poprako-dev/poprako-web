import { afterEach, expect, test, vi } from "vitest";
import { listTeams, listOnlineUserIds, markSelfOnline } from "@/api/identity/identity-api";
import { createTestApi } from "@/test-resource/api-client";
afterEach(() => vi.unstubAllGlobals());
test("team queries carry the explicit owner rather than reading session globals", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 0, data: [] }));
  vi.stubGlobal("fetch", request);
  expect(await listTeams(createTestApi(), { userId: "user_1", offset: 0, limit: 20 })).toEqual({
    success: true,
    data: [],
  });
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/teams?user_id=user_1&offset=0&limit=20");
});
test("online presence uses PUT and returns the original string IDs", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json({ code: 0, data: ["user_1", "user_2"] }));
  vi.stubGlobal("fetch", request);
  expect(await markSelfOnline(createTestApi(), "team_1")).toEqual({
    success: true,
    data: undefined,
  });
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/teams/team_1/mark-self-online");
  expect(request.mock.calls[0]?.[1]?.method).toBe("PUT");
  expect(await listOnlineUserIds(createTestApi(), "team_1")).toEqual({
    success: true,
    data: ["user_1", "user_2"],
  });
});
