/// <reference lib="dom" />
import assert from "node:assert/strict";
import type { Page } from "playwright";

type SavedUnit = {
  id: string;
  translatedText?: string;
  xCoord: number;
  yCoord: number;
  isFlagged: boolean;
  isBubble: boolean;
};
declare global {
  var undoProbe: {
    saved: () => Promise<SavedUnit[]>;
    calls: () => number;
    hold: () => void;
    release: () => void;
  };
}

export async function openFixture(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page
    .getByPlaceholder("点击输入翻译...")
    .first()
    .waitFor({ timeout: 10000 })
    .catch(async (error: unknown) => {
      console.error(await page.locator("body").innerText());
      throw error;
    });
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('[role="application"] img');
    return Boolean(image?.naturalWidth);
  });
}

export async function undo(page: Page): Promise<void> {
  await page.keyboard.press("ControlOrMeta+.");
}

export async function expectTexts(page: Page, expected: string[]): Promise<void> {
  await page.waitForFunction(
    (values) => {
      const inputs = [
        ...document.querySelectorAll<HTMLTextAreaElement>(
          'textarea[placeholder="点击输入翻译..."]',
        ),
      ];
      return JSON.stringify(inputs.map((input) => input.value)) === JSON.stringify(values);
    },
    expected,
    { timeout: 3000 },
  );
  const actual = await page
    .getByPlaceholder("点击输入翻译...")
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLTextAreaElement).value));
  assert.deepEqual(actual, expected);
}

export async function save(page: Page): Promise<void> {
  await page.getByRole("button", { name: "保存 · 待保存", exact: true }).click();
  await page.getByRole("button", { name: "保存 · 已保存", exact: true }).waitFor();
}

export async function deleteFirst(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "第 1 个翻校单元", exact: true })
    .click({ button: "right" });
  await page.getByRole("dialog", { name: "确认删除" }).waitFor();
  await page.getByRole("button", { name: "删除", exact: true }).click();
}
