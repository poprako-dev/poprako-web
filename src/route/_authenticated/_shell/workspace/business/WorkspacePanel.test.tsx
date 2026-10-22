import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactElement } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import type { ApiClient } from "@/api/client";
import { requestAddress } from "@/test-resource/api-client";
import { detailChapter, detailComic } from "../../business/test/detail-request-fixture";
import { WorkspacePanel } from "./WorkspacePanel";
import { deferredResponse, workspaceSession } from "./workspace-test-fixture";
import { WorkspaceTestProvider } from "./WorkspaceTestFixture";

const callbacks = new Set<() => void>();

class TestObserver {
  private readonly notify: () => void;
  constructor(callback: IntersectionObserverCallback) {
    this.notify = () => {
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    };
  }
  observe(): void {
    callbacks.add(this.notify);
  }
  disconnect(): void {
    callbacks.delete(this.notify);
  }
}

function prepareObservers(): (desktop: boolean) => void {
  let desktop = false;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return desktop;
    },
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  }));
  vi.stubGlobal("IntersectionObserver", TestObserver);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 300, 500),
  );
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  return (nextDesktop) => {
    act(() => {
      desktop = nextDesktop;
      for (const listener of listeners) listener();
    });
  };
}

afterEach(() => {
  callbacks.clear();
  vi.unstubAllGlobals();
});

const props: ComponentProps<typeof WorkspacePanel> = {
  username: "Reader",
  selectedTeamId: "team-a",
  team: { id: "team-a", name: "Team" },
  isAdmin: false,
  onlineCount: 0,
  onlineUsers: [],
  onlineStatus: "ready",
  comments: [],
  commentsLoading: false,
  onSendComment: () => Promise.resolve(),
  mobileTab: 0,
  onChangeMobileTab: () => undefined,
  onTouchStart: () => undefined,
  onTouchEnd: () => undefined,
  comicListRefreshKey: 0,
  onComicClick: () => undefined,
};

function assignments(): object[] {
  return Array.from({ length: 12 }, (_, index) => {
    const id = `comic-${String(index)}`;
    return {
      id: `assignment-${id}`,
      chapter_id: `pinned-${id}`,
      user_id: "reader",
      roles: 1,
      created_at: 1,
      updated_at: 1,
      chapter: { ...detailChapter(id), comic: detailComic(id) },
    };
  });
}

function panelContent(
  client: ApiClient,
  overrides: Partial<ComponentProps<typeof WorkspacePanel>> = {},
): ReactElement {
  return (
    <WorkspaceTestProvider client={client} session={workspaceSession()}>
      <WorkspacePanel {...props} {...overrides} />
    </WorkspaceTestProvider>
  );
}

test("one task list pauses mobile pagination and resumes on desktop even with the comment tab selected", async () => {
  const resize = prepareObservers();
  const nextPage = deferredResponse();
  const requests: string[] = [];
  const fetchImpl = vi.fn<typeof fetch>((input) => {
    const url = requestAddress(input);
    if (!url.includes("/assignments?"))
      return Promise.resolve(Response.json({ code: 0, data: [] }));
    requests.push(url);
    return requests.length === 1
      ? Promise.resolve(Response.json({ code: 0, data: assignments() }))
      : nextPage.promise;
  });
  const client = createApiClient({ baseUrl: "/api", getAccessToken: () => "token", fetchImpl });
  const view = render(panelContent(client));
  await waitFor(() => {
    expect(screen.getAllByText("comic-0")).toHaveLength(1);
  });
  expect(requests).toHaveLength(1);
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(callbacks.size).toBe(1);
  view.rerender(panelContent(client, { mobileTab: 1 }));
  expect(callbacks.size).toBe(0);
  resize(true);
  expect(callbacks.size).toBe(1);
  act(() => {
    for (const notify of [...callbacks]) notify();
  });
  expect(requests).toHaveLength(2);
  expect(requests[1]).toContain("offset=12");
  await act(async () => {
    nextPage.resolve([]);
    await nextPage.promise;
  });
  await waitFor(() => {
    expect(screen.getAllByText("没有更多漫画了 O^O")).toHaveLength(1);
  });
});

