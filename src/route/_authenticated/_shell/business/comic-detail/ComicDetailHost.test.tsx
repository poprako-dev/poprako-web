import { useState } from "react";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { createTestApi, requestAddress } from "@/test-resource/api-client";
import { makeUser } from "./test/comic-detail-story-fixtures";
import { detailChapter, detailComic } from "../test/detail-request-fixture";
import { useComicDetailHost } from "./use-comic-detail-host";
import type { ComicDetailSearch } from "./use-comic-detail-host";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";

const showToast = vi.fn();
const onNavigateToWorkbench = vi.fn();
const storageKey = "comic-detail:mode:mode-preference-user";
const client = createTestApi();

beforeEach(() => {
  localStorage.removeItem(storageKey);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const address = requestAddress(input);
      const data = address.endsWith("/chapters/pinned")
        ? detailChapter("comic-b")
        : detailComic("comic-b", "team-b");
      return Promise.resolve(Response.json({ code: 0, data }));
    }),
  );
});

afterEach(() => {
  localStorage.removeItem(storageKey);
  vi.unstubAllGlobals();
});

type Props = { children: ReactNode };

function Wrapper({ children }: Props): ReactNode {
  return (
    <ApiProvider client={client}>
      <ReadySessionProvider
        value={{
          generation: 0,
          userInfo: makeUser("mode-preference-user", "成员"),
          memberInfos: [],
        }}
      >
        {children}
      </ReadySessionProvider>
    </ApiProvider>
  );
}

function useScenario(): ReturnType<typeof useComicDetailHost> {
  const [search, setSearch] = useState<ComicDetailSearch>({});
  function onChangeSearch(
    comicId: string | null,
    chapterId: string | null,
    mode?: ComicDetailMode,
  ): void {
    setSearch({
      comicId: comicId ?? undefined,
      chapterId: chapterId ?? undefined,
      detailMode: mode,
    });
  }
  return useComicDetailHost({
    returnTo: "/comic-playground",
    search,
    onChangeSearch,
    showToast,
    onNavigateToWorkbench,
  });
}

test("reopening from a translation card preserves the selected reviewer mode", () => {
  const { result, unmount } = renderHook(useScenario, { wrapper: Wrapper });
  act(() => {
    result.current.openComicDetail("comic-b");
  });
  act(() => {
    result.current.changeDetailMode("reviewer", null);
  });
  expect(localStorage.getItem(storageKey)).toBe("reviewer");
  act(() => {
    result.current.clearComicDetail();
  });
  act(() => {
    result.current.openComicDetail("comic-b");
  });
  expect(result.current.detailMode).toBe("reviewer");
  expect(localStorage.getItem(storageKey)).toBe("reviewer");
  unmount();
  const reopened = renderHook(useScenario, { wrapper: Wrapper });
  act(() => {
    reopened.result.current.openComicDetail("comic-b");
  });
  expect(reopened.result.current.detailMode).toBe("reviewer");
});

test("opening a comic defaults to translation when no preference exists", () => {
  const { result } = renderHook(useScenario, { wrapper: Wrapper });
  act(() => {
    result.current.openComicDetail("comic-b");
  });
  expect(result.current.detailMode).toBe("translator");
  expect(localStorage.getItem(storageKey)).toBe("translator");
});
