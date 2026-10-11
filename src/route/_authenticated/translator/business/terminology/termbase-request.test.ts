import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createApiClient } from "@/api/client";
import type { ApiClient } from "@/api/client";

import {
  createComicTermbase,
  deleteTermbase,
  getTermbase,
  listComicTermbases,
  updateTermbase,
} from "@/route/_authenticated/translator/business/terminology/termbase-request";
import {
  createTerm,
  deleteTerm,
  getTerm,
  listTerms,
  updateTerm,
} from "@/route/_authenticated/translator/business/terminology/term-request";

type FetchCall = {
  url: string;
  init?: RequestInit | undefined;
};

function okJson(data: unknown, status = 200): Response {
  return Response.json(
    { code: 0, data },
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function noContent(): Response {
  return new Response(null, { status: 204 });
}

function installFetch(
  ...responses: Response[]
): Mock<(_input: RequestInfo | URL, _init?: RequestInit) => Promise<Response>> {
  let responseIndex = 0;
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    const response = responses[responseIndex];
    responseIndex += 1;
    if (!response) throw new Error("Missing mocked response");
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function createClient(fetchMock: ReturnType<typeof installFetch>): ApiClient {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: fetchMock,
  });
}

function fetchCallAt(fetchMock: ReturnType<typeof installFetch>, index: number): FetchCall {
  const call = fetchMock.mock.calls[index];
  expect(call).toBeDefined();
  if (!call) throw new Error(`Missing fetch call at index ${String(index)}`);
  const input = call[0];
  const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
  return {
    url,
    init: call[1],
  };
}

function bodyOf(call: FetchCall): unknown {
  const body = call.init?.body;
  if (typeof body !== "string") {
    throw new TypeError("Expected a JSON request body");
  }
  return JSON.parse(body);
}

const comicTermbasesResponse = [
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
];

const listedComicTermbases = {
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
};

function registerListComicTermbasesTest(): void {
  test("lists and unwraps comic-visible team and comic termbases", async () => {
    const fetchMock = installFetch(okJson(comicTermbasesResponse));
    const result = await listComicTermbases(createClient(fetchMock), {
      comicId: "comic_1",
      fuzzyName: "hero & rival",
      offset: 20,
      limit: 10,
    });
    expect(fetchCallAt(fetchMock, 0).url).toBe(
      "/api/v1/comics/comic_1/termbases?fuzzy_name=hero+%26+rival&offset=20&limit=10",
    );
    expect(result).toEqual(listedComicTermbases);
  });
}

const termbaseResponse = {
  id: "termbase_1",
  comic_id: "comic_1",
  name: "Characters",
  description: null,
  term_count: 3,
  creator_id: "user_1",
  created_at: 10,
  updated_at: 20,
};

const fetchedTermbase = {
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
};

function registerCreateComicTermbaseTest(): void {
  test("creates a comic-scoped termbase", async () => {
    const fetchMock = installFetch(okJson({ id: "termbase_1" }, 201));
    const result = await createComicTermbase(createClient(fetchMock), {
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
}

function registerTermbaseLifecycleTest(): void {
  test("gets, fully replaces, and deletes a termbase", async () => {
    const fetchMock = installFetch(okJson(termbaseResponse), noContent(), noContent());
    const client = createClient(fetchMock);
    const result = await getTermbase(client, "termbase_1");
    const updateResult = await updateTermbase(client, "termbase_1", {
      name: "People",
      description: "",
    });
    const deletedTermbase = await deleteTermbase(client, "termbase_1");
    expect(fetchCallAt(fetchMock, 0).url).toBe("/api/v1/termbases/termbase_1");
    expect(result).toEqual(fetchedTermbase);
    const updateCall = fetchCallAt(fetchMock, 1);
    expect(updateCall.url).toBe("/api/v1/termbases/termbase_1");
    expect(updateCall.init?.method).toBe("PUT");
    expect(bodyOf(updateCall)).toEqual({ id: "termbase_1", name: "People", description: "" });
    expect(updateResult).toEqual({ success: true, data: undefined });
    const deletionCall = fetchCallAt(fetchMock, 2);
    expect(deletionCall.url).toBe("/api/v1/termbases/termbase_1");
    expect(deletionCall.init?.method).toBe("DELETE");
    expect(deletedTermbase).toEqual({ success: true, data: undefined });
  });
}

const termListResponse = [
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
];

const termRecordResponse = {
  id: "term_1",
  termbase_id: "termbase_1",
  source: "Hero",
  targets: ["勇者"],
  comment: "Character",
  creator_id: "user_1",
  created_at: 10,
  updated_at: 20,
};

function registerListTermsTest(): void {
  test("lists terms with source-only fuzzy query and unwraps optional fields", async () => {
    const fetchMock = installFetch(okJson(termListResponse));
    const result = await listTerms(createClient(fetchMock), {
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
}

function registerTermLifecycleTest(): void {
  test("creates, gets, fully replaces, and deletes a term", async () => {
    const fetchMock = installFetch(
      okJson({ id: "term_1" }, 201),
      okJson(termRecordResponse),
      noContent(),
      noContent(),
    );
    const client = createClient(fetchMock);
    const createdTerm = await createTerm(client, {
      termbaseId: "termbase_1",
      source: "Hero",
      targets: ["勇者"],
      comment: "Character",
    });
    const fetchedTerm = await getTerm(client, "term_1");
    const updateResult = await updateTerm(client, "term_1", {
      source: "Heroine",
      targets: ["女主角", "主角"],
      comment: "",
    });
    const deletedTerm = await deleteTerm(client, "term_1");
    verifyCreatedTerm(fetchMock, createdTerm);
    verifyFetchedTerm(fetchMock, fetchedTerm);
    verifyUpdatedTerm(fetchMock, updateResult);
    verifyDeletedTerm(fetchMock, deletedTerm);
  });
}

function verifyCreatedTerm(
  fetchMock: ReturnType<typeof installFetch>,
  createdTerm: Awaited<ReturnType<typeof createTerm>>,
): void {
  const call = fetchCallAt(fetchMock, 0);
  expect(call.url).toBe("/api/v1/terms");
  expect(call.init?.method).toBe("POST");
  expect(bodyOf(call)).toEqual({
    termbase_id: "termbase_1",
    source: "Hero",
    targets: ["勇者"],
    comment: "Character",
  });
  expect(createdTerm).toEqual({ success: true, data: "term_1" });
}

function verifyFetchedTerm(
  fetchMock: ReturnType<typeof installFetch>,
  fetchedTerm: Awaited<ReturnType<typeof getTerm>>,
): void {
  expect(fetchCallAt(fetchMock, 1).url).toBe("/api/v1/terms/term_1");
  expect(fetchedTerm).toEqual({
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
}

function verifyUpdatedTerm(
  fetchMock: ReturnType<typeof installFetch>,
  updateResult: Awaited<ReturnType<typeof updateTerm>>,
): void {
  const call = fetchCallAt(fetchMock, 2);
  expect(call.url).toBe("/api/v1/terms/term_1");
  expect(call.init?.method).toBe("PUT");
  expect(bodyOf(call)).toEqual({
    id: "term_1",
    source: "Heroine",
    targets: ["女主角", "主角"],
    comment: "",
  });
  expect(updateResult).toEqual({ success: true, data: undefined });
}

function verifyDeletedTerm(
  fetchMock: ReturnType<typeof installFetch>,
  deletedTerm: Awaited<ReturnType<typeof deleteTerm>>,
): void {
  const call = fetchCallAt(fetchMock, 3);
  expect(call.url).toBe("/api/v1/terms/term_1");
  expect(call.init?.method).toBe("DELETE");
  expect(deletedTerm).toEqual({ success: true, data: undefined });
}

describe("termbase API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  registerListComicTermbasesTest();
  registerCreateComicTermbaseTest();
  registerTermbaseLifecycleTest();
});

describe("term API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  registerListTermsTest();
  registerTermLifecycleTest();
});
