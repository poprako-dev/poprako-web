import { chromium, type Browser } from "playwright";
import type { DraftDatabase } from "../src/route/_authenticated/translator/business/persistence/draft-database.ts";
import { startUndoBrowserFixture } from "./translator-undo-browser-fixture.ts";
import { openFixture } from "./translator-undo-browser-helpers.ts";
import {
  crossUnitHistory,
  selectionAndCut,
  nativeUndoInterleaving,
  browserComposition,
} from "./translator-undo-browser-text-cases.ts";
import {
  automaticAndManualSave,
  pendingSaveDeleteRestore,
  savedRestoreAndEdit,
} from "./translator-undo-browser-save-cases.ts";
import {
  mixedStructureHistory,
  zeroMovementAndSelection,
  savedCreationAndOrder,
} from "./translator-undo-browser-structure-cases.ts";
import { shortcutRecording } from "./translator-undo-browser-shortcut-cases.ts";

import { afterAll, beforeAll, expect, test } from "vitest";

let server: Awaited<ReturnType<typeof startUndoBrowserFixture>> | undefined;
let browser: Browser | undefined;
beforeAll(async () => {
  server = await startUndoBrowserFixture(fixtureHtml);
  browser = await chromium.launch({ headless: true });
}, 30_000);
afterAll(async () => {
  await browser?.close();
  await server?.close();
});

test.each([
  crossUnitHistory,
  selectionAndCut,
  nativeUndoInterleaving,
  browserComposition,
  automaticAndManualSave,
  pendingSaveDeleteRestore,
  savedRestoreAndEdit,
  mixedStructureHistory,
  zeroMovementAndSelection,
  savedCreationAndOrder,
  shortcutRecording,
])(
  "translator browser: %s",
  async (check) => {
    if (!browser || !server) throw new Error("浏览器测试环境尚未就绪");
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors: Error[] = [];
    page.on("pageerror", (error) => {
      errors.push(error);
    });
    try {
      await openFixture(page, server.url);
      await check(page, server.url);
      expect(errors).toEqual([]);
    } finally {
      await page.close();
    }
  },
  30_000,
);

test("draft acknowledgement transactions preserve other pages in IndexedDB", async () => {
  if (!browser || !server) throw new Error("浏览器测试环境尚未就绪");
  const page = await browser.newPage();
  try {
    await page.goto(server.url);
    const result = await page.evaluate(async () => {
      const { createDraftDatabase } = globalThis as unknown as {
        createDraftDatabase: () => DraftDatabase;
      };
      const database = createDraftDatabase();
      const initial = ["first", "other"].map((key) => ({
        key,
        scope: "test",
        pageId: key,
        raw: key,
        touched: 0,
      }));
      await database.transact(() => ({ rows: initial, result: undefined }));
      const selected = await database.transact(
        (rows) => ({ rows: [], result: rows.map((row) => row.key) }),
        "first",
      );
      const surviving = await database.transact((rows) => ({
        rows,
        result: rows.map((row) => row.key),
      }));
      return { selected, surviving };
    });
    expect(result).toEqual({ selected: ["first"], surviving: ["other"] });
  } finally {
    await page.close();
  }
}, 30_000);

const fixtureHtml = `<div id="root" style="height:100dvh"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import '/src/application/style.css';
import { BaseTranslator } from '/src/route/_authenticated/translator/business/BaseTranslator.tsx';
import { createStoryArgs } from '/src/route/_authenticated/translator/business/test/base-translator-story-fixture.ts';
import { createDraftDatabase } from '/src/route/_authenticated/translator/business/persistence/draft-database.ts';
globalThis.createDraftDatabase = createDraftDatabase;
const units = ['u1', 'u2'].map((id, index) => ({
  id, index, xCoord: 0.2 + index * 0.4, yCoord: 0.3,
  isBubble: true, isFlagged: false, isProofread: false,
  translatedText: index === 0 ? new URLSearchParams(location.search).get('text') ?? '' : '',
}));
const args = createStoryArgs({canTranslate: true, canProofread: false, units});
let release;
let gate;
let calls = 0;
globalThis.undoProbe = {
  saved: () => args.onLoadUnits('page-1'),
  calls: () => calls,
  hold: () => { gate = new Promise(resolve => { release = resolve; }); },
  release: () => { release?.(); gate = undefined; },
};
createRoot(document.getElementById('root')).render(React.createElement(BaseTranslator, {
  ...args, startMode: 'translate', currentUserId: 'mock-translator',
  onLoadPageImage: () => Promise.resolve('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"/>'),
  onSaveUnits: async (...input) => { calls++; await gate; return args.onSaveUnits(...input); },
}));
</script>`;
