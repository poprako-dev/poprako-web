import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { FilterHeader } from "./FilterHeader";

test("search submits on Enter after composition without querying every keystroke", () => {
  const search = vi.fn();
  render(
    <FilterHeader
      onChangeFuzzyTitle={search}
      activeUploadStatus="unset"
      activeTranslateStatus="unset"
      activeProofreadStatus="unset"
      activeTypesetStatus="unset"
      activeReviewStatus="unset"
      activePublishStatus="unset"
      onChangeUploadStatus={vi.fn()}
      onChangeTranslateStatus={vi.fn()}
      onChangeProofreadStatus={vi.fn()}
      onChangeTypesetStatus={vi.fn()}
      onChangeReviewStatus={vi.fn()}
      onChangePublishStatus={vi.fn()}
    />,
  );
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: " 中文漫画 " } });
  expect(search).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
  expect(search).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(search).toHaveBeenCalledExactlyOnceWith("中文漫画");
});
