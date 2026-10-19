import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { TermbaseRow } from "./TermbaseRow";
import { comicTermbase, teamTermbase } from "./termbase-export-test-fixture";

afterEach(() => vi.useRealTimers());

type RowActions = { onSelect: Mock; onEdit: Mock; onExport: Mock };

function renderRow(isComic: boolean, isExporting = false): RowActions {
  const actions = { onSelect: vi.fn(), onEdit: vi.fn(), onExport: vi.fn() };
  render(
    <div role="list">
      <TermbaseRow
        termbase={isComic ? comicTermbase : teamTermbase}
        isSelected
        isExporting={isExporting}
        onSelect={actions.onSelect}
        onExport={actions.onExport}
        {...(isComic ? { onEdit: actions.onEdit } : {})}
      />
    </div>,
  );
  return actions;
}

test.each([true, false])(
  "export is separate from row selection and editing (comic: %s)",
  async (isComic) => {
    const { onSelect, onEdit, onExport } = renderRow(isComic);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "导出术语库" }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    const select = screen.getByRole("button", { pressed: true });
    await user.click(select);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByRole("listitem").querySelector("button button")).toBeNull();
  },
);

test.each([true, false])(
  "selection and share support keyboard activation (comic: %s)",
  async (isComic) => {
    const { onSelect, onEdit, onExport } = renderRow(isComic);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { pressed: true })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(2);
    await user.tab();
    expect(screen.getByRole("button", { name: "导出术语库" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onExport).toHaveBeenCalledOnce();
    expect(onEdit).not.toHaveBeenCalled();
  },
);

test("long press edits the selection area but never the share button", () => {
  vi.useFakeTimers();
  const { onSelect, onEdit } = renderRow(true);
  const share = screen.getByRole("button", { name: "导出术语库" });
  fireEvent.pointerDown(share);
  act(() => {
    vi.advanceTimersByTime(550);
  });
  fireEvent.pointerUp(share);
  expect(onEdit).not.toHaveBeenCalled();
  const select = screen.getByRole("button", { pressed: true });
  fireEvent.pointerDown(select);
  act(() => {
    vi.advanceTimersByTime(550);
  });
  fireEvent.pointerUp(select);
  fireEvent.click(select, { detail: 1 });
  expect(onEdit).toHaveBeenCalledOnce();
  expect(onSelect).not.toHaveBeenCalled();
});

test("shows a disabled loading button while allowing selection", async () => {
  const { onSelect, onExport } = renderRow(true, true);
  const user = userEvent.setup();
  const share = screen.getByRole("button", { name: "导出术语库" });
  expect(share).toBeDisabled();
  expect(share).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("status", { name: "正在导出术语库" })).toBeVisible();
  await user.click(share);
  await user.click(screen.getByRole("button", { pressed: true }));
  expect(onExport).not.toHaveBeenCalled();
  expect(onSelect).toHaveBeenCalledOnce();
});
