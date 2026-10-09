import { parseRequestBody } from "@/test-resource/api-client";
import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { allocArtwork, exportArtwork, markArtworkUploaded } from "./artwork-api";

test("deduplication retains version and confirms with the original protocol", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: { artwork_version: 7, slot: null } }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    fetchImpl: request,
  });
  expect(await allocArtwork(client, "chapter", "hash", 123)).toEqual({
    success: true,
    data: { artworkVersion: 7, slot: null },
  });
  expect(parseRequestBody(request.mock.calls[0]?.[1]?.body)).toEqual({
    artwork_hash: "hash",
    new_byte_len: 123,
    ext: "xz",
  });
  await markArtworkUploaded(client, "chapter", 7);
  expect(request.mock.calls[1]?.[0]).toBe("/api/v1/chapters/chapter/artwork/mark-uploaded");
  expect(parseRequestBody(request.mock.calls[1]?.[1]?.body)).toEqual({ artwork_version: 7 });
});
test("exports the current artifact identity without downloading its bytes", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      code: 0,
      data: {
        artwork_version: 8,
        artwork_hash: "hash",
        ext: "zst",
        download_url: "https://storage.example/artwork?signature=opaque",
      },
    }),
  );
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    fetchImpl: request,
  });
  const signal = new AbortController().signal;
  expect(await exportArtwork(client, "chapter", signal)).toEqual({
    success: true,
    data: {
      artworkVersion: 8,
      artworkHash: "hash",
      ext: "zst",
      downloadUrl: "https://storage.example/artwork?signature=opaque",
    },
  });
  expect(request).toHaveBeenCalledOnce();
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/chapters/chapter/artwork/export");
  expect(request.mock.calls[0]?.[1]?.signal).toMatchObject({ aborted: false });
});
test("signed headers remain opaque", async () => {
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    fetchImpl: () =>
      Promise.resolve(
        Response.json({
          code: 0,
          data: {
            artwork_version: 8,
            slot: {
              put_url: "https://storage.example/put",
              headers: { "content-length": "123", x_amz_meta: "a" },
            },
          },
        }),
      ),
  });
  expect(await allocArtwork(client, "chapter", "hash", 123)).toEqual({
    success: true,
    data: {
      artworkVersion: 8,
      slot: {
        putUrl: "https://storage.example/put",
        headers: { "content-length": "123", x_amz_meta: "a" },
      },
    },
  });
});
