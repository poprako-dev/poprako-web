import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { SpecialCharPanel } from "@/route/_authenticated/translator/business/special-character/SpecialCharPanel";

const meta: Meta<typeof SpecialCharPanel> = {
  title: "Translator/SpecialCharPanel",
  component: SpecialCharPanel,
  parameters: { layout: "fullscreen" },
  loaders: [
    () => {
      localStorage.removeItem("specialChars_v2");
      return {};
    },
  ],
  args: { onClose: fn() },
};

export default meta;
type Story = StoryObj<typeof SpecialCharPanel>;

/** Clicks whatever the browser would hit at that point, like a real pointer. */
function clickAt(ownerDocument: Document, point: { x: number; y: number }): void {
  const target = ownerDocument.elementFromPoint(point.x, point.y);
  if (!(target instanceof HTMLElement)) throw new Error("点位上没有可点击元素");
  target.click();
}

function centerOf(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export const Default: Story = {};

export const DeleteModeDeletesSymbols: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "特殊符号面板" });
    // The enter animation scales the panel; hit-testing only reflects the final layout after it.
    await waitFor(async () => {
      await expect(getComputedStyle(dialog).transform).toBe("none");
    });
    const ownerDocument = canvasElement.ownerDocument;
    clickAt(ownerDocument, centerOf(page.getByRole("button", { name: "删除" })));
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(page.getByText("点击符号将其删除，拖动可排序")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "特殊符号面板" })).toBeVisible();
    clickAt(ownerDocument, centerOf(page.getByRole("button", { name: "♪" })));
    await waitFor(async () => {
      await expect(page.queryByRole("button", { name: "♪" })).toBeNull();
    });
    await expect(page.getByRole("dialog", { name: "特殊符号面板" })).toBeVisible();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

export const EscapeClosesPanel: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole("dialog", { name: "特殊符号面板" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
