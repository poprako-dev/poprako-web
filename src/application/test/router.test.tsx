import { afterEach, describe, expect, test, vi } from "vitest";
import { createRouterFixture } from "@/application/test/router-fixture";
import { parseRouteSearch, stringifyRouteSearch } from "@/application/router";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

const mocks = vi.hoisted(() => ({ ensureSession: vi.fn() }));
const sessionStoreMock = vi.hoisted(() => {
  const state = { accessToken: null as string | null, generation: 0 };
  return {
    setAccessToken(accessToken: string | null) {
      state.accessToken = accessToken;
      state.generation += 1;
    },
    getState: () => state,
    subscribe: vi.fn(() => () => undefined),
  };
});
vi.mock("@/route/business/session/session", () => ({ ensureSession: mocks.ensureSession }));
vi.mock("@/route/business/session/session-store", () => ({
  useAppStore: {
    getState: sessionStoreMock.getState,
    subscribe: sessionStoreMock.subscribe,
  },
}));

describe("router search compatibility", () => {
  test("keeps scalar strings, first duplicate values, unknown keys and empty values", () => {
    const parsed = parseRouteSearch(
      "?comicId=00123&long=900719925474099312345&readOnly=true&empty=&tag=a&tag=b",
    );
    expect(parsed).toEqual({
      comicId: "00123",
      long: "900719925474099312345",
      readOnly: "true",
      empty: "",
      tag: "a",
    });
    expect(stringifyRouteSearch(parsed)).toBe(
      "?comicId=00123&long=900719925474099312345&readOnly=true&empty=&tag=a",
    );
  });

  test("encodes unicode and spaces without JSON coercion", () => {
    const query = stringifyRouteSearch({ id: "作品 1", readOnly: "false" });
    expect(query).toBe("?id=%E4%BD%9C%E5%93%81+1&readOnly=false");
    expect(parseRouteSearch(query)).toEqual({
      id: "作品 1",
      readOnly: "false",
    });
    expect(() => stringifyRouteSearch({ id: 123 })).toThrow(TypeError);
  });
});

describe("file route direct entry", () => {
  afterEach(() => {
    sessionStoreMock.setAccessToken(null);
    vi.clearAllMocks();
  });

  test.each([
    "/",
    "/login",
    "/workspace?comicId=00123&chapterId=0002",
    "/comic-playground?comicId=99999999999999999999999",
    "/member-list",
    "/system-mail",
    "/utilities",
    "/settings",
    "/translator/chapter_1/page_2?returnTo=%2Fworkspace&readOnly=true",
  ])("matches %s through the generated tree", async (url) => {
    mocks.ensureSession.mockResolvedValue({});
    const { router } = createRouterFixture(url);
    await router.load();
    expect(router.state.matches.length).toBeGreaterThan(0);
    const expectedPath = url === "/" ? "/workspace" : url.split("?")[0];
    expect(router.state.location.pathname).toBe(expectedPath);
  });

  test("redirects a failed identity guard to login and replaces the protected entry", async () => {
    sessionStoreMock.setAccessToken("active-token");
    const toast = vi.spyOn(useToastStore.getState(), "showToast");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.ensureSession.mockRejectedValue(new Error("identity unavailable"));
    const { history, router } = createRouterFixture("/workspace?comicId=00123");
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
    expect(toast).toHaveBeenCalledWith("无法恢复登录状态", "error");
    expect(log).toHaveBeenCalledTimes(1);

    history.back();
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
    expect(mocks.ensureSession).toHaveBeenCalledTimes(1);
  });

  test("keeps an anonymous auth redirect quiet", async () => {
    sessionStoreMock.setAccessToken(null);
    const toast = vi.spyOn(useToastStore.getState(), "showToast");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.ensureSession.mockRejectedValue(new Error("no token"));

    const { router } = createRouterFixture("/workspace");
    await router.load();

    expect(router.state.location.pathname).toBe("/login");
    expect(toast).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  test("translator navigation pushes a typed URL and browser back returns to workspace", async () => {
    mocks.ensureSession.mockResolvedValue({});
    const { router } = createRouterFixture("/workspace?comicId=00123&chapterId=0007");
    await router.load();
    await router.navigate({
      to: "/translator/$chapterId/$pageId",
      params: { chapterId: "0007", pageId: "0009" },
      search: {
        returnTo: "/workspace",
        comicId: "00123",
        chapterId: "0007",
        readOnly: "true",
      },
    });
    expect(router.state.location.pathname).toBe("/translator/0007/0009");
    expect(router.state.location.search).toMatchObject({
      comicId: "00123",
      readOnly: "true",
    });

    router.history.back();
    await router.load();
    expect(router.state.location.pathname).toBe("/workspace");
    expect(router.state.location.search).toMatchObject({
      comicId: "00123",
      chapterId: "0007",
    });
  });
});
