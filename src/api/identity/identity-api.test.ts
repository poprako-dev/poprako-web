import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { allocateTeamAvatar, allocateUserAvatar } from "./identity-api";

const allocators = [
  ["users", allocateUserAvatar],
  ["teams", allocateTeamAvatar],
] as const;

test.each(allocators)(
  "unwraps %s avatar slots while preserving signed headers",
  async (path, allocate) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        code: 0,
        data: {
          slot: {
            put_url: "https://upload.test/avatar",
            image_version: 2,
            headers: { "x-amz-meta-user_id": "keep_this_value" },
          },
        },
      }),
    );
    const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null, fetchImpl });
    const result = await allocate(client, "owner", {
      imageHash: "hash",
      newByteLen: 10,
      ext: "png",
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`/api/v1/${path}/owner/avatar/alloc`);
    expect(result).toEqual({
      success: true,
      data: {
        putUrl: "https://upload.test/avatar",
        imageVersion: 2,
        headers: { "x-amz-meta-user_id": "keep_this_value" },
      },
    });
  },
);

test.each(allocators)(
  "keeps %s avatar deduplication and HTTP failures distinct",
  async (_path, allocate) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ code: 0, data: { slot: null } }))
      .mockResolvedValueOnce(
        Response.json({ code: 403, message: "无权修改头像" }, { status: 403 }),
      );
    const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null, fetchImpl });
    const input = { imageHash: "hash", newByteLen: 10, ext: "png" };
    expect(await allocate(client, "owner", input)).toEqual({ success: true, data: null });
    expect(await allocate(client, "owner", input)).toEqual({
      success: false,
      failureKind: "http",
      httpStatus: 403,
      code: 403,
      error: "无权修改头像",
    });
  },
);
