import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { ApiProvider } from "@/route/business/ApiProvider";
import type { ReactElement } from "react";
import type { ReviewerProps } from "./reviewer-props";
import { WebReviewer } from "./WebReviewer";
const requests = vi.hoisted(() => ({ chapter: vi.fn(), pages: vi.fn(), reviewer: vi.fn() }));
vi.mock("@/route/_authenticated/business/chapter/chapter-request", () => ({
  getChapter: requests.chapter,
}));
vi.mock("@/api/page-artwork/page-artwork-api", () => ({ listPageArtworks: requests.pages }));
vi.mock("./Reviewer", () => ({
  Reviewer: (props: ReviewerProps) => {
    requests.reviewer(props);
    return (
      <div aria-label="当前工作台">
        {props.project.chapterId}/{props.startPageId}
      </div>
    );
  },
}));
const client = createApiClient({ baseUrl: "/api/v1", getAccessToken: () => null });
beforeEach(() => {
  requests.chapter
    .mockReset()
    .mockResolvedValue({ success: true, data: { id: "chapter", stages: 0 } });
  requests.pages.mockReset();
  requests.reviewer.mockClear();
});
afterEach(cleanup);
function workbench(chapterId: string, startPageId: string): ReactElement {
  return (
    <ApiProvider client={client}>
      <WebReviewer chapterId={chapterId} startPageId={startPageId} onExit={vi.fn()} />
    </ApiProvider>
  );
}
test("loads page navigation without constructing a Unit project or preview data", async () => {
  requests.pages.mockResolvedValue({
    success: true,
    data: [
      { id: "second", chapterId: "chapter", index: 1 },
      { id: "first", chapterId: "chapter", index: 0 },
      { id: "foreign", chapterId: "other", index: 0 },
    ],
  });
  render(workbench("chapter", "second"));
  await screen.findByLabelText("当前工作台");
  expect(requests.reviewer.mock.lastCall?.[0]).toMatchObject({
    project: {
      chapterId: "chapter",
      pages: [
        { id: "first", index: 0 },
        { id: "second", index: 1 },
      ],
    },
    startPageId: "second",
  });
  const props = requests.reviewer.mock.lastCall?.[0] as ReviewerProps;
  expect(typeof props.loadReviewPage).toBe("function");
  expect(typeof props.loadIssues).toBe("function");
  expect(requests.chapter).toHaveBeenCalledOnce();
  expect(requests.pages).toHaveBeenCalledOnce();
});
test("allows chapter recovery and opens artwork review without source pages", async () => {
  requests.chapter.mockResolvedValueOnce({ success: false, error: "章节加载失败" });
  requests.pages.mockResolvedValue({ success: true, data: [] });
  render(workbench("chapter", "page"));
  expect(await screen.findByRole("alert")).toHaveTextContent("章节加载失败");
  expect(requests.reviewer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(await screen.findByText("尚未上传嵌稿")).toBeInTheDocument();
  expect(requests.reviewer).not.toHaveBeenCalled();
});
test("hides the previous workbench immediately and ignores a late response after route changes", async () => {
  let resolve!: (value: unknown) => void;
  requests.pages
    .mockResolvedValueOnce({
      success: true,
      data: [{ id: "first", chapterId: "chapter", index: 0 }],
    })
    .mockImplementationOnce(
      () =>
        new Promise((callback) => {
          resolve = callback;
        }),
    )
    .mockResolvedValue({ success: true, data: [{ id: "third", chapterId: "chapter", index: 2 }] });
  const view = render(workbench("chapter", "first"));
  await screen.findByLabelText("当前工作台");
  view.rerender(workbench("chapter", "second"));
  expect(screen.queryByLabelText("当前工作台")).not.toBeInTheDocument();
  await waitFor(() => {
    expect(requests.pages).toHaveBeenCalledTimes(2);
  });
  view.rerender(workbench("chapter", "third"));
  expect(await screen.findByLabelText("当前工作台")).toHaveTextContent("chapter/third");
  resolve({ success: true, data: [{ id: "second", chapterId: "chapter", index: 1 }] });
  await waitFor(() => {
    expect(screen.getByLabelText("当前工作台")).toHaveTextContent("chapter/third");
  });
});
