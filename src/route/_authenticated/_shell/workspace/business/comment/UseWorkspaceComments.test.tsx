import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { CommentChatBox } from "../CommentChatBox";
import { deferredResponse, workspaceComment, workspaceSession } from "../workspace-test-fixture";
import { WorkspaceTestProvider } from "../WorkspaceTestFixture";
import { useWorkspaceComments } from "./use-workspace-comments";

afterEach(() => vi.unstubAllGlobals());

function setup(fetchImpl: typeof fetch): RenderHookResult<
  ReturnType<typeof useWorkspaceComments>,
  { teamId: string | null }
> & {
  changeSession: () => void;
} {
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  let session = workspaceSession();
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <WorkspaceTestProvider client={client} session={session}>
        {children}
      </WorkspaceTestProvider>
    );
  }
  const initialProps: { teamId: string | null } = { teamId: "team-a" };
  const hook = renderHook(({ teamId }: { teamId: string | null }) => useWorkspaceComments(teamId), {
    wrapper: Wrapper,
    initialProps,
  });
  return {
    ...hook,
    changeSession: () => {
      session = workspaceSession(session.generation + 1);
      hook.rerender({ teamId: "team-a" });
    },
  };
}

test("team switch aborts the old read and prevents its late response from replacing comments", async () => {
  const old = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(Response.json({ code: 0, data: [workspaceComment("new", "team-b")] }));
  const view = setup(fetchImpl);
  const signal = fetchImpl.mock.calls[0]?.[1]?.signal;
  view.rerender({ teamId: "team-b" });
  expect(signal?.aborted).toBe(true);
  await waitFor(() => {
    expect(view.result.current.comments[0]?.id).toBe("new");
  });
  await act(async () => {
    old.resolve([workspaceComment("old")]);
    await old.promise;
  });
  expect(view.result.current.comments.map((item) => item.id)).toEqual(["new"]);
  view.rerender({ teamId: null });
  expect(view.result.current.comments).toEqual([]);
});

test("a completed write for a previous identity cannot enter the new identity's comments", async () => {
  const send = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: [workspaceComment("before")] }))
    .mockReturnValueOnce(send.promise)
    .mockResolvedValueOnce(Response.json({ code: 0, data: [workspaceComment("after")] }));
  const view = setup(fetchImpl);
  await waitFor(() => {
    expect(view.result.current.commentsLoading).toBe(false);
  });
  let sending = Promise.resolve();
  act(() => {
    sending = view.result.current.handleSendComment("previous identity");
  });
  const writeSignal = fetchImpl.mock.calls[1]?.[1]?.signal;
  view.changeSession();
  expect(writeSignal?.aborted).toBe(false);
  await waitFor(() => {
    expect(view.result.current.comments[0]?.id).toBe("after");
  });
  await act(async () => {
    send.resolve({ id: "late-write" });
    await sending;
  });
  expect(view.result.current.comments.map((item) => item.id)).toEqual(["after"]);
});

test("refresh keeps comments and does not discard a send completed while reading", async () => {
  const refresh = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: [workspaceComment("initial")] }))
    .mockReturnValueOnce(refresh.promise)
    .mockResolvedValueOnce(Response.json({ code: 0, data: { id: "sent" } }));
  const view = setup(fetchImpl);
  await waitFor(() => {
    expect(view.result.current.commentsLoading).toBe(false);
  });
  let reading = Promise.resolve();
  act(() => {
    reading = view.result.current.refreshComments();
  });
  expect(view.result.current.commentsLoading).toBe(true);
  expect(view.result.current.comments[0]?.id).toBe("initial");
  await act(async () => {
    await view.result.current.handleSendComment("new message");
  });
  await act(async () => {
    refresh.resolve([workspaceComment("initial")]);
    await reading;
  });
  expect(view.result.current.comments.map((item) => item.id)).toEqual(["initial", "sent"]);
});

test("background refresh leaves message text visible", () => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  render(
    <CommentChatBox
      comments={[{ id: "a", teamId: "team", userId: "reader", content: "existing", createdAt: 1 }]}
      loading
      onSend={() => Promise.resolve()}
    />,
  );
  expect(screen.getByText("existing")).toBeVisible();
  expect(screen.queryByText("加载中…")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "reply" } });
  expect(screen.getByRole("textbox")).toHaveValue("reply");
});

test("a newer refresh cancels an older read and owns the loading state", async () => {
  const old = deferredResponse();
  const next = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(next.promise);
  const view = setup(fetchImpl);
  const signal = fetchImpl.mock.calls[0]?.[1]?.signal;
  let reading = Promise.resolve();
  act(() => {
    reading = view.result.current.refreshComments();
  });
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    old.resolve([workspaceComment("old")]);
    await old.promise;
  });
  expect(view.result.current.commentsLoading).toBe(true);
  expect(view.result.current.comments).toEqual([]);
  await act(async () => {
    next.resolve([workspaceComment("latest")]);
    await reading;
  });
  expect(view.result.current.commentsLoading).toBe(false);
  expect(view.result.current.comments.map((item) => item.id)).toEqual(["latest"]);
});

test("refresh drops earlier local sends outside the server's latest fifteen comments", async () => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: [] }));
  const view = setup(fetchImpl);
  await waitFor(() => {
    expect(view.result.current.commentsLoading).toBe(false);
  });
  for (let index = 0; index < 16; index++) {
    fetchImpl.mockResolvedValueOnce(
      Response.json({ code: 0, data: { id: `sent-${String(index)}` } }),
    );
    await act(async () => {
      await view.result.current.handleSendComment(`message-${String(index)}`);
    });
  }
  const latest = Array.from({ length: 15 }, (_, index) =>
    workspaceComment(`sent-${String(15 - index)}`),
  );
  fetchImpl.mockResolvedValueOnce(Response.json({ code: 0, data: latest }));
  await act(async () => {
    await view.result.current.refreshComments();
  });
  const expected = [...latest].reverse().map((comment) => comment.id);
  expect(view.result.current.comments.map((comment) => comment.id)).toEqual(expected);
  fetchImpl.mockResolvedValueOnce(Response.json({ code: 0, data: latest }));
  await act(async () => {
    await view.result.current.refreshComments();
  });
  expect(view.result.current.comments.map((comment) => comment.id)).toEqual(expected);
});

test("a send started before refresh is retained when it completes after the read begins", async () => {
  const send = deferredResponse();
  const refresh = deferredResponse();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ code: 0, data: [workspaceComment("initial")] }))
    .mockReturnValueOnce(send.promise)
    .mockReturnValueOnce(refresh.promise);
  const view = setup(fetchImpl);
  await waitFor(() => {
    expect(view.result.current.commentsLoading).toBe(false);
  });
  let sending = Promise.resolve();
  let reading = Promise.resolve();
  act(() => {
    sending = view.result.current.handleSendComment("pending message");
    reading = view.result.current.refreshComments();
  });
  await act(async () => {
    send.resolve({ id: "sent" });
    await sending;
    refresh.resolve([workspaceComment("initial")]);
    await reading;
  });
  expect(view.result.current.comments.map((comment) => comment.id)).toEqual(["initial", "sent"]);
});
