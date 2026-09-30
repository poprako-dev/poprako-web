import { createApiClient } from "@/api/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  listUnits,
  saveUnits,
  searchChapterUnits,
  transformChapterUnits,
} from "@/route/_authenticated/translator/business/remote/translator-request";
import type { UnitDiff } from "@/route/_authenticated/translator/business/contract/type";

function okJson(data: unknown): Response {
  return Response.json({ code: 0, data }, { status: 200 });
}

function clientWith(...responses: Response[]): {
  client: ReturnType<typeof createApiClient>;
  fetchMock: ReturnType<typeof vi.fn>;
} {
  let responseIndex = 0;
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    const response = responses[responseIndex++];
    if (!response) throw new Error("Missing mocked response");
    return Promise.resolve(response.clone());
  });
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: fetchMock,
  });
  return { client, fetchMock };
}

function requestBody(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): unknown {
  const init = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined;
  if (typeof init?.body !== "string") throw new TypeError("Expected a JSON body");
  return JSON.parse(init.body);
}

describe("translator unit API adapter", () => {
  beforeEach(() => vi.restoreAllMocks());

  test("maps normalized API units into page-indexed editor units", async () => {
    const { client } = clientWith(
      okJson({
        total_unit_count: 2,
        translated_unit_count: 1,
        proofread_unit_count: 0,
        unit_infos: [
          {
            id: "unit-1",
            page_id: "page-1",
            x_coord: 0.1,
            y_coord: 0.2,
            is_bubble: true,
            is_flagged: true,
            is_proofread: false,
            translated_text: "hello",
            last_translator_id: "user-1",
            proofread_text: null,
            last_proofreader_id: null,
            created_at: 1,
            updated_at: 2,
          },
        ],
      }),
    );

    const result = await listUnits(client, "page-1");

    expect(result).toEqual({
      success: true,
      data: {
        totalUnitCount: 2,
        translatedUnitCount: 1,
        proofreadUnitCount: 0,
        units: [
          {
            id: "unit-1",
            xCoord: 0.1,
            yCoord: 0.2,
            index: 0,
            isBubble: true,
            isFlagged: true,
            isProofread: false,
            translatedText: "hello",
            translatorId: "user-1",
          },
        ],
      },
    });
  });

  test("maps editor patch semantics while the API client owns key conversion", async () => {
    const { client, fetchMock } = clientWith(okJson({ created_unit_ids: [] }));
    const diff: UnitDiff = {
      ops: [
        {
          edit: "patch",
          id: "unit-1",
          nextId: { type: "clear" },
          isFlagged: false,
          translation: { type: "clear" },
          revision: {
            type: "assign",
            value: { isProofread: false, proofreadText: "" },
          },
        },
      ],
    };

    const result = await saveUnits(client, "page-1", diff, "save-1");

    expect(result).toEqual({ success: true, data: { createdUnitIds: [] } });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "/api/v1/pages/page-1/units/save?save_id=save-1",
    );
    expect(requestBody(fetchMock)).toEqual([
      {
        edit: "patch",
        id: "unit-1",
        next_id: { type: "clear" },
        is_flagged: false,
        translation: { type: "clear" },
        revision: { type: "assign", value: { is_proofread: false, proofread_text: "" } },
      },
    ]);
  });

  test("preserves assign tags and values for all three patch fields", async () => {
    const { client, fetchMock } = clientWith(okJson({ created_unit_ids: [] }));

    await saveUnits(
      client,
      "page-1",
      {
        ops: [
          {
            edit: "patch",
            id: "unit-1",
            nextId: { type: "assign", value: "unit-2" },
            translation: { type: "assign", value: { translatedText: "" } },
            revision: { type: "assign", value: { isProofread: false } },
          },
        ],
      },
      "save-1",
    );

    expect(requestBody(fetchMock)).toEqual([
      {
        edit: "patch",
        id: "unit-1",
        next_id: { type: "assign", value: "unit-2" },
        translation: { type: "assign", value: { translated_text: "" } },
        revision: { type: "assign", value: { is_proofread: false } },
      },
    ]);
  });

  test("sends explicit clear tags for all three patch fields", async () => {
    const { client, fetchMock } = clientWith(okJson({ created_unit_ids: [] }));

    await saveUnits(
      client,
      "page-1",
      {
        ops: [
          {
            edit: "patch",
            id: "unit-1",
            nextId: { type: "clear" },
            translation: { type: "clear" },
            revision: { type: "clear" },
          },
        ],
      },
      "save-1",
    );

    expect(requestBody(fetchMock)).toEqual([
      {
        edit: "patch",
        id: "unit-1",
        next_id: { type: "clear" },
        translation: { type: "clear" },
        revision: { type: "clear" },
      },
    ]);
  });

  test("omits skip fields from the serialized request while preserving a flag edit", async () => {
    const { client, fetchMock } = clientWith(okJson({ created_unit_ids: [] }));

    await saveUnits(
      client,
      "page-1",
      {
        ops: [
          {
            edit: "patch",
            id: "unit-1",
            nextId: { type: "skip" },
            isFlagged: false,
            translation: { type: "skip" },
            revision: { type: "skip" },
          },
        ],
      },
      "save-1",
    );

    expect(requestBody(fetchMock)).toEqual([{ edit: "patch", id: "unit-1", is_flagged: false }]);
  });

  test("converts search matches and the selected text field", async () => {
    const { client, fetchMock } = clientWith(
      okJson([
        {
          id: "unit-1",
          page_id: "page-2",
          x_coord: 0.1,
          y_coord: 0.2,
          is_bubble: false,
          is_flagged: false,
          is_proofread: true,
          proofread_text: "new phrase",
          created_at: 1,
          updated_at: 2,
        },
      ]),
    );

    const result = await searchChapterUnits(client, "chapter-1", {
      part: "proofreadText",
      phrase: "phrase",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "/api/v1/chapters/chapter-1/units/search?part=proofread_text&phrase=phrase",
    );
    expect(result.success && result.data[0]).toMatchObject({
      pageId: "page-2",
      unit: { id: "unit-1", index: 0, proofreadText: "new phrase" },
    });
  });

  test("sends transform operations with camel-case DTOs", async () => {
    const { client, fetchMock } = clientWith(new Response(null, { status: 204 }));

    const result = await transformChapterUnits(client, "chapter-1", {
      part: "translatedText",
      origin: "old",
      target: "new",
      unitIds: ["unit-1", "unit-2"],
    });

    expect(result).toEqual({ success: true, data: undefined });
    expect(requestBody(fetchMock)).toEqual({
      part: "translated_text",
      units: [
        { unit_id: "unit-1", transforms: [{ origin: "old", target: "new" }] },
        { unit_id: "unit-2", transforms: [{ origin: "old", target: "new" }] },
      ],
    });
  });
});
