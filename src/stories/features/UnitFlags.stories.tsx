import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import TranslatorPaginator from
  "@/features/BaseTranslator/features/PageUnitStats/components/business/TranslatorPaginator";
import { applyUnitUpdates, createUnit, type UnitEdit, type UnitInfo } from "@/types/unit";
import type { Page, PageUnitFlaggedStats } from "@/types/page";
import type { TranslatorMode } from "@/types/translatorMode";

const pages: Page[] = [0, 1, 2].map((index) => ({
  id: `page-${String(index + 1)}`, chapterId: "chapter", index,
  imageUrl: "", isUploaded: true, creatorId: "user",
  totalUnitCount: index === 1 ? 3 : 2, translatedUnitCount: 2, proofreadUnitCount: 0,
  createdAt: 0, updatedAt: 0,
}));
const stats = [{ pageId: "page-2", index: 1, flaggedUnitCount: 3 }];

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = {
  mode: TranslatorMode;
  isDisabled: boolean;
  onLoad: () => Promise<PageUnitFlaggedStats[]>;
};

function FlaggedEditor({ mode, isDisabled, onLoad }: Props) {
  const [units, setUnits] = useState<UnitInfo[]>(() => [0, 1].map((index) => ({
    ...createUnit(0.2, 0.3, true),
    id: `unit-${String(index + 1)}`,
    index,
    isFlagged: index === 1,
    translatedText: index === 0 ? "需要稍后确认的译文。" : "很长的译文，用于验证窄屏下的布局。".repeat(5),
  })));
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(undefined);
  const [pageIndex, setPageIndex] = useState(0);

  function modify(id: string, updates: UnitEdit) {
    setUnits((previous) => previous.map((unit) =>
      unit.id === id ? applyUnitUpdates(unit, updates) : unit,
    ));
  }

  return (
    <div className="flex h-120 w-full max-w-96 flex-col border border-stone-200">
      <div className="flex items-center justify-between bg-stone-50 p-2">
        <output aria-label="当前页">当前页 {pageIndex + 1}</output>
        <TranslatorPaginator
          key={mode === "readOnly" ? "readOnly" : "editable"}
          pages={pages}
          currentPageIndex={pageIndex}
          currentUnits={pageIndex === 0 ? units : undefined}
          isEnabled={mode !== "readOnly"}
          onLoad={onLoad}
          onNavigate={(index) => {setPageIndex(index); return Promise.resolve();}}
        />
      </div>
      <div className="min-h-0 flex-1">
        <UnitList
          units={units}
          mode={mode}
          focusedUnitId={focusedUnitId}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={modify}
          onResolveUser={() => Promise.resolve({ success: false, error: "无用户资料" })}
          enableReadOnly={isDisabled}
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Features/UnitFlags",
  component: FlaggedEditor,
  args: {
    mode: "translate",
    isDisabled: false,
    onLoad: fn(() => Promise.resolve(stats)),
  },
} satisfies Meta<typeof FlaggedEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

async function exerciseToggle(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const element = canvasElement.querySelector<HTMLElement>('[data-unit-id="unit-1"]');
  if (!element) {throw new Error("缺少 Unit");}
  const row = within(element);
  const input = row.getAllByRole("textbox")[0];
  if (!input) {throw new Error("缺少文本框");}
  await userEvent.click(input);
  await waitFor(async () => {
    await expect(element.contains(document.activeElement)).toBe(true);
  });
  const focused = document.activeElement;
  await userEvent.click(row.getByRole("button", { name: "标记待回看" }));
  await expect(row.getByRole("button", { name: "取消标记" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect(focused).toHaveFocus();

  await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
  await expect(await canvas.findByLabelText("3 个待回看的标记")).toBeVisible();
  await expect(canvas.getByLabelText("2 个待回看的标记")).toBeVisible();
  await expect(canvas.queryByLabelText("0 个待回看的标记")).not.toBeInTheDocument();
  await userEvent.click(canvas.getByRole("button", { name: "Close page list" }));

  const button = row.getByRole("button", { name: "取消标记" });
  button.focus();
  await userEvent.keyboard("{Enter}");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await userEvent.keyboard(" ");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(button);
  await expect(button).toHaveAttribute("aria-pressed", "false");
}

export const Translate: Story = {
  play: async ({ canvasElement }) => {await exerciseToggle(canvasElement);},
};
export const Proofread: Story = {
  args: { mode: "proofread" },
  play: async ({ canvasElement }) => {await exerciseToggle(canvasElement);},
};
export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "标记待回看" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "取消标记" })).toBeDisabled();
  },
};
export const ReadOnly: Story = {
  args: { mode: "readOnly", onLoad: fn(() => Promise.resolve(stats)) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "标记待回看" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "取消标记" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
    await expect(canvas.queryByLabelText(/个待回看的标记/)).not.toBeInTheDocument();
    await expect(args.onLoad).not.toHaveBeenCalled();
  },
};
const retryLoad = fn(() => Promise.resolve(stats));

export const RetryStatistics: Story = {
  args: { onLoad: retryLoad },
  play: async ({ canvasElement }) => {
    retryLoad.mockRejectedValueOnce(new Error("暂时离线"));
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open page list" }));
    await userEvent.click(await canvas.findByRole("button", { name: "重试" }));
    await expect(await canvas.findByLabelText("3 个待回看的标记")).toBeVisible();
    await expect(canvas.getByLabelText("1 个待回看的标记")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /P2/ }));
    await expect(canvas.getByLabelText("当前页")).toHaveTextContent("当前页 2");
    await expect(canvas.queryByRole("button", { name: "Close page list" }))
      .not.toBeInTheDocument();
  },
};
