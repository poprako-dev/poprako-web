import type { ComponentProps } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import type BaseTranslator from "@/features/BaseTranslator/components/business/BaseTranslator";

export function configureKeyboardFixture() {
  const stored = localStorage.getItem("configurableShortcuts");
  localStorage.setItem("configurableShortcuts", JSON.stringify([
    { action: "pageUp", label: "上一页", keys: ["j"] },
  ]));
  return () => {
    if (stored === null) {localStorage.removeItem("configurableShortcuts");}
    else {localStorage.setItem("configurableShortcuts", stored);}
  };
}

export async function verifyTranslatorKeyboard({ canvasElement, args }: {
  canvasElement: HTMLElement;
  args: ComponentProps<typeof BaseTranslator>;
}) {
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  const fields = await canvas.findAllByPlaceholderText("点击输入翻译...");
  const first = fields[0];
  const second = fields[1];
  if (!first || !second) {throw new Error("Expected two translation units");}
  await userEvent.type(first, "abc");
  const selectedRow = first.closest("[data-unit-id]");
  await expect(selectedRow).toHaveClass("z-10");

  await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
  await userEvent.click(await canvas.findByRole("option", { name: /角色称谓/ }));
  const search = canvas.getByRole("textbox", { name: "搜索术语原文" });
  await userEvent.type(search, "j");
  await expect(search).toHaveFocus();
  await expect(search).toHaveValue("j");
  await expect(first.isConnected).toBe(true);
  await userEvent.click(await canvas.findByRole("button", { name: "新建术语" }));
  const dialog = page.getByRole("dialog", { name: "新建术语" });
  const source = page.getByRole("textbox", { name: "原文" });
  await userEvent.type(source, "abcj中文");
  await expect(source).toHaveFocus();
  await expect(source).toHaveValue("abcj中文");
  await userEvent.tab();
  await expect(dialog.contains(canvasElement.ownerDocument.activeElement)).toBe(true);
  await expect(selectedRow).toHaveClass("z-10");
  await userEvent.tab({ shift: true });
  await expect(source).toHaveFocus();
  await userEvent.keyboard("{Control>}s{/Control}{Control>}d{/Control}");
  await expect(args.onSaveUnits).not.toHaveBeenCalled();
  await expect(args.onLoadUnits).toHaveBeenCalledTimes(1);
  await expect(first.isConnected).toBe(true);
  await fireEvent.keyDown(source, { key: "Escape", isComposing: true });
  await expect(dialog).toBeVisible();
  await expect(selectedRow).toHaveClass("z-10");
  await userEvent.keyboard("{Escape}");
  await waitFor(async () => {
    await expect(page.queryByRole("dialog", { name: "新建术语" })).toBeNull();
  });
  await expect(selectedRow).toHaveClass("z-10");

  await userEvent.click(first);
  await fireEvent.keyDown(first, { key: "Tab", isComposing: true });
  await fireEvent.keyDown(first, { key: "Escape", keyCode: 229 });
  await expect(first).toHaveFocus();
  await expect(selectedRow).toHaveClass("z-10");
  await userEvent.keyboard("{Tab}");
  await expect(second).toHaveFocus();
  await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
  await expect(first).toHaveFocus();
  await userEvent.keyboard("{Control>}s{/Control}");
  await waitFor(async () => { await expect(args.onSaveUnits).toHaveBeenCalledTimes(1); });
  await userEvent.keyboard("{Control>}d{/Control}");
  await waitFor(async () => {
    await expect(args.onLoadUnits).toHaveBeenLastCalledWith("page-2");
  });
  const nextPageInput = await canvas.findAllByPlaceholderText("点击输入翻译...");
  if (!nextPageInput[0]) {throw new Error("Expected translation input on page 2");}
  await userEvent.click(nextPageInput[0]);
  await userEvent.keyboard("j");
  await waitFor(async () => {
    await expect(args.onLoadUnits).toHaveBeenLastCalledWith("page-1");
  });
}
