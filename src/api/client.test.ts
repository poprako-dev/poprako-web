import { describe, expect, test, vi } from "vitest";
import type { ApiClient } from "@/api/client";
import { createApiClient } from "@/api/client";
import { decodeObject, decodeString, decodeVoid } from "@/api/contract";

function createClient(fetchImpl: typeof fetch, token = "token-1"): ApiClient {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => token,
    fetchImpl,
  });
}

function okJson(data: unknown): Response {
  return Response.json({ code: 0, data });
}

describe("ApiClient JSON transport", () => {
  test("encodes query/body keys and recursively decodes response keys", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      okJson({
        user_id: "u1",
        active_team: { team_id: "t1", is_active: false },
      }),
    );
    const client = createClient(fetchMock);

    const result = await client.post(
      "/users",
      { displayName: "A", nestedValues: [0, false, null] },
      {
        query: {
          includeDetails: ["teamInfo", "userInfo"],
          zeroValue: 0,
          disabled: false,
        },
        decode: (value) => {
          const data = decodeObject(value);
          return {
            userId: decodeString(data["userId"]),
            activeTeam: data["activeTeam"],
          };
        },
      },
    );

    expect(result).toEqual({
      success: true,
      data: { userId: "u1", activeTeam: { teamId: "t1", isActive: false } },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(
      "/api/v1/users?include_details=teamInfo&include_details=userInfo&zero_value=0&disabled=false",
    );
    expect(init?.credentials).toBe("omit");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer token-1");
    if (typeof init?.body !== "string") {
      throw new Error("Expected JSON request body");
    }
    expect(JSON.parse(init.body)).toEqual({
      display_name: "A",
      nested_values: [0, false, null],
    });
  });
});

describe("ApiClient JSON transport", () => {
  test("does not alter caller headers or nested headers dictionary keys", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(okJson({ headers: { "x-amz-meta-user_id": "v" } }));
    const client = createClient(fetchMock);
    const callerHeaders = { "X-Custom-Key": "HeaderValue" };

    const result = await client.get("/upload", {
      headers: callerHeaders,
      auth: "none",
      decode: (value) => {
        const data = decodeObject(value);
        return data["headers"];
      },
    });

    expect(result).toEqual({
      success: true,
      data: { "x-amz-meta-user_id": "v" },
    });
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).get("x-custom-key")).toBe("HeaderValue");
    expect(new Headers(init?.headers).has("authorization")).toBe(false);
  });
});

describe("ApiClient JSON transport", () => {
  test("accepts 204 through the endpoint's explicit void decoder", async () => {
    const client = createClient(
      vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(client.delete("/users/u1", { decode: decodeVoid })).resolves.toEqual({
      success: true,
      data: undefined,
    });
  });
});

describe("ApiClient JSON transport", () => {
  test("preserves HTTP status and business code, including 422 validation", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ code: 0, message: "输入无效" }, { status: 422 }))
      .mockResolvedValueOnce(Response.json({ code: 1604, message: "阶段不匹配" }));
    const client = createClient(fetchMock);

    await expect(client.get("/validation", { decode: decodeVoid })).resolves.toEqual({
      success: false,
      error: "输入无效",
      httpStatus: 422,
      failureKind: "http",
      code: 0,
    });
    await expect(client.get("/workflow", { decode: decodeVoid })).resolves.toEqual({
      success: false,
      error: "阶段不匹配",
      httpStatus: 200,
      failureKind: "business",
      code: 1604,
    });
  });
});

describe("ApiClient JSON transport", () => {
  test("rejects invalid envelopes and invalid endpoint data as protocol failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: { name: "A" } }))
      .mockResolvedValueOnce(okJson({ name: 3 }));
    const client = createClient(fetchMock);

    await expect(client.get("/missing-code", { decode: decodeVoid })).resolves.toMatchObject({
      success: false,
      failureKind: "protocol",
      httpStatus: 200,
    });
    await expect(
      client.get("/bad-data", { decode: (value) => decodeString(value) }),
    ).resolves.toMatchObject({
      success: false,
      failureKind: "protocol",
      httpStatus: 200,
    });
  });
});

describe("ApiClient JSON transport", () => {
  test("preserves cancellation during response body consumption", async () => {
    const controller = new AbortController();
    let finishRead: (() => void) | undefined;
    const response = new Response(null, { status: 200 });
    let markReading: (() => void) | undefined;
    response.text = () =>
      new Promise<string>((_resolve, reject) => {
        markReading?.();
        finishRead = () => {
          reject(new DOMException("Aborted", "AbortError"));
        };
      });
    const reading = new Promise<void>((resolve) => {
      markReading = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
    const client = createClient(fetchMock);
    const resultPromise = client.get("/slow", {
      signal: controller.signal,
      decode: decodeVoid,
    });
    await reading;
    controller.abort();
    finishRead?.();

    await expect(resultPromise).resolves.toMatchObject({
      success: false,
      failureKind: "aborted",
    });
  });
});

describe("ApiClient text and external download", () => {
  test("text endpoint keeps API error envelope details", async () => {
    const client = createClient(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ code: 5031, message: "导出不可用" }, { status: 503 })),
    );
    await expect(client.getText("/chapters/c1/export")).resolves.toEqual({
      success: false,
      error: "导出不可用",
      httpStatus: 503,
      failureKind: "http",
      code: 5031,
    });
  });

  test("external downloads use the exact URL without Bearer or JSON defaults", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(new Blob(["image"])));
    const client = createClient(fetchMock);
    const result = await client.download("https://storage.example/object");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeInstanceOf(Blob);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://storage.example/object");
    expect(new Headers(init?.headers).has("authorization")).toBe(false);
    expect(new Headers(init?.headers).has("content-type")).toBe(false);
  });
});
