import type { Page } from "playwright";
import { expectTexts, undo } from "./translator-undo-browser-helpers.ts";

export async function shortcutRecording(page: Page): Promise<void> {
  await page.getByPlaceholder("点击输入翻译...").first().pressSequentially("a");
  await page.getByRole("button", { name: "工具菜单", exact: true }).click();
  await page.getByRole("button", { name: "快捷键说明", exact: true }).click();
  await page.getByRole("dialog", { name: "快捷键设置", exact: true }).waitFor();
  await undo(page);
  await expectTexts(page, ["a", ""]);
  await page.getByRole("button", { name: "录制快捷键：万能回退", exact: true }).click();
  await page.keyboard.press("F8");
  await expectTexts(page, ["a", ""]);
  await page
    .getByRole("dialog", { name: "快捷键设置", exact: true })
    .getByRole("button", { name: "关闭快捷键设置", exact: true })
    .click();
  await undo(page);
  await expectTexts(page, ["a", ""]);
  await page.getByPlaceholder("点击输入翻译...").first().focus();
  await page.keyboard.press("F8");
  await expectTexts(page, ["", ""]);
}
