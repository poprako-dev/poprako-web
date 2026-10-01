import type { JSX } from "react/jsx-runtime";
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
type Props = { mode: TranslatorMode };
function DraftIndicators({ mode }: Props): JSX.Element {
  return (
    <div className="h-96 w-96 bg-surface-stone-50 p-3">
      <Paginator
        mode="list"
        currPageIndex={0}
        totalPageCount={1}
        onPageUp={fn()}
        onPageDown={fn()}
        onPageIndexChange={fn()}
        pageStats={[
          {
            pageId: "p",
            totalUnits: 1,
            translatedUnits: 1,
            proofreadUnits: 0,
            hasLocalDraft: true,
          },
        ]}
      />
      <UnitList
        units={[unit]}
        pendingUnitIds={[unit.id]}
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
export const Translation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dot = canvas.getByLabelText("有未保存草稿");
    await expect(getComputedStyle(dot).boxShadow).toContain("inset");
    await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
    await expect(canvas.getAllByLabelText("有未保存草稿")).toHaveLength(2);
  },
};
export const Proofreading: Story = { args: { mode: "proofread" } };
export const ReadOnly: Story = { args: { mode: "readOnly" } };
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
