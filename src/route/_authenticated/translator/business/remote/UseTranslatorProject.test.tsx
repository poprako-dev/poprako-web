import { act, cleanup, renderHook, waitFor, type RenderHookResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { useAppStore } from "@/route/business/session/session-store";
import { useTranslatorProject } from "./use-translator-project";

type PendingResponse = {
  promise: Promise<Response>;
  resolve: (data: unknown, status?: number) => void;
};

function pendingResponse(): PendingResponse {
  let finish!: (response: Response) => void;
  const promise = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  return {
    promise,
    resolve: (data, status = 200) => {
      finish(Response.json(status === 200 ? { code: 0, data } : { message: data }, { status }));
    },
  };
}

function mountProject(
  fetchImpl: typeof fetch,
): RenderHookResult<ReturnType<typeof useTranslatorProject>, { chapterId: string }> {
  useAppStore.getState().setAccessToken("project-test");
  const client = createApiClient({
    baseUrl: "/api",
    getAccessToken: () => "project-test",
    fetchImpl,
  });
  const session = {
    generation: useAppStore.getState().generation,
    memberInfos: [],
    userInfo: {
      id: "reader",
      name: "Reader",
      qq: "1",
      avatarUrl: "",
      isSuperAdmin: false,
      lastActiveAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  };
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <ApiProvider client={client}>
        <ReadySessionProvider value={session}>{children}</ReadySessionProvider>
      </ApiProvider>
    );
  }
  return renderHook(({ chapterId }) => useTranslatorProject(chapterId), {
    wrapper: Wrapper,
    initialProps: { chapterId: "first" },
  });
}

function chapter(id: string): object {
  return {
    id,
    comic_id: "comic",
    creator_id: "reader",
    index: 0,
    subtitle: id,
    page_count: 1,
    total_unit_count: 0,
    translated_unit_count: 0,
    proofread_unit_count: 0,
    is_pinned: false,
    stages: 0,
    created_at: 1,
    updated_at: 1,
  };
}

function pages(chapterId: string): object[] {
  return [
    {
      id: `page-${chapterId}`,
      chapter_id: chapterId,
      index: 0,
      total_unit_count: 0,
      translated_unit_count: 0,
      proofread_unit_count: 0,
      created_at: 1,
      updated_at: 1,
    },
  ];
}

afterEach(() => {
  cleanup();
  useAppStore.getState().setAccessToken(null);
});

test.each(["chapter", "pages", "access"] as const)(
  "%s failure is shown before other required inputs settle and aborts those reads",
  async (failure) => {
    const requests = [pendingResponse(), pendingResponse(), pendingResponse()] as const;
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(requests[0].promise)
      .mockReturnValueOnce(requests[1].promise)
      .mockReturnValueOnce(requests[2].promise);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const view = mountProject(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const failedIndex = failure === "chapter" ? 0 : failure === "pages" ? 1 : 2;
    await act(async () => {
      requests[failedIndex].resolve("unavailable", 503);
      await requests[failedIndex].promise;
    });
    await waitFor(() => {
      expect(view.result.current.state.status).toBe("error");
    });
    for (const [index, call] of fetchImpl.mock.calls.entries()) {
      if (index !== failedIndex) expect(call[1]?.signal?.aborted).toBe(true);
    }
    await act(async () => {
      requests[0].resolve(chapter("first"));
      requests[1].resolve(pages("first"));
      requests[2].resolve([]);
      await Promise.all(requests.map((request) => request.promise));
    });
    expect(view.result.current.state.status).toBe("error");
  },
);

test("empty pages fail immediately without waiting for chapter or permission scans", async () => {
  const detail = pendingResponse();
  const access = pendingResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(detail.promise)
    .mockResolvedValueOnce(Response.json({ code: 0, data: [] }))
    .mockReturnValueOnce(access.promise);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const view = mountProject(fetchImpl);
  await waitFor(() => {
    expect(view.result.current.state).toEqual({ status: "error", message: "当前章节暂无页面" });
  });
  expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  expect(fetchImpl.mock.calls[2]?.[1]?.signal?.aborted).toBe(true);
  await act(async () => {
    detail.resolve(chapter("first"));
    access.resolve([]);
    await Promise.all([detail.promise, access.promise]);
  });
});

test("switching chapters cancels all old inputs and keeps late results out of the new project", async () => {
  const old = [pendingResponse(), pendingResponse(), pendingResponse()] as const;
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(old[0].promise)
    .mockReturnValueOnce(old[1].promise)
    .mockReturnValueOnce(old[2].promise)
    .mockResolvedValueOnce(Response.json({ code: 0, data: chapter("second") }))
    .mockResolvedValueOnce(Response.json({ code: 0, data: pages("second") }))
    .mockResolvedValueOnce(Response.json({ code: 0, data: [] }));
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const view = mountProject(fetchImpl);
  view.rerender({ chapterId: "second" });
  expect(fetchImpl.mock.calls.slice(0, 3).every((call) => call[1]?.signal?.aborted)).toBe(true);
  await waitFor(() => {
    expect(view.result.current.state.status).toBe("ready");
  });
  await act(async () => {
    old[0].resolve(chapter("first"));
    old[1].resolve(pages("first"));
    old[2].resolve([]);
    await Promise.all(old.map((request) => request.promise));
  });
  expect(view.result.current.state).toMatchObject({ status: "ready", project: { id: "second" } });
  expect(error).not.toHaveBeenCalled();
});

test.each(["unmount", "identity"] as const)("%s cancels all project reads", async (change) => {
  const requests = [pendingResponse(), pendingResponse(), pendingResponse()] as const;
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(requests[0].promise)
    .mockReturnValueOnce(requests[1].promise)
    .mockReturnValueOnce(requests[2].promise);
  const view = mountProject(fetchImpl);
  expect(fetchImpl).toHaveBeenCalledTimes(3);
  act(() => {
    if (change === "unmount") view.unmount();
    else useAppStore.getState().setAccessToken("replacement");
  });
  expect(fetchImpl.mock.calls.every((call) => call[1]?.signal?.aborted)).toBe(true);
  await act(async () => {
    requests[0].resolve(chapter("first"));
    requests[1].resolve(pages("first"));
    requests[2].resolve([]);
    await Promise.all(requests.map((request) => request.promise));
  });
});
