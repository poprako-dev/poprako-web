import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { IssueItem } from "./IssueItem";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";

const issue: IssueInfo = {
  id: "issue",
  pageArtworkId: "page",
  index: 0,
  variant: "居中错误",
  rect: null,
  note: "向左移动",
};
afterEach(cleanup);

test("shows the annotation category and original note", () => {
  render(<IssueItem issue={issue} isFocused={false} onSelect={vi.fn()} />);
  expect(screen.getByText("居中错误")).toBeVisible();
  expect(screen.getByText("向左移动")).toBeVisible();
});

test("selects the annotation when its note receives focus", () => {
  const onSelect = vi.fn();
  render(<IssueItem issue={issue} isFocused={false} onSelect={onSelect} />);
  fireEvent.focus(screen.getByRole("textbox", { name: "标注 1 内容" }));
  expect(onSelect).toHaveBeenCalledWith("issue");
});
