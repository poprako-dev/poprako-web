import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { UnitAnnotationsFixture } from "./test/UnitAnnotationsFixture";

const meta = {
  title: "Features/UnitAnnotations",
  component: UnitAnnotationsFixture,
  parameters: { layout: "centered" },
  args: { mode: "translate", width: 380, readOnly: false },
} satisfies Meta<typeof UnitAnnotationsFixture>;

export default meta;
type Story = StoryObj<typeof meta>;

function unitRow(canvasElement: HTMLElement, index: number): HTMLElement {
  const row = canvasElement.querySelector<HTMLElement>(
    `[data-unit-id="annotation-unit-${String(index)}"]`,
  );
  if (!row) throw new Error("缺少注释示例 Unit");
  return row;
}

async function showComments(canvasElement: HTMLElement, index: number): Promise<void> {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "显示注释" }));
  const row = within(unitRow(canvasElement, index));
  const input = row.getAllByRole("textbox")[0];
  if (!input) throw new Error("缺少 Unit 文本框");
  await userEvent.click(input);
}

async function verifyTwoVisibleFields(rowElement: HTMLElement): Promise<void> {
  const row = within(rowElement);
  const translation = row.getByRole("textbox", { name: "翻译注释" });
  const supplement = row.getByRole("textbox", { name: "补充注释" });
  await expect(translation).toBeVisible();
  await expect(supplement).toBeVisible();
  const top = translation.getBoundingClientRect();
  const bottom = supplement.getBoundingClientRect();
  await expect(bottom.top).toBeGreaterThanOrEqual(top.bottom);
  await expect(bottom.width).toBe(top.width);
}

async function verifyCommentFields(rowElement: HTMLElement): Promise<void> {
  const row = within(rowElement);
  await verifyTwoVisibleFields(rowElement);
  await userEvent.type(row.getByRole("textbox", { name: "翻译注释" }), "最后两个字加重。");
  const note = row.getByRole("textbox", { name: "补充注释" });
  await expect(note).toHaveValue("");
  await fireEvent.compositionStart(note);
  await fireEvent.input(note, { target: { value: "这里是承诺。" }, isComposing: true });
  await fireEvent.compositionEnd(note, { data: "这里是承诺。" });
  await expect(note).toHaveValue("这里是承诺。");
}

export const Translate: Story = {
  name: "翻译 · 注释随焦点显示",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = within(unitRow(canvasElement, 0));
    const second = within(unitRow(canvasElement, 1));
    const toggle = canvas.getByRole("button", { name: "显示注释" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.queryByRole("button", { name: "展开注释" })).toBeNull();
    await userEvent.click(first.getByRole("textbox"));
    await expect(first.queryByRole("textbox", { name: "翻译注释" })).toBeNull();
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await verifyCommentFields(unitRow(canvasElement, 0));
    await userEvent.click(second.getByRole("textbox"));
    await expect(first.queryByRole("textbox", { name: "翻译注释" })).toBeNull();
    await verifyTwoVisibleFields(unitRow(canvasElement, 1));
    await userEvent.click(first.getByRole("textbox"));
    await expect(first.getByRole("textbox", { name: "翻译注释" })).toHaveValue("最后两个字加重。");
    await expect(first.getByRole("textbox", { name: "补充注释" })).toHaveValue("这里是承诺。");
    await userEvent.click(toggle);
    await userEvent.click(second.getByRole("textbox"));
    await expect(canvas.queryByRole("textbox", { name: "翻译注释" })).toBeNull();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};

export const Proofread: Story = {
  name: "校对 · 已有注释",
  args: { mode: "proofread" },
  play: async ({ canvasElement }) => {
    await showComments(canvasElement, 1);
    await verifyTwoVisibleFields(unitRow(canvasElement, 1));
    await expect(
      within(unitRow(canvasElement, 1)).getByRole("textbox", { name: "补充注释" }),
    ).toHaveValue("这里带有确认语气，补上“就”更贴近原意。");
  },
};

export const Narrow: Story = {
  name: "窄栏 · 330px",
  args: { width: 330, mode: "proofread" },
  play: async ({ canvasElement }) => {
    await showComments(canvasElement, 1);
    const element = unitRow(canvasElement, 1);
    await verifyTwoVisibleFields(element);
    const note = within(element).getByRole("textbox", { name: "翻译注释" });
    await userEvent.type(note, "{Enter}这一句保持两行，省略号与后面的文字放在同一行。");
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
    await expect(note.scrollHeight).toBeLessThanOrEqual(note.clientHeight + 1);
  },
};

export const ReadOnly: Story = {
  name: "只读 · 注释随焦点显示",
  args: { readOnly: true, mode: "proofread" },
  play: async ({ canvasElement }) => {
    await showComments(canvasElement, 1);
    const row = within(unitRow(canvasElement, 1));
    await expect(row.getByRole("textbox", { name: "翻译注释" })).toHaveAttribute("readonly");
    await expect(row.getByRole("textbox", { name: "补充注释" })).toHaveAttribute("readonly");
  },
};

export const ClearComments: Story = {
  name: "清空两类注释",
  play: async ({ canvasElement }) => {
    await showComments(canvasElement, 1);
    const row = within(unitRow(canvasElement, 1));
    await userEvent.clear(row.getByRole("textbox", { name: "翻译注释" }));
    await userEvent.clear(row.getByRole("textbox", { name: "补充注释" }));
    const toggle = within(canvasElement).getByRole("button", { name: "显示注释" });
    await userEvent.click(toggle);
    await userEvent.click(toggle);
    await expect(row.getByRole("textbox", { name: "补充注释" })).toHaveValue("");
    await expect(row.getByRole("textbox", { name: "翻译注释" })).toHaveValue("");
  },
};
