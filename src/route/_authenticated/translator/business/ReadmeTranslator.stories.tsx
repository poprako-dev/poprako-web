import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BaseTranslator } from "./BaseTranslator";
import { ReadmeUnitDetail } from "./test/ReadmeUnitDetail";
import { createReadmeTranslatorArgs } from "./test/readme-translator-fixture";

const meta = {
  title: "README/Translator",
  component: BaseTranslator,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "readmeDesktop" },
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BaseTranslator>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForContent(canvasElement: HTMLElement, requireImage = true): Promise<void> {
  await expect(
    await within(canvasElement).findByDisplayValue("如果风停了，信就送不到了吧。"),
  ).toBeVisible();
  await waitFor(async () => {
    const images = Array.from(canvasElement.querySelectorAll("img"));
    if (requireImage) await expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      await expect(image.complete).toBe(true);
      await expect(image.naturalWidth).toBeGreaterThan(0);
    }
  });
  const activeElement = canvasElement.ownerDocument.activeElement;
  if (activeElement instanceof HTMLElement) activeElement.blur();
}

export const Proofread: Story = {
  name: "校对模式整页",
  args: createReadmeTranslatorArgs(),
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement);
    await expect(within(canvasElement).getByRole("button", { name: "完成校对" })).toBeVisible();
  },
};

export const UnitDetail: Story = {
  name: "翻校单元特写",
  args: createReadmeTranslatorArgs(),
  render: () => <ReadmeUnitDetail />,
  play: async ({ canvasElement }) => {
    await waitForContent(canvasElement, false);
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("textbox", { name: "翻校注释" })).toHaveLength(2);
    await userEvent.click(canvas.getByDisplayValue("这是寄给明天的信。"));
    await expect(await canvas.findByRole("group", { name: "优选符号" })).toBeVisible();
  },
};
