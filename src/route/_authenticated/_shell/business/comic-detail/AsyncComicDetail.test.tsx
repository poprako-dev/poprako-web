import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createModuleResource } from "@/shared/utility/module-resource";
import { deferred } from "@/test-resource/deferred";
import type { ComicDetailModalProps } from "./ComicDetailModal";
import type * as ComicDetail from "./ComicDetailModal";
import { AsyncComicDetail } from "./AsyncComicDetail";
import { mockComic } from "./test/comic-detail-story-fixtures";
import type { DetailComicInfo } from "./detail-request";

type DetailModule = typeof ComicDetail;
const state = vi.hoisted(() => ({
  resource: null as ReturnType<typeof createModuleResource<DetailModule>> | null,
}));
const reloadPage = vi.hoisted(() => vi.fn());

vi.mock("@/shared/utility/reload-page", () => ({ reloadPage }));

vi.mock("./comic-detail-module", () => ({
  comicDetailModule: {
    getSnapshot: () => currentResource().getSnapshot(),
    subscribe: (listener: () => void) => currentResource().subscribe(listener),
    load: () => currentResource().load(),
  },
  preloadComicDetail: () => currentResource().load(),
}));

function currentResource(): ReturnType<typeof createModuleResource<DetailModule>> {
  if (!state.resource) throw new Error("Detail module test resource is missing");
  return state.resource;
}

function TestDetail({ comicInfo, onClose }: ComicDetailModalProps): React.JSX.Element {
  const [draft, setDraft] = useState("");
  return (
    <div role="dialog" aria-label={comicInfo.title}>
      <input
        aria-label="草稿"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <button type="button" onClick={onClose}>
        关闭
      </button>
    </div>
  );
}

const team = {
  id: "team",
  name: "团队",
  description: "",
  avatarUrl: "",
  createdAt: 1,
  updatedAt: 1,
};
const comic: DetailComicInfo = {
  ...mockComic,
  team,
  workset: {
    id: mockComic.worksetId,
    teamId: team.id,
    index: 0,
    name: "作品集",
    description: "",
    comicCount: 1,
    createdAt: 1,
    updatedAt: 1,
  },
};

const loadedModule: DetailModule = { ComicDetailModal: TestDetail };
const onRetry = vi.fn();
const onClose = vi.fn();
const loader = vi.fn<() => Promise<DetailModule>>();
const baseProps = {
  isOpen: true,
  error: null,
  comicInfo: null,
  pinnedChapter: null,
  initialChapterId: null,
  onNavigateToWorkbench: vi.fn(),
  onChanged: vi.fn(),
  onRetry,
  onClose,
};

beforeEach(() => {
  loader.mockReset();
  state.resource = createModuleResource(loader);
});
afterEach(cleanup);

test("opening starts the module before comic data arrives and closed lists do not load it", async () => {
  const pending = deferred<DetailModule>();
  loader.mockReturnValue(pending.promise);
  const view = render(<AsyncComicDetail {...baseProps} isOpen={false} />);
  expect(loader).not.toHaveBeenCalled();
  view.rerender(<AsyncComicDetail {...baseProps} />);
  await waitFor(() => {
    expect(loader).toHaveBeenCalledOnce();
  });
  expect(screen.getByText("正在加载漫画详情")).toBeInTheDocument();
  await act(async () => {
    pending.resolve(loadedModule);
    await pending.promise;
  });
  expect(screen.getByText("正在加载漫画详情")).toBeInTheDocument();
  view.rerender(<AsyncComicDetail {...baseProps} comicInfo={comic} />);
  expect(screen.getByRole("dialog", { name: comic.title })).toBeInTheDocument();
});

test("module failures offer an explicit page refresh without refetching comic data", async () => {
  loader.mockRejectedValue(new Error("chunk unavailable"));
  render(<AsyncComicDetail {...baseProps} comicInfo={comic} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("请刷新页面");
  expect(reloadPage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "刷新页面" }));
  expect(reloadPage).toHaveBeenCalledOnce();
  expect(loader).toHaveBeenCalledOnce();
  expect(onRetry).not.toHaveBeenCalled();
});

test("data failures keep the existing retry and close actions", async () => {
  loader.mockResolvedValue(loadedModule);
  render(<AsyncComicDetail {...baseProps} error="详情请求失败" />);
  expect(screen.getByRole("alert")).toHaveTextContent("详情请求失败");
  fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(reloadPage).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "关闭" }));
  expect(onClose).toHaveBeenCalledOnce();
  await act(async () => {
    await Promise.resolve();
  });
});

test("finishing a download after closing cannot reopen the detail", async () => {
  const pending = deferred<DetailModule>();
  loader.mockReturnValue(pending.promise);
  const view = render(<AsyncComicDetail {...baseProps} comicInfo={comic} />);
  view.rerender(<AsyncComicDetail {...baseProps} comicInfo={comic} isOpen={false} />);
  await act(async () => {
    pending.resolve(loadedModule);
    await pending.promise;
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  view.rerender(<AsyncComicDetail {...baseProps} comicInfo={comic} />);
  expect(screen.getByRole("dialog", { name: comic.title })).toBeInTheDocument();
  expect(loader).toHaveBeenCalledOnce();
});

test("refreshing the same comic preserves its mounted draft and switching comics resets it", async () => {
  loader.mockResolvedValue(loadedModule);
  const view = render(<AsyncComicDetail {...baseProps} comicInfo={comic} />);
  const input = await screen.findByRole("textbox", { name: "草稿" });
  fireEvent.change(input, { target: { value: "未保存内容" } });
  view.rerender(<AsyncComicDetail {...baseProps} comicInfo={{ ...comic }} />);
  expect(screen.getByRole("textbox", { name: "草稿" })).toHaveValue("未保存内容");
  view.rerender(<AsyncComicDetail {...baseProps} comicInfo={{ ...comic, id: "another-comic" }} />);
  expect(screen.getByRole("textbox", { name: "草稿" })).toHaveValue("");
});
