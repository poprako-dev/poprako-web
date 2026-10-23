import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { createDataSource, renderAtWidth } from "../test/TerminologyLookupStoryFixture";
import { TerminologyLookupPreview } from "../test/TerminologyLookupPreview";
import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";

const meta = {
  title: "Features/BaseTranslator/TermbaseAppend",
  component: TerminologyLookupPreview,
  parameters: { layout: "centered" },
  render: renderAtWidth(900),
} satisfies Meta<typeof TerminologyLookupPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

function pendingDataSource(): TerminologyDataSource {
  return { ...createDataSource(), appendTermbase: () => new Promise<never>(() => undefined) };
}

export const Appending: Story = {
  args: { dataSource: pendingDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const inputs = await canvas.findAllByRole("button", { name: "追加术语" });
    await expect(inputs).toHaveLength(2);
    await userEvent.upload(
      canvas.getByLabelText("向角色称谓追加术语 JSON 文件"),
      new File(['{"terms":[{"source":"Elf","targets":["精灵"]}]}'], "terms.json", {
        type: "application/json",
      }),
    );
    await waitFor(async () => {
      await expect(canvas.getByRole("status", { name: "正在追加术语" })).toBeVisible();
    });
    for (const button of inputs) await expect(button).toBeDisabled();
    await expect(canvas.getByRole("combobox")).toBeDisabled();
    await expect(canvas.getByRole("dialog", { name: "选择术语库" })).toBeVisible();
  },
};

export const Mobile390: Story = {
  ...Appending,
  args: { dataSource: pendingDataSource() },
  render: renderAtWidth(390),
};
