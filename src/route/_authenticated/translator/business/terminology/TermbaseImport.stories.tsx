import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { createDataSource, renderAtWidth } from "../test/TerminologyLookupStoryFixture";
import { TerminologyLookupPreview } from "../test/TerminologyLookupPreview";

const meta: Meta<typeof TerminologyLookupPreview> = {
  title: "Features/BaseTranslator/TermbaseImport",
  component: TerminologyLookupPreview,
  parameters: { layout: "centered" },
  render: renderAtWidth(900),
};

export default meta;
type Story = StoryObj<typeof TerminologyLookupPreview>;

function importFile(): File {
  return new File(
    [
      JSON.stringify({
        name: "战斗用语",
        description: null,
        terms: [{ source: "団長", targets: ["团长", "队长"], comment: null }],
      }),
    ],
    "terms.json",
    { type: "application/json" },
  );
}

async function openCreate(canvasElement: HTMLElement): Promise<void> {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
  await userEvent.click(await canvas.findByRole("button", { name: "新建术语库" }));
}

export const Create: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    await openCreate(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.getByRole("button", { name: "导入" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "保存" })).toBeDisabled();
  },
};

export const Imported: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    await openCreate(canvasElement);
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.upload(page.getByLabelText("选择术语库 JSON 文件"), importFile());
    await waitFor(async () => {
      await expect(page.queryByRole("dialog", { name: "新建术语库" })).toBeNull();
      await expect(canvas.getByRole("button", { name: /战斗用语/ })).toBeVisible();
    });
    await userEvent.click(canvas.getByRole("button", { name: /战斗用语/ }));
    await userEvent.click(canvas.getByRole("combobox", { name: "搜索术语原文" }));
    await waitFor(async () => {
      await expect(canvas.getByText("団長")).toBeVisible();
      await expect(canvas.getByText("团长")).toBeVisible();
      await expect(canvas.getByText("本作")).toBeVisible();
    });
  },
};

export const Importing: Story = {
  args: {
    dataSource: {
      ...createDataSource(),
      importTermbase: () => new Promise<never>(() => undefined),
    },
  },
  play: async ({ canvasElement }) => {
    await openCreate(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.upload(page.getByLabelText("选择术语库 JSON 文件"), importFile());
    await expect(page.getByRole("button", { name: "导入" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "保存" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "关闭" })).toBeDisabled();
    await expect(page.getByRole("textbox", { name: "名称" })).toBeDisabled();
  },
};

export const DuplicateName: Story = {
  args: {
    dataSource: {
      ...createDataSource(),
      importTermbase: () =>
        Promise.resolve({ success: false, httpStatus: 422, error: "术语库名称已存在" }),
    },
  },
  play: async ({ canvasElement }) => {
    await openCreate(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.type(page.getByRole("textbox", { name: "名称" }), "未保存的名称");
    await userEvent.upload(page.getByLabelText("选择术语库 JSON 文件"), importFile());
    await waitFor(async () => {
      await expect(page.getByRole("button", { name: "导入" })).toBeEnabled();
      await expect(page.getByRole("dialog", { name: "新建术语库" })).toBeVisible();
    });
    await expect(page.getByRole("textbox", { name: "名称" })).toHaveValue("未保存的名称");
  },
};

export const Mobile390: Story = {
  ...Importing,
  render: renderAtWidth(390),
};
