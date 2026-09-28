import { type Mock, vi } from "vitest";

type FetchCall = {
  url: string;
  init?: RequestInit | undefined;
};

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

export function okJson(data: unknown): Promise<Response> {
  return Promise.resolve(
    Response.json(
      { code: 0, data },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
}

export function noContent(): Promise<Response> {
  return Promise.resolve(new Response(null, { status: 204 }));
}

export function installFetch(response: Promise<Response>): FetchMock {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    const value = await response;
    return value.clone();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function fetchCallAt(fetchMock: FetchMock, index: number): FetchCall {
  const call = fetchMock.mock.calls[index];
  if (!call) {
    throw new Error("Missing fetch call at index " + String(index));
  }
  return {
    // RequestInfo can be a Request object in browser-like test environments.
    url: String(call[0]), // eslint-disable-line @typescript-eslint/no-base-to-string
    init: call[1],
  };
}

export function lastFetchCall(fetchMock: FetchMock): FetchCall {
  return fetchCallAt(fetchMock, fetchMock.mock.calls.length - 1);
}

export function bodyOf(call: FetchCall): unknown {
  const body = call.init?.body;
  return JSON.parse(typeof body === "string" ? body : JSON.stringify(body));
}
