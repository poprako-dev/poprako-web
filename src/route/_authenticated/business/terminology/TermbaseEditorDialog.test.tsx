import type { ComponentProps } from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { TermbaseEditorDialog } from "./TermbaseEditorDialog";
import { useTermbaseSubmission } from "./use-termbase-submission";
import { comicTermbase } from "./termbase-export-test-fixture";

type DialogHarness = {
  props: ComponentProps<typeof TermbaseEditorDialog>;
  user: ReturnType<typeof userEvent.setup>;
};

function setupDialog(
  overrides: Partial<ComponentProps<typeof TermbaseEditorDialog>> = {},
): DialogHarness {
  const props = {
    onSave: vi.fn().mockResolvedValue(true),
    onImport: vi.fn().mockResolvedValue(false),
    onDelete: vi.fn().mockResolvedValue(true),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<TermbaseEditorDialog {...props} />);
  return { props, user: userEvent.setup() };
}

test("places import before save and opens a single JSON picker without a name", async () => {
  const { props, user } = setupDialog();
  const button = screen.getByRole("button", { name: "导入" });
  const save = screen.getByRole("button", { name: "保存" });
  const input = screen.getByLabelText<HTMLInputElement>("选择术语库 JSON 文件");
  expect(button).toBeEnabled();
  expect(save).toBeDisabled();
  expect(button.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(input).toHaveAttribute("accept", ".json,application/json");
  expect(input.multiple).toBe(false);
  const click = vi.spyOn(input, "click");
  await user.click(button);
  expect(click).toHaveBeenCalledOnce();
  fireEvent.change(input, { target: { files: [] } });
  expect(props.onImport).not.toHaveBeenCalled();
  const file = new File(["{}"], "terms.json", { type: "application/json" });
  await user.upload(input, file);
  expect(props.onImport).toHaveBeenCalledExactlyOnceWith(file);
  expect(input.value).toBe("");
  await user.upload(input, file);
  expect(props.onImport).toHaveBeenCalledTimes(2);
  expect(props.onSave).not.toHaveBeenCalled();
  expect(props.onClose).not.toHaveBeenCalled();
});

test("locks all editing and closing while importing and only spins the import action", async () => {
  let finish: (success: boolean) => void = () => undefined;
  const pending = new Promise<boolean>((resolve) => {
    finish = resolve;
  });
  const { props, user } = setupDialog({ onImport: vi.fn().mockReturnValue(pending) });
  await user.type(screen.getByRole("textbox", { name: "名称" }), "手动名称");
  await user.upload(screen.getByLabelText("选择术语库 JSON 文件"), new File(["{}"], "terms.json"));
  const button = screen.getByRole("button", { name: "导入" });
  const save = screen.getByRole("button", { name: "保存" });
  expect(button).toBeDisabled();
  expect(save).toBeDisabled();
  expect(button.querySelector(".animate-spin")).not.toBeNull();
  expect(save.querySelector(".animate-spin")).toBeNull();
  expect(screen.getByRole("textbox", { name: "名称" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "描述" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "关闭" })).toBeDisabled();
  await user.click(button);
  await user.click(save);
  await user.keyboard("{Escape}");
  expect(props.onImport).toHaveBeenCalledOnce();
  expect(props.onSave).not.toHaveBeenCalled();
  expect(props.onClose).not.toHaveBeenCalled();
  await act(async () => {
    finish(true);
    await pending;
  });
  expect(props.onClose).toHaveBeenCalledOnce();
});

test("preserves manual creation with trimmed fields", async () => {
  const { props, user } = setupDialog();
  await user.type(screen.getByRole("textbox", { name: "名称" }), " 战斗用语 ");
  await user.type(screen.getByRole("textbox", { name: "描述" }), " 描述 ");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(props.onSave).toHaveBeenCalledExactlyOnceWith({ name: "战斗用语", description: "描述" });
  expect(props.onImport).not.toHaveBeenCalled();
  expect(props.onClose).toHaveBeenCalledOnce();
});

test("keeps import out of editing and preserves update", async () => {
  const { props, user } = setupDialog({ termbase: comicTermbase });
  expect(screen.queryByRole("button", { name: "导入" })).toBeNull();
  expect(screen.queryByLabelText("选择术语库 JSON 文件")).toBeNull();
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(props.onSave).toHaveBeenCalledExactlyOnceWith({
    name: comicTermbase.name,
    description: undefined,
  });
  expect(props.onClose).toHaveBeenCalledOnce();
});

test("preserves the delete confirmation flow", async () => {
  const { props, user } = setupDialog({ termbase: comicTermbase });
  await user.click(screen.getByRole("button", { name: "删除" }));
  expect(props.onDelete).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "返回" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "关闭" }));
  expect(screen.getByRole("dialog", { name: "编辑术语库" })).toBeVisible();
  expect(props.onClose).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "删除" }));
  await user.click(screen.getByRole("button", { name: "确认删除" }));
  expect(props.onDelete).toHaveBeenCalledOnce();
  expect(props.onClose).toHaveBeenCalledOnce();
});

test("blocks synchronous competing submissions before React rerenders", async () => {
  const close = vi.fn();
  const { result } = renderHook(() => useTermbaseSubmission(close));
  const importAction = vi.fn().mockResolvedValue(false);
  const saveAction = vi.fn().mockResolvedValue(true);
  await act(async () => {
    await Promise.all([
      result.current.submit("import", importAction),
      result.current.submit("save", saveAction),
    ]);
  });
  expect(importAction).toHaveBeenCalledOnce();
  expect(saveAction).not.toHaveBeenCalled();
  expect(result.current.pending).toBeUndefined();
  await act(() => result.current.submit("save", saveAction));
  expect(saveAction).toHaveBeenCalledOnce();
  expect(close).toHaveBeenCalledOnce();
});
