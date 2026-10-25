import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ComicList } from "../comic-list/ComicList";
import { ArchiveBrowserStory } from "./ArchiveBrowserStory";
import { archivedComics } from "./archive-browser-fixture";

const meta = {
  title: "Features/ComicPlayground/ArchiveBrowser",
  component: ComicList,
  parameters: { layout: "fullscreen" },
  render: (args) => <ArchiveBrowserStory {...args} />,
} satisfies Meta<typeof ComicList>;
export default meta;
type Story = StoryObj<typeof ComicList>;

export const Default: Story = { name: "归档列表" };

export const ModeSwitch: Story = {
  name: "三模式切换 · 保留并禁用进度筛选",
  args: { initialMode: "reviewer" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filters = (): HTMLElement => canvas.getByRole("group", { name: "进度筛选" });
    const [translate] = within(filters()).getAllByRole("button", { name: "翻·未筛选" });
    if (!translate) throw new Error("Missing translation selector");
    await userEvent.click(translate);
    await userEvent.click(within(filters()).getByRole("button", { name: "翻·已完成" }));
    await userEvent.click(canvas.getByRole("button", { name: "归档浏览" }));
    await expect(await canvas.findByRole("list", { name: "归档漫画" })).toBeVisible();
    await expect(filters()).toBeVisible();
    await expect(filters()).toBeDisabled();
    await expect(within(filters()).getAllByRole("button", { name: "翻·已完成" })[0]).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "翻译模式" }));
    await expect(filters()).toBeVisible();
    await expect(filters()).not.toBeDisabled();
    await expect(within(filters()).getAllByRole("button", { name: "翻·已完成" })[0]).toBeEnabled();
    await expect(canvas.queryByRole("list", { name: "归档漫画" })).not.toBeInTheDocument();
  },
};

export const SearchAndWorkset: Story = {
  name: "搜索与作品集切换",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("textbox");
    await userEvent.type(search, "雨后{Enter}");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(13));
    await userEvent.clear(search);
    await userEvent.type(search, "来信{Enter}");
    await expect(await canvas.findByText("暂无归档漫画")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /连载作品/ }));
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(13));
    await expect(search).toHaveValue("来信");
  },
};

export const Empty: Story = {
  name: "无归档漫画",
  args: { onLoadComics: () => Promise.resolve({ success: true, data: [] }) },
};

export const LoadError: Story = {
  name: "加载失败",
  args: { onLoadComics: () => Promise.resolve({ success: false, error: "归档漫画加载失败" }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("归档漫画加载失败");
    await expect(canvas.getByRole("button", { name: "重试" })).toBeEnabled();
  },
};

export const LongTitles: Story = {
  name: "长标题与作者",
  args: {
    onLoadComics: (offset) =>
      Promise.resolve({
        success: true,
        data: offset
          ? []
          : archivedComics.slice(0, 6).map((comic) => ({
              ...comic,
              title:
                "长夜尽头的旅行者与那个没有名字的小镇——在最后一班列车离开之前，我们仍然等待着来自遥远星海的回信",
            })),
      }),
  },
};

export const Mobile: Story = {
  ...LongTitles,
  name: "移动端",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

export const NarrowModeSwitch: Story = {
  ...ModeSwitch,
  name: "窄屏三模式切换",
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
