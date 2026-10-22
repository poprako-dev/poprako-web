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

async function editNotes(canvasElement: HTMLElement, index: number): Promise<void> {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "注释编辑" }));
  const row = within(unitRow(canvasElement, index));
  const input = row.getAllByRole("textbox")[0];
  if (!input) throw new Error("缺少 Unit 文本框");
  await userEvent.click(input);
}

async function verifyTwoVisibleFields(rowElement: HTMLElement): Promise<void> {
  const row = within(rowElement);
  const typography = row.getByRole("textbox", { name: "嵌字注释" });
  const translation = row.getByRole("textbox", { name: "翻校注释" });
  await expect(typography).toBeVisible();
  await expect(translation).toBeVisible();
  const top = typography.getBoundingClientRect();
  const bottom = translation.getBoundingClientRect();
  await expect(bottom.top).toBeGreaterThanOrEqual(top.bottom);
  await expect(bottom.width).toBe(top.width);
}

async function verifyNoteFields(rowElement: HTMLElement): Promise<void> {
  const row = within(rowElement);
  await verifyTwoVisibleFields(rowElement);
  await userEvent.type(row.getByRole("textbox", { name: "嵌字注释" }), "最后两个字加重。");
  const note = row.getByRole("textbox", { name: "翻校注释" });
  await expect(note).toHaveValue("");
  await fireEvent.compositionStart(note);
  await fireEvent.input(note, { target: { value: "这里是承诺。" }, isComposing: true });
  await fireEvent.compositionEnd(note, { data: "这里是承诺。" });
  await expect(note).toHaveValue("这里是承诺。");
}

async function verifyReadOnlyNotes(rowElement: HTMLElement): Promise<void> {
  const row = within(rowElement);
  for (const name of ["嵌字注释", "翻校注释"]) {
    const field = row.getByRole("textbox", { name });
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute("readonly");
  }
}

