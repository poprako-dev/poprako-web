import { requestAddress } from "@/test-resource/api-client";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi, type Mock } from "vitest";
import { createApiClient } from "@/api/client";
import { useComicPlaygroundActions } from "../use-comic-playground-actions";

afterEach(cleanup);

function fixture(): {
  fetchImpl: Mock<typeof fetch>;
  load: ReturnType<typeof useComicPlaygroundActions>["handleLoadComics"];
} {
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() =>
    Promise.resolve(
      Response.json({
        code: 0,
        data: {
          comics: [{ id: "comic", title: "归档漫画", is_archived: true, archived_at: 1234 }],
          pinned_chapters: [],
          pinned_chapter_assignments: [],
        },
      }),
    ),
  );
  const client = createApiClient({
    baseUrl: "https://example.test/api/v1",
    getAccessToken: () => "token",
    fetchImpl,
  });
  const hook = renderHook(() =>
    useComicPlaygroundActions({
      client,
      activeWorksetId: "workset-1",
      activeTitle: "雨后",
      activeStages: 123,
      loadWorksets: () => Promise.resolve(),
      retryComicDetail: vi.fn(),
      setRefreshKey: vi.fn(),
    }),
  );
  return { fetchImpl, load: hook.result.current.handleLoadComics };
}

test("archive browsing sends lifecycle, search and pagination without workflow expansion", async () => {
  const { fetchImpl, load } = fixture();
  const result = await load(40, 20, "archive", new AbortController().signal);
  const url = new URL(requestAddress(fetchImpl.mock.calls[0]?.[0]));
  expect(url.pathname).toBe("/api/v1/worksets/workset-1/comics");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    status: "archived",
    fuzzy_title: "雨后",
    offset: "40",
    limit: "20",
  });
  expect(result.success && result.data[0]?.archivedAt).toBe(1234);
  expect(fetchImpl.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
});

test.each(["translator", "reviewer"] as const)(
  "%s browsing explicitly requests active comics and retains filters",
  async (mode) => {
    const { fetchImpl, load } = fixture();
    await load(0, 20, mode);
    const query = new URL(requestAddress(fetchImpl.mock.calls[0]?.[0])).searchParams;
    expect(query.get("status")).toBe("active");
    expect(query.get("stages")).toBe("123");
    expect(query.getAll("with")).toEqual(
      mode === "reviewer" ? ["pinned_chapter", "pinned_chapter_assignment"] : ["pinned_chapter"],
    );
  },
);
