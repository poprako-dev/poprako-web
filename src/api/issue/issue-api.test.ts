import { expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { listPageIssues, importChapterIssues } from "./issue-api";
import { parseRequestBody } from "@/test-resource/api-client";

test("reads canonical page issues including empty notes and opaque layer paths", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      code: 0,
      data: [
        {
          id: "id",
          page_id: "page",
          index: 0,
          variant: "custom",
          layer_path: "opaque/path",
          rect: null,
          note: "",
        },
        {
          id: "second",
          page_id: "page",
          index: 1,
          variant: "位置",
          layer_path: null,
          rect: { x_coord: 0.1, y_coord: 0.2, width: 0.3, height: 0.1 },
          note: " 原文\n ",
        },
      ],
    }),
  );
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  const signal = new AbortController().signal;
  const result = await listPageIssues(client, "page", signal);
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/pages/page/issues");
  expect(result).toMatchObject({
    success: true,
    data: [
      { id: "id", pageId: "page", index: 0, layerPath: "opaque/path", note: "" },
      { index: 1, rect: { xCoord: 0.1, yCoord: 0.2, width: 0.3, height: 0.1 }, note: " 原文\n " },
    ],
  });
});

test("sends a complete replacement including empty pages and reads import counts", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json({ code: 0, data: { imported_page_count: 2, imported_issue_count: 1 } }),
    );
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  const result = await importChapterIssues(client, "chapter", {
    pages: [
      {
        issues: [
          {
            variant: "位置",
            layerPath: null,
            rect: { xCoord: 0.1, yCoord: 0.1, width: 0.2, height: 0.2 },
            note: "",
          },
        ],
      },
      { issues: [] },
    ],
  });
  expect(request.mock.calls[0]?.[0]).toBe("/api/v1/chapters/chapter/issues/import");
  expect(parseRequestBody(request.mock.calls[0]?.[1]?.body)).toEqual({
    pages: [
      {
        issues: [
          {
            variant: "位置",
            layer_path: null,
            rect: { x_coord: 0.1, y_coord: 0.1, width: 0.2, height: 0.2 },
            note: "",
          },
        ],
      },
      { issues: [] },
    ],
  });
  expect(result).toEqual({ success: true, data: { importedPageCount: 2, importedIssueCount: 1 } });
});

test("distinguishes empty success from malformed issues and permission failures", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: [] }))
    .mockResolvedValueOnce(
      Response.json({
        code: 0,
        data: [
          {
            id: "id",
            page_id: "page",
            index: -1,
            variant: "位置",
            layer_path: null,
            rect: null,
            note: "",
          },
        ],
      }),
    )
    .mockResolvedValueOnce(Response.json({ code: 403, message: "无权访问" }, { status: 403 }));
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: request,
  });
  expect(await listPageIssues(client, "page")).toEqual({ success: true, data: [] });
  expect(await listPageIssues(client, "page")).toMatchObject({
    success: false,
    failureKind: "protocol",
  });
  expect(await listPageIssues(client, "page")).toMatchObject({ success: false, httpStatus: 403 });
});
