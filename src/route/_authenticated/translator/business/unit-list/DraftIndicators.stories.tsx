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
  await expect(canvas.getAllByLabelText("有未保存草稿")).toHaveLength(3);
  await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
  const dots = canvas.getAllByLabelText("有未保存草稿");
  await expect(dots).toHaveLength(6);
  const fills = dots.map((dot) => getComputedStyle(dot).backgroundColor);
  await expect(new Set(fills.slice(0, 3)).size).toBe(3);
  for (const dot of dots) {
    const style = getComputedStyle(dot);
    await expect(style.boxShadow).toContain("rgb(99, 72, 50)");
    await expect(style.boxShadow).toContain("inset");
    await expect(style.boxShadow).not.toContain(style.backgroundColor);
    await expect(style.width).toBe("8px");
    await expect(style.height).toBe("8px");
  }
  await userEvent.click(canvas.getByRole("button", { name: "模拟保存成功" }));
  await expect(canvas.queryAllByLabelText("有未保存草稿")).toHaveLength(0);
  for (const [index, dot] of dots.entries()) {
    await expect(dot).toBeInTheDocument();
    await expect(getComputedStyle(dot).boxShadow).not.toContain("inset");
    await expect(getComputedStyle(dot).backgroundColor).toBe(fills[index]);
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
