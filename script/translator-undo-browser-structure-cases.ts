import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import { expectTexts, save, undo } from "./translator-undo-browser-helpers.ts";

async function drag(page: Page, locator: Locator, dx: number, dy: number): Promise<void> {
  const box = await locator.boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function prepareMixedHistory(page: Page): Promise<void> {
  await page.getByPlaceholder("点击输入翻译...").first().pressSequentially("a");
  await drag(page, page.getByRole("button", { name: "第 1 个 Unit", exact: true }), 60, 40);
  await page.getByRole("button", { name: "标记待回看", exact: true }).first().click();
  await page.getByRole("button", { name: /^Unit 1：/ }).click();
  const first = page.getByRole("button", { name: /^Unit 1：/ });
  const second = await page.getByRole("button", { name: /^Unit 2：/ }).boundingBox();
  const origin = await first.boundingBox();
  assert.ok(second && origin);
  await drag(page, first, 0, second.y + second.height - origin.y);
  await save(page);
  const saved = await page.evaluate(() => globalThis.undoProbe.saved());
  assert.deepEqual(
    saved.map((unit) => unit.id),
    ["page-1-u2", "page-1-u1"],
  );
  assert.equal(saved[1]?.isFlagged, true);
  assert.equal(saved[1].isBubble, false);
  assert.notDeepEqual([saved[1].xCoord, saved[1].yCoord], [0.2, 0.3]);
  await page.getByRole("button", { name: "第 2 个 Unit", exact: true }).click({ button: "right" });
  await page.getByRole("dialog", { name: "确认删除" }).waitFor();
  await page.getByRole("button", { name: "删除", exact: true }).click();
  await save(page);
  await expectTexts(page, [""]);
}

export async function mixedStructureHistory(page: Page): Promise<void> {
  await prepareMixedHistory(page);
  for (let step = 0; step < 6; step++) {
    await undo(page);
    await save(page);
    const saved = await page.evaluate(() => globalThis.undoProbe.saved());
    assert.deepEqual(
      saved.map((unit) => unit.id),
      step === 0 ? ["page-1-u2", "page-1-u1"] : ["page-1-u1", "page-1-u2"],
    );
    const unit = saved.find((item) => item.id === "page-1-u1");
    assert.ok(unit);
    assert.equal(unit.isBubble, step >= 2);
    assert.equal(unit.isFlagged, step < 3);
    assert.equal(unit.translatedText ?? "", step < 5 ? "a" : "");
    if (step >= 4) assert.deepEqual([unit.xCoord, unit.yCoord], [0.2, 0.3]);
    else assert.notDeepEqual([unit.xCoord, unit.yCoord], [0.2, 0.3]);
  }
  await undo(page);
  await expectTexts(page, ["", ""]);
}

export async function zeroMovementAndSelection(page: Page): Promise<void> {
  const input = page.getByPlaceholder("点击输入翻译...").first();
  await input.pressSequentially("a");
  const box = await page.getByRole("button", { name: "第 1 个 Unit", exact: true }).boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 50, y + 50, { steps: 8 });
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
  await input.focus();
  await input.press("ControlOrMeta+a");
  await input.press("ArrowLeft");
  await undo(page);
  await expectTexts(page, ["", ""]);
}

export async function savedCreationAndOrder(page: Page): Promise<void> {
  const image = page.locator('[role="application"] img');
  const box = await image.boundingBox();
  assert.ok(box);
  await image.click({ button: "right", position: { x: box.width * 0.8, y: box.height * 0.7 } });
  await expectTexts(page, ["", "", ""]);
  await page.getByPlaceholder("点击输入翻译...").nth(2).pressSequentially("a");
  const last = page.getByRole("button", { name: /^Unit 3：/ });
  const firstBox = await page.getByRole("button", { name: /^Unit 1：/ }).boundingBox();
  const lastBox = await last.boundingBox();
  assert.ok(firstBox && lastBox);
  await drag(page, last, 0, firstBox.y - lastBox.y - lastBox.height / 2);
  await expectTexts(page, ["a", "", ""]);
  await save(page);
  const createdId = (await page.evaluate(() => globalThis.undoProbe.saved()))[0]?.id;
  assert.ok(createdId && !["page-1-u1", "page-1-u2"].includes(createdId));
  for (const expected of [
    ["", "", "a"],
    ["", "", ""],
    ["", ""],
  ]) {
    await undo(page);
    await expectTexts(page, expected);
    await save(page);
  }
  const saved = await page.evaluate(() => globalThis.undoProbe.saved());
  assert.deepEqual(
    saved.map((unit) => unit.id),
    ["page-1-u1", "page-1-u2"],
  );
}
