import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ComicTranslationCard } from "./ComicTranslationCard";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import { warmComicDetail } from "../comic-detail/comic-detail-module";

vi.mock("../comic-detail/comic-detail-module", () => ({ warmComicDetail: vi.fn() }));

const comic: ComicInfo = {
  id: "comic",
  worksetId: "workset",
  index: 0,
  title: "Comic",
  author: "Author",
  description: "",
  lastActiveAt: 1,
  chapterCount: 1,
  creatorId: "creator",
  coverUrl: "",
  isCoverUploaded: false,
  createdAt: 1,
  updatedAt: 1,
};

test("task card prepares detail code on intent before activation", () => {
  const onClick = vi.fn();
  render(<ComicTranslationCard comicInfo={comic} onClick={onClick} />);
  const card = screen.getByRole("button");
  fireEvent.pointerEnter(card);
  fireEvent.focus(card);
  fireEvent.pointerDown(card, { pointerType: "touch" });
  expect(warmComicDetail).toHaveBeenCalledTimes(3);
  expect(onClick).not.toHaveBeenCalled();
  fireEvent.keyDown(card, { key: "Enter" });
  expect(onClick).toHaveBeenCalledOnce();
});
