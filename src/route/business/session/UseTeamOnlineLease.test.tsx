import type { ReactElement, ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import type { LoginState } from "@/route/business/identity/login-state";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { ReadySessionProvider } from "./ReadySessionProvider";
import { useAppStore } from "./session-store";
import { useTeamOnlineLease } from "./use-team-online-lease";

function loginFixture(): LoginState {
  const userInfo = {
    id: "user",
    qq: "10000",
    name: "测试成员",
    avatarUrl: "",
    isSuperAdmin: false,
    lastActiveAt: 0,
    createdAt: 0,
    updatedAt: 0,
  };
  const memberInfos = ["first", "second"].map((id) => ({
    id: `member-${id}`,
    userId: userInfo.id,
    teamId: id,
    roles: 0,
    createdAt: 0,
    updatedAt: 0,
    team: { id, name: id, description: "", avatarUrl: "", createdAt: 0, updatedAt: 0 },
  }));
  return { userInfo, memberInfos };
}

function mountLease(fetchImpl: typeof fetch, strict = false): ReturnType<typeof renderHook> {
  const login = loginFixture();
  useAppStore.getState().setAccessToken("session-token");
  useAppStore.getState().setLoginState(login);
  const ready = { ...login, generation: useAppStore.getState().generation };
  const api = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session-token",
    fetchImpl,
  });
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    const tree = (
      <ApiProvider client={api}>
        <ReadySessionProvider value={ready}>{children}</ReadySessionProvider>
      </ApiProvider>
    );
    return tree;
  }
  return renderHook(useTeamOnlineLease, { wrapper: Wrapper, reactStrictMode: strict });
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("team online lease lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  afterEach(() => {
    cleanup();
    useAppStore.getState().setAccessToken(null);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("renews the current team and removes timer and visibility work on unmount", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    const view = mountLease(fetchImpl);
    await flush();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/v1/teams/first/mark-self-online");
    act(() => {
      useAppStore.getState().setSelectedTeamId("second");
    });
    await flush();
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("/api/v1/teams/second/mark-self-online");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await flush();
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  test("strict-mode remount aborts the discarded request without leaking its timer", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    const view = mountLease(fetchImpl, true);
    await flush();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("ignores a failed response belonging to an old login generation", async () => {
    const pending: { resolve?: (response: Response) => void } = {};
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          pending.resolve = resolve;
        }),
    );
    const showToast = vi.spyOn(useToastStore.getState(), "showToast");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mountLease(fetchImpl);
    act(() => {
      useAppStore.getState().setAccessToken("another-user");
    });
    if (!pending.resolve) throw new Error("lease request did not start");
    pending.resolve(Response.json({ code: 12, message: "expired" }, { status: 401 }));
    await flush();
    expect(showToast).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
