import { act, render, screen, waitFor } from "@testing-library/react";
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

function prepareObservers(): void {
  vi.stubGlobal("IntersectionObserver", TestObserver);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 300, 500),
  );
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
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

function panelContent(client: ApiClient, mobileTab = 0): ReactElement {
  return (
    <WorkspaceTestProvider client={client} session={workspaceSession()}>
      <WorkspacePanel {...props} mobileTab={mobileTab} />
    </WorkspaceTestProvider>
  );
}

test("desktop and mobile task views share first-page and pagination requests", async () => {
  prepareObservers();
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
    expect(screen.getAllByText("comic-0")).toHaveLength(2);
  });
  expect(requests).toHaveLength(1);
  expect(callbacks.size).toBe(2);
  view.rerender(panelContent(client, 1));
  expect(callbacks.size).toBe(1);
  view.rerender(panelContent(client));
  expect(callbacks.size).toBe(2);
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
    expect(screen.getAllByText("没有更多漫画了 O^O")).toHaveLength(2);
  });
});
