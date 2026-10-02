import type { JSX } from "react/jsx-runtime";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { UnitList } from "./UnitList";
import { Paginator } from "@/shared/component/Paginator";
import { createUnit, type UnitInfo } from "../unit/unit";
import { createDraftStore } from "../persistence/draft-store";
import { createUnitSaveController } from "../persistence/unit-save-controller";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import type { TranslatorMode } from "../unit/translator-mode";
const unit: UnitInfo = {
  ...createUnit(0.2, 0.3, true),
  id: "existing",
  translatedText: "本地待保存译文",
};
const units: UnitInfo[] = [
  unit,
  { ...createUnit(0.4, 0.5, true), id: "unfinished", index: 1 },
  { ...unit, id: "proofread", index: 2, isProofread: true },
];
type Props = { mode: TranslatorMode };
function DraftIndicators({ mode }: Props): JSX.Element {
  const [hasLocalDraft, setHasLocalDraft] = useState(true);
  return (
    <div className="h-96 w-96 bg-surface-stone-50 p-3">
      <Paginator
        mode="list"
        currPageIndex={0}
        totalPageCount={3}
        onPageUp={fn()}
        onPageDown={fn()}
        onPageIndexChange={fn()}
        pageStats={[0, 1, 2].map((status) => ({
          pageId: `p${String(status)}`,
          totalUnits: 1,
          translatedUnits: status > 0 ? 1 : 0,
          proofreadUnits: status > 1 ? 1 : 0,
          hasLocalDraft,
          ...(status < 2 ? { flaggedUnits: status === 0 ? 2 : 0 } : {}),
        }))}
        pageListFooter={
          <button
            type="button"
            onClick={() => {
              setHasLocalDraft(false);
            }}
            className="px-3 py-2 text-xs"
          >
            模拟保存成功
          </button>
        }
      />
      <UnitList
        units={units}
        pendingUnitIds={hasLocalDraft ? units.map((item) => item.id) : []}
        mode={mode}
        editing={null}
        onResolveUser={() => Promise.resolve({ success: false, error: "无用户" })}
      />
    </div>
  );
}
const meta = {
  title: "Features/UnitList/Drafts",
  component: DraftIndicators,
  args: { mode: "translate" },
} satisfies Meta<typeof DraftIndicators>;
export default meta;
type Story = StoryObj<typeof meta>;
async function checkDraftIndicators({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}): Promise<void> {
  const canvas = within(canvasElement);
  const unitDots = canvas.getAllByLabelText("有未保存草稿");
  await expect(unitDots).toHaveLength(3);
  const unitColors = unitDots.map((dot) => getComputedStyle(dot).color);
  await expect(new Set(unitColors).size).toBe(2);
  const unitLayouts = unitDots.map((dot) => {
    const row = dot.closest<HTMLElement>("[data-unit-id]");
    const input = row?.querySelector<HTMLElement>('textarea, [role="textbox"]');
    if (!row || !input) throw new Error("Missing unit layout");
    return {
      row,
      input,
      rowRect: row.getBoundingClientRect(),
      inputRect: input.getBoundingClientRect(),
    };
  });
  for (const dot of unitDots) {
    const style = getComputedStyle(dot);
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(style.borderColor).toBe(style.color);
    await expect(style.borderStyle).toBe("solid");
    // Chromium may round fractional borders down to a physical pixel.
    await expect(Number.parseFloat(style.borderWidth)).toBeGreaterThanOrEqual(2);
    await expect(Number.parseFloat(style.borderWidth)).toBeLessThanOrEqual(2.5);
    await expect(style.boxShadow).toBe("none");
    await expect(style.width).toBe("10px");
    await expect(style.height).toBe("10px");
  }
  await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
  await expect(canvas.getAllByLabelText("有未保存草稿")).toHaveLength(6);
  const pageDots: HTMLElement[] = [];
  const draftIcons: HTMLElement[] = [];
  for (const index of [0, 1, 2]) {
    const pageLabel = `P${String(index + 1)}`;
    const page = canvas.getByRole("button", { name: new RegExp(`\\b${pageLabel}\\b`) });
    const row = within(page);
    const draft = row.getByRole("img", { name: "有未保存草稿" });
    await expect(draft.querySelector("svg")).not.toBeNull();
    await expect(draft).toHaveAttribute("title", "有未保存草稿");
    await expect(draft.previousElementSibling).toBe(
      index === 0 ? row.getByLabelText("2 个待回看的标记") : row.getByText(pageLabel),
    );
    const dot = page.querySelector<HTMLElement>("span.rounded-full");
    if (!dot) throw new Error("Missing page completion indicator");
    await expect(dot).not.toBe(draft);
    await expect(getComputedStyle(dot).boxShadow).not.toContain("inset");
    pageDots.push(dot);
    draftIcons.push(draft);
  }
  const pageFills = pageDots.map((dot) => getComputedStyle(dot).backgroundColor);
  await expect(new Set(pageFills).size).toBe(3);
  await userEvent.click(canvas.getByRole("button", { name: "模拟保存成功" }));
  await expect(canvas.queryAllByLabelText("有未保存草稿")).toHaveLength(0);
  for (const icon of draftIcons) await expect(icon).not.toBeInTheDocument();
  for (const [index, dot] of unitDots.entries()) {
    const style = getComputedStyle(dot);
    await expect(dot).toBeInTheDocument();
    await expect(style.backgroundColor).toBe(unitColors[index]);
    await expect(style.color).toBe(unitColors[index]);
    await expect(style.borderWidth).toBe("0px");
    await expect(style.width).toBe("10px");
    await expect(style.height).toBe("10px");
  }
  for (const { row, input, rowRect, inputRect } of unitLayouts) {
    await expect(row.getBoundingClientRect().width).toBe(rowRect.width);
    await expect(row.getBoundingClientRect().height).toBe(rowRect.height);
    await expect(input.getBoundingClientRect().width).toBe(inputRect.width);
  }
  for (const [index, dot] of pageDots.entries()) {
    await expect(dot).toBeInTheDocument();
    await expect(getComputedStyle(dot).backgroundColor).toBe(pageFills[index]);
  }
}
export const Translation: Story = { play: checkDraftIndicators };
export const Proofreading: Story = { args: { mode: "proofread" }, play: checkDraftIndicators };
export const ReadOnly: Story = { args: { mode: "readOnly" }, play: checkDraftIndicators };
export const BrowserRecovery: Story = {
  play: async () => {
    // Independent connections exercise IndexedDB's read/write transaction serialization.
    const user = crypto.randomUUID();
    const a = createDraftStore(user, "chapter"),
      b = createDraftStore(user, "chapter");
    await Promise.all([a.ready, b.ready]);
    const pages = new Map([["p", [unit]]]);
    const backend = createUnitSaveFixture(pages);
    const failedSave = fn().mockRejectedValue(new Error("offline"));
    const ca = createUnitSaveController({
      drafts: a,
      save: failedSave,
      reload: () => Promise.resolve([unit]),
      changed: fn(),
      failed: fn(),
    });
    const cb = createUnitSaveController({
      drafts: b,
      save: failedSave,
      reload: () => Promise.resolve([unit]),
      changed: fn(),
      failed: fn(),
    });
    ca.load("p", [unit]);
    cb.load("p", [unit]);
    ca.commit([{ ...unit, translatedText: "A" }]);
    cb.commit([{ ...unit, proofreadText: "B" }]);
    const outcomes = await Promise.allSettled([ca.flush(), cb.flush()]);
    await expect(outcomes.every((outcome) => outcome.status === "rejected")).toBe(true);
    const reopened = createDraftStore(user, "chapter");
    await reopened.ready;
    await expect(reopened.getState().drafts["p"]?.pending).toHaveLength(2);
    await expect(reopened.getState().drafts["p"]?.units[0]).toMatchObject({
      translatedText: "A",
      proofreadText: "B",
    });
    const retrySave = fn(backend);
    const retry = createUnitSaveController({
      drafts: reopened,
      save: retrySave,
      reload: () => Promise.resolve(pages.get("p") ?? []),
      changed: fn(),
      failed: fn(),
    });
    retry.load("p", [unit]);
    await retry.flush();
    await expect(retrySave).toHaveBeenCalledTimes(2);
    await expect(pages.get("p")?.[0]).toMatchObject({ translatedText: "A", proofreadText: "B" });
    const clean = createDraftStore(user, "chapter");
    await clean.ready;
    await expect(clean.getState().drafts).toEqual({});
  },
};