export const Translate: Story = {
  name: "翻译 · 仅聚焦 Unit 编辑注释",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = within(unitRow(canvasElement, 0));
    const second = within(unitRow(canvasElement, 1));
    const toggle = canvas.getByRole("button", { name: "注释编辑" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAttribute("title", "开启注释编辑");
    await verifyReadOnlyNotes(unitRow(canvasElement, 1));
    await userEvent.click(first.getByRole("textbox"));
    await expect(first.queryByRole("textbox", { name: "嵌字注释" })).toBeNull();
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAttribute("title", "关闭注释编辑");
    await verifyNoteFields(unitRow(canvasElement, 0));
    await userEvent.click(second.getByPlaceholderText("点击输入翻译..."));
    await verifyReadOnlyNotes(unitRow(canvasElement, 0));
    await verifyTwoVisibleFields(unitRow(canvasElement, 1));
    await expect(second.getByRole("textbox", { name: "嵌字注释" })).not.toHaveAttribute("readonly");
    await userEvent.click(first.getByPlaceholderText("点击输入翻译..."));
    await expect(first.getByRole("textbox", { name: "嵌字注释" })).toHaveValue("最后两个字加重。");
    await expect(first.getByRole("textbox", { name: "翻校注释" })).toHaveValue("这里是承诺。");
    await userEvent.click(toggle);
    await verifyReadOnlyNotes(unitRow(canvasElement, 0));
    await userEvent.type(first.getByRole("textbox", { name: "嵌字注释" }), "不可修改");
    await expect(first.getByRole("textbox", { name: "嵌字注释" })).toHaveValue("最后两个字加重。");
    await verifyReadOnlyNotes(unitRow(canvasElement, 1));
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};

export const Proofread: Story = {
  name: "校对 · 默认显示已有注释",
  args: { mode: "proofread" },
  play: async ({ canvasElement }) => {
    await verifyReadOnlyNotes(unitRow(canvasElement, 1));
    await verifyTwoVisibleFields(unitRow(canvasElement, 1));
    await expect(
      within(unitRow(canvasElement, 1)).getByRole("textbox", { name: "翻校注释" }),
    ).toHaveValue("这里带有确认语气，补上“就”更贴近原意。");
    await editNotes(canvasElement, 1);
    const row = within(unitRow(canvasElement, 1));
    await expect(row.getByRole("textbox", { name: "嵌字注释" })).not.toHaveAttribute("readonly");
    await expect(row.getByRole("textbox", { name: "翻校注释" })).not.toHaveAttribute("readonly");
  },
};

export const Narrow: Story = {
  name: "窄栏 · 330px",
  args: { width: 330, mode: "proofread" },
  play: async ({ canvasElement }) => {
    await editNotes(canvasElement, 1);
    const element = unitRow(canvasElement, 1);
    await verifyTwoVisibleFields(element);
    const note = within(element).getByRole("textbox", { name: "嵌字注释" });
    await userEvent.type(note, "{Enter}这一句保持两行，省略号与后面的文字放在同一行。");
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
    await expect(note.scrollHeight).toBeLessThanOrEqual(note.clientHeight + 1);
  },
};

export const ReadOnly: Story = {
  name: "只读 · 始终按内容显示注释",
  args: { readOnly: true, mode: "proofread" },
  play: async ({ canvasElement }) => {
    await verifyReadOnlyNotes(unitRow(canvasElement, 1));
    await editNotes(canvasElement, 0);
    await expect(within(unitRow(canvasElement, 0)).queryByText("嵌字注释")).toBeNull();
    await expect(within(unitRow(canvasElement, 0)).queryByText("翻校注释")).toBeNull();
    await verifyReadOnlyNotes(unitRow(canvasElement, 1));
  },
};

export const ClearNotes: Story = {
  name: "清空两类注释",
  play: async ({ canvasElement }) => {
    await editNotes(canvasElement, 1);
    const row = within(unitRow(canvasElement, 1));
    await userEvent.clear(row.getByRole("textbox", { name: "嵌字注释" }));
    await userEvent.clear(row.getByRole("textbox", { name: "翻校注释" }));
    const toggle = within(canvasElement).getByRole("button", { name: "注释编辑" });
    await userEvent.click(toggle);
    await expect(row.queryByRole("textbox", { name: "嵌字注释" })).toBeNull();
    await expect(row.queryByRole("textbox", { name: "翻校注释" })).toBeNull();
    await userEvent.click(toggle);
    await expect(row.getByRole("textbox", { name: "翻校注释" })).toHaveValue("");
    await expect(row.getByRole("textbox", { name: "嵌字注释" })).toHaveValue("");
  },
};

export const SingleNote: Story = {
  name: "仅显示已有的注释字段",
  play: async ({ canvasElement }) => {
    const row = within(unitRow(canvasElement, 2));
    await expect(row.queryByRole("textbox", { name: "嵌字注释" })).toBeNull();
    await expect(row.getByRole("textbox", { name: "翻校注释" })).toHaveAttribute("readonly");
    await editNotes(canvasElement, 2);
    const typography = row.getByRole("textbox", { name: "嵌字注释" });
    await expect(typography).toHaveValue("");
    await expect(typography).not.toHaveAttribute("readonly");
    await userEvent.type(typography, "保留换行。");
    await userEvent.clear(row.getByRole("textbox", { name: "翻校注释" }));
    await userEvent.click(
      within(unitRow(canvasElement, 0)).getByPlaceholderText("点击输入翻译..."),
    );
    await expect(typography).toHaveValue("保留换行。");
    await expect(typography).toHaveAttribute("readonly");
    await expect(row.queryByRole("textbox", { name: "翻校注释" })).toBeNull();
    await expect(
      within(unitRow(canvasElement, 0)).getByRole("textbox", { name: "翻校注释" }),
    ).not.toHaveAttribute("readonly");
  },
};
