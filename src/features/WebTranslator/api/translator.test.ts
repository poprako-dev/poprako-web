import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  listPageUnitDiffStats,
  listPageUnitFlaggedStats,
  searchChapterUnits,
  transformChapterUnits,
} from "./translator";

function okJson(data: unknown) {
  return Response.json({ code: 0, data }, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("chapter unit search and transform API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("unwraps sparse flag statistics without changing page identity or index", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson([
      { page_id: "page-5", index: 4, flagged_unit_count: 3 },
    ]));
    vi.stubGlobal("fetch", fetchMock);
    expect(await listPageUnitFlaggedStats("chapter-1")).toEqual({
      success: true,
      data: [{ pageId: "page-5", index: 4, flaggedUnitCount: 3 }],
    });
    expect(String(fetchMock.mock.calls[0]?.[0]))
      .toBe("/api/v1/chapters/chapter-1/pages/unit-flagged-stats");
  });

  test("keeps empty and failed flag statistics distinct", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okJson([])));
    expect(await listPageUnitFlaggedStats("chapter-1")).toEqual({ success: true, data: [] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
      { message: "无权访问章节" }, { status: 403 },
    )));
    expect(await listPageUnitFlaggedStats("chapter-1"))
      .toMatchObject({ success: false, httpStatus: 403 });
  });

  test("unwraps page diff statistics with original page indexes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson([{
      page_id: "page-2",
      index: 1,
      translated_unit_count: 10,
      editted_unit_count: 3,
      proofreader_append_unit_count: 2,
    }, {
      page_id: "page-5",
      index: 4,
      translated_unit_count: 0,
      editted_unit_count: 0,
      proofreader_append_unit_count: 1,
    }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await listPageUnitDiffStats("chapter-1");

    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) {throw new Error("fetch 未被调用");}
    expect(String(firstCall[0])).toBe(
      "/api/v1/chapters/chapter-1/pages/unit-diff-stats",
    );
    expect(result).toEqual({
      success: true,
      data: [{
        pageId: "page-2",
        index: 1,
        translatedUnitCount: 10,
        editedUnitCount: 3,
        proofreaderAppendUnitCount: 2,
      }, {
        pageId: "page-5",
        index: 4,
        translatedUnitCount: 0,
        editedUnitCount: 0,
        proofreaderAppendUnitCount: 1,
      }],
    });
  });

  test("keeps an empty diff response empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okJson([])));
    expect(await listPageUnitDiffStats("chapter-1"))
      .toEqual({ success: true, data: [] });
  });

  test("does not turn a failed statistics request into zero differences", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
      { message: "无权访问章节" },
      { status: 403 },
    )));
    expect(await listPageUnitDiffStats("chapter-1"))
      .toMatchObject({ success: false, httpStatus: 403 });
  });

  test("maps search query fields and unwraps page ownership", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson([{
      id: "unit-1",
      page_id: "page-2",
      is_bubble: true,
      is_flagged: false,
      is_proofread: false,
      x_coord: 0.1,
      y_coord: 0.2,
      translated_text: "旧词旧词",
      created_at: 1,
      updated_at: 2,
    }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchChapterUnits("chapter-1", {
      part: "translatedText",
      phrase: "旧词",
    });

    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) {throw new Error("fetch 未被调用");}
    expect(String(firstCall[0])).toBe(
      "/api/v1/chapters/chapter-1/units/search?part=translated_text&phrase=%E6%97%A7%E8%AF%8D",
    );
    expect(result.success && result.data[0]).toMatchObject({
      pageId: "page-2",
      unit: { id: "unit-1", translatedText: "旧词旧词" },
    });
  });

  test("builds one transform pair for every selected unit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await transformChapterUnits("chapter-1", {
      part: "proofreadText",
      origin: "旧词",
      target: "新词",
      unitIds: ["unit-1", "unit-2"],
    });
    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) {throw new Error("fetch 未被调用");}
    const request = firstCall[1] as RequestInit;

    expect(result).toEqual({ success: true, data: undefined });
    expect(String(firstCall[0])).toBe(
      "/api/v1/chapters/chapter-1/units/transform",
    );
    expect(JSON.parse(request.body as string)).toEqual({
      part: "proofread_text",
      units: [
        {
          unit_id: "unit-1",
          transforms: [{ origin: "旧词", target: "新词" }],
        },
        {
          unit_id: "unit-2",
          transforms: [{ origin: "旧词", target: "新词" }],
        },
      ],
    });
  });
});
