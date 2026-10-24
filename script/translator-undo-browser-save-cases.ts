import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  deleteFirst,
  expectTexts,
  openFixture,
  save,
  undo,
} from "./translator-undo-browser-helpers.ts";

export async function automaticAndManualSave(page: Page, url: string): Promise<void> {
  await page.clock.install();
  await openFixture(page, url);
  const input = page.getByPlaceholder("点击输入翻译...").first();
  for (const character of ["a", "b"]) {
    await input.pressSequentially(character);
    await page.clock.fastForward(60_001);
    await page.getByRole("button", { name: "保存 · 已保存", exact: true }).waitFor();
  }
  assert.equal(await page.evaluate(() => globalThis.undoProbe.calls()), 2);
  await page.getByRole("button", { name: "保存 · 已保存", exact: true }).click();
  for (const expected of [
    ["a", ""],
    ["", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
  }
  await page.clock.fastForward(60_001);
  await page.getByRole("button", { name: "保存 · 已保存", exact: true }).waitFor();
  const saved = await page.evaluate(() => globalThis.undoProbe.saved());
  assert.equal(saved[0]?.translatedText ?? "", "");
  assert.equal(await page.evaluate(() => globalThis.undoProbe.calls()), 3);
}

export async function pendingSaveDeleteRestore(page: Page): Promise<void> {
  await page.evaluate(() => {
    globalThis.undoProbe.hold();
  });
  await page.getByPlaceholder("点击输入翻译...").first().pressSequentially("ab");
  await page.getByRole("button", { name: "保存 · 待保存", exact: true }).click();
  await page.waitForFunction(() => globalThis.undoProbe.calls() === 1);
  await page
    .getByRole("button", { name: "第 1 个翻校单元", exact: true })
    .click({ button: "right" });
  await page.getByRole("dialog", { name: "确认删除" }).waitFor();
  await undo(page);
  await expectTexts(page, ["ab", ""]);
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await expectTexts(page, [""]);
  await undo(page);
  await expectTexts(page, ["ab", ""]);
  await page.evaluate(() => {
    globalThis.undoProbe.release();
  });
  await page.getByRole("button", { name: "保存 · 已保存", exact: true }).waitFor();
  for (const expected of [
    ["a", ""],
    ["", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
  }
  await save(page);
  const saved = await page.evaluate(() => globalThis.undoProbe.saved());
  assert.deepEqual(
    saved.map((unit) => [unit.id, unit.translatedText ?? ""]),
    [
      ["page-1-u1", ""],
      ["page-1-u2", ""],
    ],
  );
}

export async function savedRestoreAndEdit(page: Page): Promise<void> {
  await page.getByPlaceholder("点击输入翻译...").first().pressSequentially("ab");
  await deleteFirst(page);
  await save(page);
  await undo(page);
  await expectTexts(page, ["ab", ""]);
  await page.getByPlaceholder("点击输入翻译...").first().press("End");
  await page.getByPlaceholder("点击输入翻译...").first().pressSequentially("c");
  await save(page);
  const saved = await page.evaluate(() => globalThis.undoProbe.saved());
  assert.deepEqual(
    saved.map((unit) => unit.id),
    ["page-1-u1", "page-1-u2"],
  );
  assert.equal(saved[0]?.translatedText, "abc");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expectTexts(page, ["", ""]);
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  await expectTexts(page, ["abc", ""]);
  await undo(page);
  await expectTexts(page, ["abc", ""]);
}