function emptyClient(): ApiClient {
  return createApiClient({
    baseUrl: "/api",
    getAccessToken: () => "token",
    fetchImpl: () => Promise.resolve(Response.json({ code: 0, data: [] })),
  });
}

test("tab changes and resizing preserve the draft, scroll positions and pending send", async () => {
  const resize = prepareObservers();
  const client = emptyClient();
  const pending = deferredResponse();
  const onSendComment = vi.fn(async () => {
    await pending.promise;
  });
  const view = render(panelContent(client, { mobileTab: 1, onSendComment }));
  const input = screen.getByRole("textbox");
  const messages = screen.getByRole("region", { name: "留言列表" });
  const list = view.container.querySelector(".overflow-y-auto.overflow-x-hidden");
  if (!(list instanceof HTMLElement)) throw new Error("Task scroll container missing");
  messages.scrollTop = 47;
  list.scrollTop = 91;
  fireEvent.change(input, { target: { value: "保留草稿" } });
  view.rerender(panelContent(client, { mobileTab: 0, onSendComment }));
  resize(true);
  resize(false);
  view.rerender(panelContent(client, { mobileTab: 1, onSendComment }));
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input).toHaveValue("保留草稿");
  expect(messages.scrollTop).toBe(47);
  expect(list.scrollTop).toBe(91);
  fireEvent.click(screen.getByRole("button", { name: "发送" }));
  expect(onSendComment).toHaveBeenCalledExactlyOnceWith("保留草稿");
  view.rerender(panelContent(client, { mobileTab: 0, onSendComment }));
  resize(true);
  expect(input).toBeDisabled();
  await act(async () => {
    pending.resolve([]);
    await pending.promise;
  });
  expect(input).not.toBeDisabled();
  expect(input).toHaveValue("");
});

test("a mobile workspace without a team still displays its only task list", async () => {
  prepareObservers();
  render(panelContent(emptyClient(), { team: null, selectedTeamId: null, mobileTab: 1 }));
  await waitFor(() => expect(screen.getByText("暂无漫画 o.O")).toBeInTheDocument());
  const taskHeading = screen.getByText("任务列表");
  expect(taskHeading.closest(".invisible")).toBeNull();
  expect(taskHeading.closest(".hidden")).toBeNull();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

test("mobile tabs and swipe events retain their existing handlers", async () => {
  const resize = prepareObservers();
  const onChangeMobileTab = vi.fn();
  const onTouchStart = vi.fn();
  const onTouchEnd = vi.fn();
  render(panelContent(emptyClient(), { onChangeMobileTab, onTouchStart, onTouchEnd }));
  const commentsTab = screen.getByRole("button", { name: "留言板" });
  fireEvent.click(commentsTab);
  expect(onChangeMobileTab).toHaveBeenCalledWith(1);
  fireEvent.click(screen.getByRole("button", { name: "任务列表" }));
  expect(onChangeMobileTab).toHaveBeenLastCalledWith(0);
  const messages = screen.getByRole("region", { name: "留言列表" });
  fireEvent.touchStart(messages, { touches: [{ clientX: 150, clientY: 50 }] });
  fireEvent.touchEnd(messages, { changedTouches: [{ clientX: 20, clientY: 50 }] });
  expect(onTouchStart).toHaveBeenCalledOnce();
  expect(onTouchEnd).toHaveBeenCalledOnce();
  resize(true);
  fireEvent.touchStart(messages);
  fireEvent.touchEnd(messages);
  expect(onTouchStart).toHaveBeenCalledOnce();
  expect(onTouchEnd).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.getByText("暂无漫画 o.O")).toBeInTheDocument());
});
