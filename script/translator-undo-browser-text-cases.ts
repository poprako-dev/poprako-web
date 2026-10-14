import assert from "node:assert/strict";
import type { Page } from "playwright";
import { expectTexts, undo, openFixture } from "./translator-undo-browser-helpers.ts";

export async function crossUnitHistory(page: Page): Promise<void> {
  const inputs = page.getByPlaceholder("点击输入翻译...");
  await inputs.nth(0).pressSequentially("a");
  await inputs.nth(1).pressSequentially("x");
  await inputs.nth(0).pressSequentially("b");
  await page.getByRole("button", { name: "保存 · 待保存", exact: true }).focus();
  for (const expected of [
    ["a", "x"],
    ["a", ""],
    ["", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
  }
}

export async function selectionAndCut(page: Page, url: string): Promise<void> {
  await openFixture(page, `${url}?text=hello`);
  const inputs = page.getByPlaceholder("点击输入翻译...");
  await inputs.nth(0).focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  for (let i = 0; i < 3; i++) await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.type("X");
  await expectTexts(page, ["hXo", ""]);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+x");
  await expectTexts(page, ["", ""]);
  await inputs.nth(1).pressSequentially("a");
  for (const expected of [
    ["", ""],
    ["hXo", ""],
    ["hello", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
  }
}

export async function nativeUndoInterleaving(page: Page): Promise<void> {
  const inputs = page.getByPlaceholder("点击输入翻译...");
  await inputs.nth(0).pressSequentially("a");
  await inputs.nth(1).pressSequentially("x");
  await page.keyboard.press("ControlOrMeta+z");
  await expectTexts(page, ["a", ""]);
  for (const expected of [
    ["a", "x"],
    ["a", ""],
    ["", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
  }
}

export async function browserComposition(page: Page): Promise<void> {
  const input = page.getByPlaceholder("点击输入翻译...").first();
  await input.pressSequentially("a");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", { text: "nihao", selectionStart: 5, selectionEnd: 5 });
  await undo(page);
  assert.equal(await input.inputValue(), "anihao");
  await cdp.send("Input.insertText", { text: "你好" });
  await expectTexts(page, ["a你好", ""]);
  await input.pressSequentially("b");
  for (const expected of [
    ["a你好", ""],
    ["a", ""],
    ["", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
  }
  await cdp.detach();
}
