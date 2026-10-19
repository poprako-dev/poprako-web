import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Utilities } from "./Utilities";
import { createTeamTerminologyFixture } from "./team-terminology-fixture";
import type { TeamTerminology } from "./team-terminology";

function terminology(canEdit = true): TeamTerminology {
  return { teamId: "team-1", canEdit, dataSource: createTeamTerminologyFixture() };
}
const meta = {
  title: "Features/Utilities/TeamTerminology",
  component: Utilities,
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <main className="h-dvh overflow-hidden pb-14 sm:pb-0">
      <Utilities {...args} />
    </main>
  ),
} satisfies Meta<typeof Utilities>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Libraries: Story = {
  args: { terminology: terminology() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "查看术语库" }));
    await expect(await canvas.findByRole("button", { name: /^奇幻世界共用词/ })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "新建术语库" })).toBeVisible();
  },
};
export const TermsAndBack: Story = {
  args: { terminology: terminology() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "查看术语库" }));
    await userEvent.click(await canvas.findByRole("button", { name: /^奇幻世界共用词/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("団長")).toBeVisible();
    });
    await userEvent.type(canvas.getByRole("textbox", { name: "搜索术语原文" }), "団");
    await waitFor(async () => {
      await expect(canvas.queryByText("エルフ")).toBeNull();
    });
    await userEvent.click(canvas.getByRole("button", { name: "定界压缩" }));
    await userEvent.click(canvas.getByRole("button", { name: "查看术语库" }));
    await expect(canvas.getByRole("textbox", { name: "搜索术语原文" })).toHaveValue("団");
    await userEvent.click(canvas.getByRole("button", { name: "返回术语库" }));
    await expect(await canvas.findByRole("button", { name: /^奇幻世界共用词/ })).toBeVisible();
  },
};
export const ReadOnly: Story = {
  args: { terminology: terminology(false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "查看术语库" }));
    await expect(canvas.queryByRole("button", { name: "新建术语库" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "导入术语库" })).toBeNull();
    await userEvent.click(await canvas.findByRole("button", { name: /^奇幻世界共用词/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("団長")).toBeVisible();
    });
    await expect(canvas.queryByRole("button", { name: "新建术语" })).toBeNull();
  },
};
export const Imported: Story = {
  args: { terminology: terminology() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const file = new File(
      [JSON.stringify({ name: "地名", terms: [{ source: "王都", targets: ["王城"] }] })],
      "places.json",
      { type: "application/json" },
    );
    await userEvent.upload(canvas.getByLabelText("选择团队术语库 JSON 文件"), file);
    await waitFor(async () => {
      await expect(canvas.getByText("王城")).toBeVisible();
    });
    await expect(canvas.getByRole("button", { name: "查看术语库" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.pointer({ keys: "[MouseLeft>]", target: canvas.getByText("王都") });
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(async () => {
      await expect(page.getByRole("dialog", { name: "编辑术语" })).toBeVisible();
    });
    await userEvent.pointer({ keys: "[/MouseLeft]", target: canvas.getByText("王都") });
    const input = page.getByRole("textbox", { name: "译名 1" });
    await userEvent.type(input, "中央");
    await expect(input).toHaveFocus();
    await userEvent.click(page.getByRole("button", { name: "保存" }));
    await waitFor(async () => {
      await expect(canvas.getByText("王城中央")).toBeVisible();
    });
  },
};
export const ErrorWithRetry: Story = {
  args: {
    terminology: {
      ...terminology(),
      dataSource: {
        ...createTeamTerminologyFixture(),
        listTermbases: () => Promise.resolve({ success: false, error: "术语库暂时不可用" }),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "查看术语库" }));
    await expect(await canvas.findByRole("button", { name: "重试" })).toBeVisible();
  },
};
export const Mobile390: Story = {
  ...TermsAndBack,
  args: { terminology: terminology() },
  render: (args) => (
    <main className="h-[844px] w-[390px] overflow-hidden pb-14">
      <Utilities {...args} />
    </main>
  ),
};
