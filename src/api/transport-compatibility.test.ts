import { describe, expect, test, vi } from "vitest";
import { createApiClient } from "./client";
import { decodeArray, decodeString, decodeVoid } from "./contract";

describe("existing Web HTTP behavior at the injected boundary", () => {
  test("keeps repeated incl and literal ID/query values without cookies", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 0, data: [] }));
    const api = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => "session", fetchImpl });
    await api.get("/members", {
      query: { ownerId: "00123", incl: ["team", "user"], offset: 0, limit: 100, isPending: false },
      decode: (value) => decodeArray(value, decodeString),
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "/api/v1/members?owner_id=00123&incl=team&incl=user&offset=0&limit=100&is_pending=false",
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.credentials).toBe("omit");
  });
});

describe("existing Web HTTP behavior at the injected boundary", () => {
  test("reads credentials per request and never adds them to public or external requests", async () => {
    let token = "first-session";
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    const api = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => token, fetchImpl });
    await api.get("/users/me", { decode: decodeVoid });
    token = "second-session";
    await api.get("/users/me", { decode: decodeVoid });
    await api.get("/public", { auth: "none", decode: decodeVoid });
    await api.download("https://storage.example.test/image?signature=keep_this_value");
    const authorizations = fetchImpl.mock.calls.map((call) =>
      new Headers(call[1]?.headers).get("authorization"),
    );
    expect(authorizations).toEqual(["Bearer first-session", "Bearer second-session", null, null]);
    expect(fetchImpl.mock.calls[3]?.[0]).toBe(
      "https://storage.example.test/image?signature=keep_this_value",
    );
    expect(new Headers(fetchImpl.mock.calls[3]?.[1]?.headers).has("content-type")).toBe(false);
  });
});

describe("existing Web HTTP behavior at the injected boundary", () => {
  test("keeps business failure metadata even for successful HTTP status", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1",
      getAccessToken: () => null,
      fetchImpl: vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ code: 3, message: "auth failed" })),
    });
    expect(await api.get("/users/me", { decode: decodeVoid })).toEqual({
      success: false,
      error: "auth failed",
      failureKind: "business",
      code: 3,
      httpStatus: 200,
    });
  });
});

describe("existing Web HTTP behavior at the injected boundary", () => {
  test("uses HTTP fallback for missing 422 message without UI or logging side effects", async () => {
    const log = vi.spyOn(console, "error");
    try {
      const api = createApiClient({
        baseUrl: "/api/v1",
        getAccessToken: () => null,
        fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(
          Response.json(
            { code: 422 },
            {
              status: 422,
              statusText: "Unprocessable Entity",
            },
          ),
        ),
      });
      expect(await api.get("/invalid", { decode: decodeVoid })).toEqual({
        success: false,
        error: "Unprocessable Entity",
        httpStatus: 422,
        code: 422,
        failureKind: "http",
      });
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
