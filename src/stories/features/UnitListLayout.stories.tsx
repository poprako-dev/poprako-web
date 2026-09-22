import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import UnitList from "@/features/BaseTranslator/features/UnitList";
import { applyUnitUpdates, createUnit, unitId, type UnitEdit, type UnitInfo } from "@/types/unit";

const SAMPLE_TEXT = "非常感谢您的来信！\n"
  + "诶、那位润香小姐居然直接提出要给我当看板娘！看到申请我一下眼睛都瞪大了！\n"
  + "我这边才是、觉得您的Cosplay好厉害\n一直有在关注您！\n那就请您多多指教了！";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = {
  width: number;
  mode: "translate" | "proofread";
  readOnly: boolean;
};

function LayoutFixture({ width, mode, readOnly }: Props) {
  const [containerWidth, setContainerWidth] = useState(width);
  const [focusedUnitId, setFocusedUnitId] = useState<string | undefined>(undefined);
  const [units, setUnits] = useState<UnitInfo[]>(() => [0, 1].map((index) => ({
    ...createUnit(0, 0, true),
    id: `layout-${String(index)}`,
    index,
    translatedText: SAMPLE_TEXT,
    proofreadText: index === 0 ? SAMPLE_TEXT : undefined,
  })));

  function modify(id: string, updates: UnitEdit) {
    setUnits((previous) => previous.map((unit) =>
      unitId(unit) === id ? applyUnitUpdates(unit, updates) : unit,
    ));
  }

  return (
    <div>
      <button type="button" onClick={() => { setContainerWidth(330); }}>缩窄</button>
      <button type="button" onClick={() => { setContainerWidth(420); }}>放宽</button>
      <div style={{ width: containerWidth, height: 1000 }}>
        <UnitList
          units={units}
          focusedUnitId={focusedUnitId}
          mode={mode}
          onFocusUnit={setFocusedUnitId}
          onModifyUnit={modify}
          onResolveUser={() => Promise.resolve({ success: false, error: "无用户资料" })}
          enableReadOnly={readOnly}
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Regression/UnitListLayout",
  component: LayoutFixture,
  args: { width: 360, mode: "proofread", readOnly: false },
} satisfies Meta<typeof LayoutFixture>;

export default meta;
type Story = StoryObj<typeof meta>;

function getRow(canvasElement: HTMLElement, index: number) {
  const id = `layout-${String(index)}`;
  const row = canvasElement.querySelector<HTMLElement>(`[data-unit-id="${CSS.escape(id)}"]`);
  if (!row) {throw new Error("缺少测试行");}
  return row;
}

function getTextarea(row: HTMLElement, index: number) {
  const textarea = row.querySelectorAll("textarea")[index];
  if (!textarea) {throw new Error("缺少文本框");}
  return textarea;
}

async function expectFitted(textarea: HTMLTextAreaElement) {
  await waitFor(async () => {
    const clone = textarea.cloneNode(true) as HTMLTextAreaElement;
    clone.value = textarea.value;
    Object.assign(clone.style, {
      position: "fixed",
      visibility: "hidden",
      width: getComputedStyle(textarea).width,
      height: "auto",
    });
    textarea.parentElement?.append(clone);
    try {
      await expect(Math.abs(textarea.clientHeight - clone.scrollHeight)).toBeLessThanOrEqual(1);
    } finally {
      clone.remove();
    }
  });
}

async function verifyFocusLayout(canvasElement: HTMLElement) {
  const first = getRow(canvasElement, 0);
  const second = getRow(canvasElement, 1);
  const input = getTextarea(first, 1);
  await expectFitted(input);
  const width = input.getBoundingClientRect().width;
  const height = input.clientHeight;
  for (let iteration = 0; iteration < 3; iteration++) {
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await expect(input.getBoundingClientRect().width).toBe(width);
    await expect(input.clientHeight).toBe(height);
    await userEvent.click(getTextarea(second, 0));
    await expect(within(first).queryByTitle("确认校对")).not.toBeInTheDocument();
    await expect(input.getBoundingClientRect().width).toBe(width);
    await expect(input.clientHeight).toBe(height);
    await expect(input).toHaveValue(SAMPLE_TEXT);
    await expectFitted(input);
  }
}

export const Proofread330: Story = {
  args: { width: 330 },
  play: async ({ canvasElement }) => { await verifyFocusLayout(canvasElement); },
};

export const Proofread360: Story = {
  play: async ({ canvasElement }) => { await verifyFocusLayout(canvasElement); },
};

export const Proofread420: Story = {
  args: { width: 420 },
  play: async ({ canvasElement }) => { await verifyFocusLayout(canvasElement); },
};

export const EditAndCopy: Story = {
  play: async ({ canvasElement }) => {
    const row = getRow(canvasElement, 1);
    await userEvent.click(getTextarea(row, 0));
    const input = getTextarea(row, 1);
    const width = input.getBoundingClientRect().width;
    await userEvent.click(within(row).getByTitle("从初翻复制"));
    await expect(input).toHaveValue(SAMPLE_TEXT);
    await expect(input.getBoundingClientRect().width).toBe(width);
    await expectFitted(input);
    await userEvent.click(within(row).getByTitle("确认校对"));
    await expect(input).toHaveValue(SAMPLE_TEXT);
    await userEvent.click(within(row).getByTitle("取消校对"));
    await expect(input).toHaveValue(SAMPLE_TEXT);
    await userEvent.click(input);
    input.setSelectionRange(input.value.length, input.value.length);
    await userEvent.keyboard("{End}{Enter}{Enter}保留主动输入的空行");
    await expect(input).toHaveValue(SAMPLE_TEXT + "\n\n保留主动输入的空行");
    await expectFitted(input);
    const longHeight = input.clientHeight;
    await userEvent.clear(input);
    await expect(input).toHaveValue("");
    await expectFitted(input);
    await expect(input.clientHeight).toBeLessThan(longHeight);
    await userEvent.type(input, "短句");
    await expectFitted(input);
    await userEvent.keyboard("{Enter}{Enter}");
    await userEvent.click(getTextarea(getRow(canvasElement, 0), 0));
    await expect(input).toHaveValue("短句\n\n");
    await expectFitted(input);
  },
};

async function verifyResize(canvasElement: HTMLElement, inputIndex: number) {
  const input = getTextarea(getRow(canvasElement, 0), inputIndex);
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "缩窄" }));
  await expectFitted(input);
  const narrowHeight = input.clientHeight;
  await userEvent.click(canvas.getByRole("button", { name: "放宽" }));
  await expectFitted(input);
  await expect(input.clientHeight).toBeLessThan(narrowHeight);
  await userEvent.click(canvas.getByRole("button", { name: "缩窄" }));
  await expectFitted(input);
  await expect(input.clientHeight).toBe(narrowHeight);
  await expect(input).toHaveValue(SAMPLE_TEXT);
}

export const ResizeProofread: Story = {
  play: async ({ canvasElement }) => { await verifyResize(canvasElement, 1); },
};

export const ResizeTranslate: Story = {
  args: { mode: "translate" },
  play: async ({ canvasElement }) => {
    const input = getTextarea(getRow(canvasElement, 0), 0);
    const width = input.getBoundingClientRect().width;
    const height = input.clientHeight;
    await userEvent.click(input);
    await userEvent.click(getTextarea(getRow(canvasElement, 1), 0));
    await expect(input.getBoundingClientRect().width).toBe(width);
    await expect(input.clientHeight).toBe(height);
    await verifyResize(canvasElement, 0);
  },
};

export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvasElement }) => {
    const input = getTextarea(getRow(canvasElement, 0), 1);
    await expect(input).toHaveAttribute("readonly");
    await userEvent.click(input);
    await expect(within(canvasElement).queryByTitle("确认校对")).not.toBeInTheDocument();
    await expect(within(canvasElement).queryByTitle("从初翻复制")).not.toBeInTheDocument();
    await verifyResize(canvasElement, 1);
  },
};
