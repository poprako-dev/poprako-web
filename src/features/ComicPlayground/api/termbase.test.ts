import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  createComicTermbase,
  deleteTermbase,
  getTermbase,
  listComicTermbases,
  updateTermbase,
} from "./termbase";
import {
  createTerm,
  deleteTerm,
  getTerm,
  listTerms,
  updateTerm,
} from "./term";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function okJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ code: 0, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function noContent(): Response {
  return new Response(null, { status: 204 });
}

function installFetch(...responses: Response[]) {
  let responseIndex = 0;
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    const response = responses[responseIndex];
    responseIndex += 1;
    if (!response) throw new Error("Missing mocked response");
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fetchCallAt(
  fetchMock: ReturnType<typeof installFetch>,
  index: number,
): FetchCall {
  const call = fetchMock.mock.calls[index];
  expect(call).toBeDefined();
  return {
    url: String(call![0]),
    init: call![1] as RequestInit | undefined,
  };
}

function bodyOf(call: FetchCall): unknown {
  return JSON.parse(String(call.init?.body));
}

describe("termbase API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("lists and unwraps comic-visible team and comic termbases", async () => {
    const fetchMock = installFetch(okJson([
      {
        id: "termbase_team",
        team_id: "team_1",
        name: "Shared",
        description: "Team terms",
        term_count: 2,
        creator_id: "user_1",
        created_at: 10,
        updated_at: 20,
      },
      {
        id: "termbase_comic",
        comic_id: "comic_1",
        name: "Comic",
        term_count: 1,
        creator_id: "user_2",
        created_at: 30,
        updated_at: 40,
      },
    ]));

    const result = await listComicTermbases({
      comicId: "comic_1",
      fuzzyName: "hero & rival",
      offset: 20,
      limit: 10,
    });

    expect(fetchCallAt(fetchMock, 0).url).toBe(
      "/api/v1/comics/comic_1/termbases?fuzzy_name=hero+%26+rival&offset=20&limit=10",
    );
    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "termbase_team",
          teamId: "team_1",
          comicId: undefined,
          name: "Shared",
          description: "Team terms",
          termCount: 2,
          creatorId: "user_1",
          createdAt: 10,
          updatedAt: 20,
        },
        {
          id: "termbase_comic",
          teamId: undefined,
          comicId: "comic_1",
          name: "Comic",
          description: undefined,
          termCount: 1,
          creatorId: "user_2",
          createdAt: 30,
          updatedAt: 40,
        },
      ],
    });
  });

  test("creates a comic-scoped termbase", async () => {
    const fetchMock = installFetch(okJson({ id: "termbase_1" }, 201));

    const result = await createComicTermbase({
      comicId: "comic_1",
      name: "Characters",
      description: "Names and titles",
    });

    const call = fetchCallAt(fetchMock, 0);
    expect(call.url).toBe("/api/v1/termbases");
    expect(call.init?.method).toBe("POST");
    expect(bodyOf(call)).toEqual({
      comic_id: "comic_1",
      name: "Characters",
      description: "Names and titles",
    });
    expect(result).toEqual({ success: true, data: "termbase_1" });
  });

  test("gets, fully replaces, and deletes a termbase", async () => {
    const fetchMock = installFetch(
      okJson({
        id: "termbase_1",
        comic_id: "comic_1",
        name: "Characters",
        description: null,
        term_count: 3,
        creator_id: "user_1",
        created_at: 10,
        updated_at: 20,
      }),
      noContent(),
      noContent(),
    );

    const getResult = await getTermbase("termbase_1");
    const updateResult = await updateTermbase("termbase_1", {
      name: "People",
      description: "",
    });
    const deleteResult = await deleteTermbase("termbase_1");

    expect(fetchCallAt(fetchMock, 0).url).toBe("/api/v1/termbases/termbase_1");
    expect(getResult).toEqual({
      success: true,
      data: {
        id: "termbase_1",
        teamId: undefined,
        comicId: "comic_1",
        name: "Characters",
        description: undefined,
        termCount: 3,
        creatorId: "user_1",
        createdAt: 10,
        updatedAt: 20,
      },
    });

    const updateCall = fetchCallAt(fetchMock, 1);
    expect(updateCall.url).toBe("/api/v1/termbases/termbase_1");
    expect(updateCall.init?.method).toBe("PUT");
    expect(bodyOf(updateCall)).toEqual({
      id: "termbase_1",
      name: "People",
      description: "",
    });
    expect(updateResult).toEqual({ success: true, data: undefined });

    const deleteCall = fetchCallAt(fetchMock, 2);
    expect(deleteCall.url).toBe("/api/v1/termbases/termbase_1");
    expect(deleteCall.init?.method).toBe("DELETE");
    expect(deleteResult).toEqual({ success: true, data: undefined });
  });
});

