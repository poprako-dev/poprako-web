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
vi.mock("@/route/_authenticated/business/page/page-request", () => ({ listPages: requests.pages }));
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
  requests.chapter.mockReset().mockResolvedValue({ success: true, data: {} });
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
    loadRevisionPage: null,
    loadRevisionNotes: null,
  });
  expect(requests.chapter).toHaveBeenCalledOnce();
  expect(requests.pages).toHaveBeenCalledOnce();
});
test("rejects a page from another chapter and allows retry", async () => {
  requests.pages
    .mockResolvedValueOnce({
      success: true,
      data: [{ id: "page", chapterId: "other", index: 0 }],
    })
    .mockResolvedValue({
      success: true,
      data: [{ id: "page", chapterId: "chapter", index: 0 }],
    });
  render(workbench("chapter", "page"));
  expect(await screen.findByRole("alert")).toHaveTextContent("页面不属于当前章节");
  expect(requests.reviewer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(await screen.findByLabelText("当前工作台")).toHaveTextContent("chapter/page");
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
