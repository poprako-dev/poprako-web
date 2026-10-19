import { expect, test, vi } from "vitest";
import { createApiClient, type ApiClient } from "@/api/client";
import { createTeamTermbase, importTeamTermbase, listTeamTermbases } from "./team-termbase-request";
import { getTermbase } from "./termbase-request";

function client(fetchImpl: typeof fetch): ApiClient {
  return createApiClient({ baseUrl: "/api/v1", getAccessToken: () => "token", fetchImpl });
}
const rawBase = {
  id: "base",
  team_id: "team",
  comic_id: null,
  name: "角色",
  description: null,
  term_count: 1,
  creator_id: "user",
  created_at: 1,
  updated_at: 2,
};

test("lists only the requested team's libraries with server search and pagination", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 0, data: [rawBase] }));
  const result = await listTeamTermbases(client(fetchImpl), "team", {
    fuzzyName: "角色",
    offset: 30,
    limit: 30,
  });
  const url = new URL(fetchImpl.mock.calls[0]?.[0] as string, "https://example.test");
  expect(url.pathname).toBe("/api/v1/teams/team/termbases");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    fuzzy_name: "角色",
    offset: "30",
    limit: "30",
  });
  expect(result).toMatchObject({
    success: true,
    data: [{ teamId: "team", comicId: undefined, termCount: 1 }],
  });
});

test("creates a library with team ownership and reads its returned id", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: { id: "base" } }))
    .mockResolvedValueOnce(Response.json({ code: 0, data: rawBase }));
  const api = client(fetchImpl);
  await expect(createTeamTermbase(api, "team", { name: "角色" })).resolves.toEqual({
    success: true,
    data: "base",
  });
  expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/v1/termbases");
  expect(JSON.parse(fetchImpl.mock.calls[0]?.[1]?.body as string)).toEqual({
    team_id: "team",
    name: "角色",
  });
  await expect(getTermbase(api, "base")).resolves.toMatchObject({
    success: true,
    data: { id: "base", teamId: "team" },
  });
  expect(fetchImpl.mock.calls[1]?.[0]).toBe("/api/v1/termbases/base");
});

test("imports one document without merging or carrying ownership in its body", async () => {
  const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        code: 0,
        data: { id: "base", created: true, created_term_count: 0, merged_term_count: 0 },
      },
      { status: 201 },
    ),
  );
  const content = '{"name":"空库","terms":[]}';
  await expect(importTeamTermbase(client(fetchImpl), "team", content)).resolves.toMatchObject({
    success: true,
    data: { id: "base", created: true },
  });
  expect(fetchImpl.mock.calls[0]?.[0]).toBe(
    "/api/v1/teams/team/termbases/import?force_merge=false",
  );
  expect(fetchImpl.mock.calls[0]?.[1]?.body).toBe(content);
});

test("rejects malformed JSON before submitting", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const fetchImpl = vi.fn<typeof fetch>();
  await expect(importTeamTermbase(client(fetchImpl), "team", "{bad")).resolves.toMatchObject({
    success: false,
    error: "术语库文件不是有效的 JSON",
  });
  expect(fetchImpl).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

test.each([
  [403, "没有权限"],
  [422, "术语库名称已存在"],
  [422, "术语数量超过上限"],
])("preserves backend rejection %s %s without retrying", async (status, message) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 123, message }, { status }));
  await expect(importTeamTermbase(client(fetchImpl), "team", "{}")).resolves.toMatchObject({
    success: false,
    httpStatus: status,
    error: message,
  });
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});
