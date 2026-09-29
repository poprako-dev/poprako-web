import type { JSX } from "react/jsx-runtime";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { UnitList } from "@/route/_authenticated/translator/business/unit-list/UnitList";
import { createUnit, type UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import {
  applyUnitUpdates,
  type UnitEdit,
} from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";

const sampleText =
  "这是一段足够长的文字，会随着侧边栏宽度自动折行，但只有句末是真实换行。\n" +
  "\n他说：「请保留引号、空格  和换行。」\n";

function LineBreakExample(): JSX.Element {
  const [unit, setUnit] = useState<UnitInfo>(() => ({
    ...createUnit(0, 0, true),
    id: "line-break-example",
    translatedText: sampleText,
    proofreadText: sampleText.replace("句末", "末尾"),
  }));
  const [mode, setMode] = useState<TranslatorMode>("translate");

  function modifyUnit(_id: string, updates: UnitEdit): void {
    setUnit((previous) => applyUnitUpdates(previous, updates));
  }

  return (
    <div className="flex h-160 w-95 max-w-full resize-x flex-col overflow-auto">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-stone-200 p-2 text-sm">
        <select
          aria-label="视图"
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as TranslatorMode);
          }}
        >
          <option value="translate">翻译</option>
          <option value="proofread">校对</option>
          <option value="readOnly">差异</option>
        </select>
      </div>
      <div className="min-h-0 flex-1">
        <UnitList
          units={[unit]}
          mode={mode}
          editing={{ modifyUnit }}
          onResolveUser={() => Promise.resolve({ success: false, error: "No contributor" })}
        />
      </div>
      <output aria-label="保存的翻译" className="whitespace-pre-wrap text-xs text-ink-stone-500">
        {unit.translatedText}
      </output>
    </div>
  );
}

const meta = {
  title: "Features/UnitList/LineBreakMarkers",
  component: LineBreakExample,
  parameters: { layout: "centered" },
} satisfies Meta<typeof LineBreakExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HardAndSoftBreaks: Story = {
  name: "真实换行、自动折行、空行与末尾换行",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveValue(sampleText);
    await expect(canvasElement.querySelectorAll("[data-line-break-marker]")).toHaveLength(3);

    await userEvent.clear(input);
    await userEvent.type(input, "第一行{Enter}{Enter}末行{Enter}");
    await expect(input).toHaveValue("第一行\n\n末行\n");
    await expect(canvas.getByLabelText("保存的翻译").textContent).toBe("第一行\n\n末行\n");
    await expect(canvasElement.querySelectorAll("[data-line-break-marker]")).toHaveLength(3);

    await userEvent.selectOptions(canvas.getByRole("combobox"), "proofread");
    await expect(canvas.getAllByRole("textbox")).toHaveLength(2);
    await expect(canvasElement.querySelectorAll("[data-line-break-marker]")).toHaveLength(6);

    await userEvent.selectOptions(canvas.getByRole("combobox"), "readOnly");
    const diff = canvas.getByRole("textbox", { name: "翻译与校对差异" });
    const diffText = diff.textContent;
    await expect(diffText).not.toContain("↵");
    await expect(canvasElement.querySelectorAll("[data-line-break-marker]")).toHaveLength(
      diffText.split("\n").length - 1,
    );

    // A marker must not push hanging spaces onto another visual line.
    await userEvent.selectOptions(canvas.getByRole("combobox"), "translate");
    const narrowContainer = canvasElement.querySelector<HTMLDivElement>(".resize-x");
    if (!narrowContainer) throw new Error("Missing resizable fixture");
    narrowContainer.style.width = "280px";
    const narrowInput = canvas.getByRole<HTMLTextAreaElement>("textbox");
    await userEvent.clear(narrowInput);
    await userEvent.type(narrowInput, "👨‍👩‍👧‍👦　引号「你好」  {Enter}末尾{Enter}");
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    const mirror = narrowInput.nextElementSibling;
    if (!mirror) throw new Error("Missing text mirror");
    const probe = mirror.cloneNode(false) as HTMLDivElement;
    probe.textContent = narrowInput.value;
    mirror.after(probe);
    try {
      const textNode = probe.firstChild;
      if (!textNode) throw new Error("Missing probe text");
      const markers = canvasElement.querySelectorAll("[data-line-break-marker]");
      await expect(markers).toHaveLength(narrowInput.value.split("\n").length - 1);
      let index = 0;
      for (const match of narrowInput.value.matchAll(/\n/gu)) {
        const range = document.createRange();
        range.setStart(textNode, match.index);
        range.setEnd(textNode, match.index + 1);
        const expected = range.getBoundingClientRect();
        const actual = markers.item(index).getBoundingClientRect();
        await expect(Math.abs(actual.x - expected.x)).toBeLessThan(1);
        await expect(Math.abs(actual.y - expected.y)).toBeLessThan(1);
        index += 1;
      }
    } finally {
      probe.remove();
    }
  },
};
