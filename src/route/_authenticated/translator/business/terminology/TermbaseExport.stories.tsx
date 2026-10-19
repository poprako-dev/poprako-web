import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { createDataSource, renderAtWidth } from "../test/TerminologyLookupStoryFixture";

import { TerminologyLookupPreview } from "../test/TerminologyLookupPreview";

import type { TerminologyDataSource } from "@/route/_authenticated/business/terminology/terminology-contract";

const meta: Meta<typeof TerminologyLookupPreview> = {
  title: "Features/BaseTranslator/TermbaseExport",
  component: TerminologyLookupPreview,
  parameters: { layout: "centered" },
  render: renderAtWidth(900),
};

export default meta;
type Story = StoryObj<typeof TerminologyLookupPreview>;

function pendingDataSource(): TerminologyDataSource {
  return {
    ...createDataSource(),
    exportTermbase: () => new Promise<never>(() => undefined),
  };
}

export const Exporting: Story = {
  args: { dataSource: pendingDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const shares = await canvas.findAllByRole("button", { name: "导出术语库" });
    const share = shares[0];
    if (!share) throw new Error("Missing export button");
    await waitFor(async () => {
      await expect(share).toBeVisible();
    });
    await userEvent.click(share);
    await expect(shares[0]).toBeDisabled();
    await expect(shares[1]).toBeEnabled();
    await waitFor(async () => {
      await expect(canvas.getByRole("status", { name: "正在导出术语库" })).toBeVisible();
    });
    await expect(canvas.getByRole("combobox", { name: "搜索术语原文" })).toBeDisabled();
  },
};

export const Mobile390: Story = {
  ...Exporting,
  args: { dataSource: pendingDataSource() },
  render: renderAtWidth(390),
};

export const Keyboard: Story = {
  args: { dataSource: pendingDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const select = await canvas.findByRole("button", { name: /角色称谓/ });
    select.focus();
    await userEvent.tab();
    const shares = canvas.getAllByRole("button", { name: "导出术语库" });
    await expect(shares[0]).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(shares[0]).toBeDisabled();
    select.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("button", { name: "切换术语库，当前为 角色称谓" })).toBeVisible();
  },
};
