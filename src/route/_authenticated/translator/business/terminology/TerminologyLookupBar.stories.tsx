import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { TerminologyLookupBar } from "@/route/_authenticated/translator/business/terminology/TerminologyLookupBar";
import {
  createDataSource,
  longPress,
  lookupWidth,
  renderAtWidth,
} from "@/route/_authenticated/translator/business/test/TerminologyLookupStoryFixture";

const meta: Meta<typeof TerminologyLookupBar> = {
  title: "Features/BaseTranslator/TerminologyLookupBar",
  component: TerminologyLookupBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  render: renderAtWidth(900),
};

export default meta;
type Story = StoryObj<typeof TerminologyLookupBar>;

export const Unselected: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    await waitFor(
      async () => {
        await expect(Math.round(lookupWidth(canvasElement))).toBe(180);
      },
      { timeout: 1000 },
    );
  },
};

export const MixedTermbases: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("角色称谓")).toBeVisible();
        await expect(canvas.getByText("团队")).toBeVisible();
        await expect(canvas.getAllByText("本作")).toHaveLength(2);
        await expect(Math.round(lookupWidth(canvasElement))).toBe(360);
      },
      { timeout: 3000 },
    );
  },
};

export const TermList: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const option = await canvas.findByRole("option", { name: /角色称谓/ });
    await waitFor(
      async () => {
        await expect(option).toBeVisible();
      },
      { timeout: 3000 },
    );
    await userEvent.click(option);
    await userEvent.click(canvas.getByRole("combobox", { name: "搜索术语原文" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("アリシア")).toBeVisible();
      },
      { timeout: 3000 },
    );
  },
};

export const DebouncedSearch: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const search = canvas.getByRole("textbox", { name: "搜索术语库名称" });
    await userEvent.type(search, "地名");
    await waitFor(
      async () => {
        await expect(canvas.getByRole("option", { name: /地名/ })).toBeVisible();
        await expect(canvas.queryByRole("option", { name: /角色称谓/ })).toBeNull();
      },
      { timeout: 3000 },
    );
  },
};

export const CreateTermbase: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await userEvent.click(await canvas.findByRole("button", { name: "新建术语库" }));
    await userEvent.type(page.getByRole("textbox", { name: "名称" }), "战斗用语");
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await waitFor(
      async () => {
        await expect(canvas.getByRole("option", { name: /战斗用语/ })).toBeVisible();
      },
      { timeout: 3000 },
    );
  },
};

export const EditTermbaseByLongPress: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    const option = await canvas.findByRole("option", { name: /角色称谓/ });
    await longPress(option);
    await waitFor(async () => {
      await expect(page.getByRole("dialog", { name: "编辑术语库" })).toBeVisible();
    });
    await userEvent.click(page.getByRole("button", { name: "删除" }));
    await expect(page.getByRole("dialog", { name: "删除术语库" })).toBeVisible();
    await expect(page.getByText("删除后，其中全部术语也会一并删除。")).toBeVisible();
  },
};

export const CreateTerm: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await userEvent.click(await canvas.findByRole("option", { name: /角色称谓/ }));
    await userEvent.click(canvas.getByRole("combobox", { name: "搜索术语原文" }));
    await userEvent.click(await canvas.findByRole("button", { name: "新建术语" }));
    await userEvent.type(page.getByRole("textbox", { name: "原文" }), "副団長");
    await userEvent.type(page.getByRole("textbox", { name: "译名 1" }), "副团长");
    await expect(page.getByRole("textbox", { name: "译名 1" })).toHaveValue("副团长");
    await userEvent.type(page.getByRole("textbox", { name: "备注" }), "完整备注");
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("副団長")).toBeVisible();
        await expect(canvas.getByText("副团长")).toBeVisible();
      },
      { timeout: 3000 },
    );
    await longPress(canvas.getByText("副団長"));
    await expect(page.getByRole("textbox", { name: "译名 1" })).toHaveValue("副团长");
    await expect(page.getByRole("textbox", { name: "备注" })).toHaveValue("完整备注");
  },
};

export const TeamTermbaseReadOnly: Story = {
  args: { dataSource: createDataSource() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await userEvent.click(await canvas.findByRole("option", { name: /奇幻世界共用词/ }));
    await userEvent.click(canvas.getByRole("combobox", { name: "搜索术语原文" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("奇幻世界共用词")).toBeVisible();
        await expect(canvas.queryByRole("button", { name: "新建术语" })).toBeNull();
      },
      { timeout: 3000 },
    );
  },
};

export const Loading: Story = {
  args: {
    dataSource: {
      ...createDataSource(),
      listTermbases: () =>
        new Promise(() => {
          return;
        }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
  },
};

export const Empty: Story = {
  args: { dataSource: createDataSource({ termbaseItems: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("没有找到术语库")).toBeVisible();
      },
      { timeout: 3000 },
    );
  },
};

export const ErrorWithRetry: Story = {
  args: {
    dataSource: {
      ...createDataSource(),
      // eslint-disable-next-line @typescript-eslint/require-await
      listTermbases: async () => ({
        success: false,
        error: "术语库暂时不可用",
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("术语库暂时不可用")).toBeVisible();
      },
      { timeout: 3000 },
    );
  },
};

export const Mobile390: Story = {
  args: { dataSource: createDataSource() },
  render: renderAtWidth(390),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("角色称谓")).toBeVisible();
        await expect(Math.round(lookupWidth(canvasElement))).toBe(374);
      },
      { timeout: 3000 },
    );
  },
};

export const Tablet768: Story = {
  args: { dataSource: createDataSource() },
  render: renderAtWidth(768),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "选择术语库" }));
    await waitFor(
      async () => {
        await expect(canvas.getByText("角色称谓")).toBeVisible();
        await expect(Math.round(lookupWidth(canvasElement))).toBe(307);
      },
      { timeout: 3000 },
    );
  },
};
