import { beforeEach, describe, expect, test, vi, type Mock } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

import {
  api,
  showLocalApiFailure,
  showLocalCaughtError,
  toApiRequestError,
} from "@/routes/business/request";

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

function installFetch(response: Response): FetchMock {
  const fetchMock: FetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api util", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.getState().hideToast();
  });

  test("serializes array query params as repeated keys for poprako-r incl", async () => {
    const fetchMock = installFetch(
      Response.json(
        { code: 0, data: [] },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await api.get("/members", {
      owner_id: "user_1",
      incl: ["team", "user"],
      offset: 0,
      limit: 100,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/v1/members?owner_id=user_1&incl=team&incl=user&offset=0&limit=100",
    );
  });

  test("rejects non-zero application codes even when HTTP status is ok", async () => {
    installFetch(
      Response.json(
        { code: 3, message: "auth failed" },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(api.get("/users/me")).resolves.toEqual({
      success: false,
      error: "auth failed",
    });
  });

  test("reports backend 422 messages exactly once at the HTTP boundary", async () => {
    const showToast = vi.spyOn(useToastStore.getState(), "showToast");
    installFetch(
      Response.json(
        { code: 422, message: "后端校验消息" },
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await api.post("/validation", {});

    expect(result).toEqual({
      success: false,
      error: "后端校验消息",
      httpStatus: 422,
    });
    expect(showToast).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenCalledWith("后端校验消息", "error");
  });

  test("does not let local fallbacks overwrite an already reported 422", () => {
    const showToast = vi.fn();
    const failure = {
      success: false as const,
      error: "后端校验消息",
      httpStatus: 422,
    };

    showLocalApiFailure(failure, showToast, "操作失败");
    showLocalCaughtError(toApiRequestError(failure), showToast, "操作失败");

    expect(showToast).not.toHaveBeenCalled();
  });

  test("logs a protocol error when a 422 response omits message", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const showToast = vi.spyOn(useToastStore.getState(), "showToast");
    installFetch(
      Response.json(
        { code: 422 },
        {
          status: 422,
          statusText: "Unprocessable Entity",
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(api.get("/invalid-response")).resolves.toEqual({
      success: false,
      error: "Unprocessable Entity",
      httpStatus: 422,
    });
    expect(consoleError).toHaveBeenCalledWith("[API] HTTP 422 响应缺少有效 message", {
      message: undefined,
    });
    expect(showToast).toHaveBeenCalledWith("Unprocessable Entity", "error");
  });

  test("keeps existing local fallbacks for non-422 failures", () => {
    const showToast = vi.fn();

    showLocalApiFailure(
      { success: false, error: "internal detail", httpStatus: 500 },
      showToast,
      "操作失败",
    );

    expect(showToast).toHaveBeenCalledWith("操作失败", "error");
  });

  test("accepts empty 204 responses as undefined data", async () => {
    installFetch(new Response(null, { status: 204 }));

    await expect(api.post<undefined, Record<string, never>>("/auth/logout", {})).resolves.toEqual({
      success: true,
      data: undefined,
    });
  });

  test("does not send cookies that can override authorization headers", async () => {
    const fetchMock = installFetch(
      Response.json(
        { code: 0, data: {} },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await api.get("/users/me");

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("omit");
  });
});