describe("term API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("lists terms with source-only fuzzy query and unwraps optional fields", async () => {
    const fetchMock = installFetch(okJson([
      {
        id: "term_1",
        termbase_id: "termbase_1",
        source: "Hero",
        targets: ["勇者", "英雄"],
        comment: null,
        creator_id: "user_1",
        created_at: 10,
        updated_at: 20,
      },
    ]));

    const result = await listTerms({
      termbaseId: "termbase_1",
      fuzzySource: "hero",
      offset: 0,
      limit: 20,
    });

    expect(fetchCallAt(fetchMock, 0).url).toBe(
      "/api/v1/termbases/termbase_1/terms?fuzzy_source=hero&offset=0&limit=20",
    );
    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "term_1",
          termbaseId: "termbase_1",
          source: "Hero",
          targets: ["勇者", "英雄"],
          comment: undefined,
          creatorId: "user_1",
          createdAt: 10,
          updatedAt: 20,
        },
      ],
    });
  });

  test("creates, gets, fully replaces, and deletes a term", async () => {
    const fetchMock = installFetch(
      okJson({ id: "term_1" }, 201),
      okJson({
        id: "term_1",
        termbase_id: "termbase_1",
        source: "Hero",
        targets: ["勇者"],
        comment: "Character",
        creator_id: "user_1",
        created_at: 10,
        updated_at: 20,
      }),
      noContent(),
      noContent(),
    );

    const createResult = await createTerm({
      termbaseId: "termbase_1",
      source: "Hero",
      targets: ["勇者"],
      comment: "Character",
    });
    const getResult = await getTerm("term_1");
    const updateResult = await updateTerm("term_1", {
      source: "Heroine",
      targets: ["女主角", "主角"],
      comment: "",
    });
    const deleteResult = await deleteTerm("term_1");

    const createCall = fetchCallAt(fetchMock, 0);
    expect(createCall.url).toBe("/api/v1/terms");
    expect(createCall.init?.method).toBe("POST");
    expect(bodyOf(createCall)).toEqual({
      termbase_id: "termbase_1",
      source: "Hero",
      targets: ["勇者"],
      comment: "Character",
    });
    expect(createResult).toEqual({ success: true, data: "term_1" });

    expect(fetchCallAt(fetchMock, 1).url).toBe("/api/v1/terms/term_1");
    expect(getResult).toEqual({
      success: true,
      data: {
        id: "term_1",
        termbaseId: "termbase_1",
        source: "Hero",
        targets: ["勇者"],
        comment: "Character",
        creatorId: "user_1",
        createdAt: 10,
        updatedAt: 20,
      },
    });

    const updateCall = fetchCallAt(fetchMock, 2);
    expect(updateCall.url).toBe("/api/v1/terms/term_1");
    expect(updateCall.init?.method).toBe("PUT");
    expect(bodyOf(updateCall)).toEqual({
      id: "term_1",
      source: "Heroine",
      targets: ["女主角", "主角"],
      comment: "",
    });
    expect(updateResult).toEqual({ success: true, data: undefined });

    const deleteCall = fetchCallAt(fetchMock, 3);
    expect(deleteCall.url).toBe("/api/v1/terms/term_1");
    expect(deleteCall.init?.method).toBe("DELETE");
    expect(deleteResult).toEqual({ success: true, data: undefined });
  });
});
