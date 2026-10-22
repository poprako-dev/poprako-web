import { expect, userEvent, waitFor, within } from "storybook/test";

function firstUnit(canvasElement: HTMLElement): HTMLElement {
  const row = canvasElement.querySelector<HTMLElement>("[data-unit-id]");
  if (!row) throw new Error("缺少 Unit 列表");
  return row;
}

export async function verifyTranslatorAnnotations(canvasElement: HTMLElement): Promise<void> {
  const canvas = within(canvasElement);
  const row = within(firstUnit(canvasElement));
  await expect(row.queryByRole("textbox", { name: "翻译注释" })).toBeNull();
  const toggle = canvas.getByRole("button", { name: "注释编辑" });
  await userEvent.click(row.getByRole("textbox"));
  await userEvent.click(toggle);
  await expect(row.getByRole("textbox", { name: "补充注释" })).toBeVisible();
  await expect(row.queryByRole("combobox")).toBeNull();
  const note = row.getByRole("textbox", { name: "翻译注释" });
  await userEvent.clear(note);
  await userEvent.type(note, "最后两个字加重。{Enter}保留换行。");
  await userEvent.keyboard("{ArrowDown}{Escape}");
  await expect(note).toHaveFocus();
  await expect(note).toHaveValue("最后两个字加重。\n保留换行。");
  await userEvent.clear(row.getByRole("textbox", { name: "补充注释" }));
  await userEvent.type(row.getByRole("textbox", { name: "补充注释" }), "这里是承诺。");
  await userEvent.click(canvas.getByRole("button", { name: "切换到只读模式" }));
  const readOnlyRow = within(firstUnit(canvasElement));
  await userEvent.click(readOnlyRow.getByRole("textbox", { name: "翻译与校对差异" }));
  await expect(readOnlyRow.getByRole("textbox", { name: "补充注释" })).toHaveAttribute("readonly");
  await userEvent.click(canvas.getByRole("button", { name: "切换到翻译模式" }));
  await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
  await waitFor(async () => {
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeEnabled();
  });
  await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
  await waitFor(async () => {
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled();
  });
  const restored = within(firstUnit(canvasElement));
  await userEvent.click(restored.getByPlaceholderText("点击输入翻译..."));
  await expect(restored.getByRole("textbox", { name: "翻译注释" })).toHaveValue(
    "最后两个字加重。\n保留换行。",
  );
  await expect(restored.getByRole("textbox", { name: "补充注释" })).toHaveValue("这里是承诺。");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(toggle);
}
