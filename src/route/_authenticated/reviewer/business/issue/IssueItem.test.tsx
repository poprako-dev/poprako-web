import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { IssueItem } from "./IssueItem";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";

const issue: IssueInfo = {
  id: "issue",
  pageArtworkId: "page",
  index: 0,
  variant: "居中错误",
  layerName: "他们两个…",
  rect: null,
  note: "向左移动",
};
afterEach(cleanup);

test("shows the readable layer name as supplied without explanatory text", () => {
  render(<IssueItem issue={issue} isFocused={false} onSelect={vi.fn()} />);
  expect(screen.getByText("他们两个…")).toBeVisible();
  expect(screen.queryByText("图层名称")).not.toBeInTheDocument();
  expect(screen.getByText("居中错误")).toBeVisible();
});

test("does not invent a layer label when the issue has no layer", () => {
  render(<IssueItem issue={{ ...issue, layerName: null }} isFocused={false} onSelect={vi.fn()} />);
  expect(screen.queryByText("他们两个…")).not.toBeInTheDocument();
  expect(screen.queryByText("整页")).not.toBeInTheDocument();
  expect(screen.getByText("向左移动")).toBeVisible();
});
