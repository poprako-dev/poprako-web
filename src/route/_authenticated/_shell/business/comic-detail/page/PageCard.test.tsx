import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { PageCard } from "./PageCard";

const page: PageInfo = {
  id: "page",
  chapterId: "chapter",
  index: 0,
  imageUrl: "uploaded",
  isUploaded: true,
  totalUnitCount: 0,
  translatedUnitCount: 0,
  proofreadUnitCount: 0,
  createdAt: 1,
  updatedAt: 1,
};

test("available pages warm on intent and preserve keyboard activation", () => {
  const onClick = vi.fn();
  const onIntent = vi.fn();
  render(<PageCard page={page} onClick={onClick} onIntent={onIntent} />);
  const card = screen.getByRole("button");
  fireEvent.pointerEnter(card);
  fireEvent.focus(card);
  fireEvent.pointerDown(card, { pointerType: "touch" });
  expect(onIntent).toHaveBeenCalledTimes(3);
  expect(onClick).not.toHaveBeenCalled();
  fireEvent.keyDown(card, { key: "Enter" });
  fireEvent.keyDown(card, { key: " " });
  expect(onClick).toHaveBeenCalledTimes(2);
});

test.each([
  { imageUrl: "", enableClick: true },
  { imageUrl: "uploaded", enableClick: false },
])("unavailable pages do not warm or navigate: %o", ({ imageUrl, enableClick }) => {
  const onClick = vi.fn();
  const onIntent = vi.fn();
  const view = render(
    <PageCard
      page={{ ...page, imageUrl }}
      enableClick={enableClick}
      onClick={onClick}
      onIntent={onIntent}
    />,
  );
  const card = view.container.firstElementChild;
  if (!card) throw new Error("页面卡片缺失");
  fireEvent.pointerEnter(card);
  fireEvent.focus(card);
  fireEvent.pointerDown(card, { pointerType: "touch" });
  fireEvent.click(card);
  expect(onIntent).not.toHaveBeenCalled();
  expect(onClick).not.toHaveBeenCalled();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("delete controls do not prepare or activate the workbench", () => {
  const onIntent = vi.fn();
  const onClick = vi.fn();
  const onDelete = vi.fn();
  render(
    <PageCard page={page} onClick={onClick} onIntent={onIntent} enableDelete onDelete={onDelete} />,
  );
  const button = screen.getByRole("button", { name: "删除第 1 页" });
  fireEvent.focus(button);
  fireEvent.pointerDown(button, { pointerType: "touch" });
  fireEvent.click(button);
  expect(onDelete).toHaveBeenCalledOnce();
  expect(onIntent).not.toHaveBeenCalled();
  expect(onClick).not.toHaveBeenCalled();
});
