import { vi } from "vitest";

type FetchMock = ReturnType<
  typeof vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>
>;

type FetchCall = {
  url: string;
  init?: RequestInit | undefined;
};

export function okJson(data: unknown): Response {
  return Response.json(
    { code: 0, data },
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function noContent(): Promise<Response> {
  return Promise.resolve(new Response(null, { status: 204 }));
}

export function installFetch(response: Response | Promise<Response> = okJson([])): FetchMock {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    const resolvedResponse = await response;
    return resolvedResponse.clone();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function lastFetchCall(fetchMock: FetchMock): FetchCall {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) {
    throw new Error("Expected a fetch call");
  }
  return {
    url:
      typeof call[0] === "string"
        ? call[0]
        : call[0] instanceof Request
          ? call[0].url
          : call[0].href,
    init: call[1] ?? {},
  };
}

export function bodyOf(call: FetchCall): unknown {
  if (typeof call.init?.body !== "string") {
    throw new TypeError("Expected a string request body");
  }
  return JSON.parse(call.init.body);
}
