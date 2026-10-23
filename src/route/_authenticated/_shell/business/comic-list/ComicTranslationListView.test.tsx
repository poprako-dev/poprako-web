import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ComicTranslationListView } from "./ComicTranslationListView";

test("a failed page offers retry without claiming that the list is empty or exhausted", () => {
  const retry = vi.fn(() => Promise.resolve());
  render(
    <ComicTranslationListView
      state={{
        items: [],
        isLoading: false,
        hasMore: true,
        error: "连接失败",
        retry,
        loadMore: vi.fn(),
      }}
      onComicClick={vi.fn()}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("连接失败");
  expect(screen.queryByText(/暂无漫画|没有更多漫画/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(retry).toHaveBeenCalledOnce();
});
