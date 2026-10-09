import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Reviewer } from "../Reviewer";
import { createRevisionStoryArgs } from "../test/revision-note-story-fixture";

const meta: Meta<typeof Reviewer> = {
  title: "Features/Reviewer/revision_note",
  component: Reviewer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  name: "完整双栏 · 选择与切换",
  args: createRevisionStoryArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const note = await canvas.findByRole("button", { name: "revision_note 1：文字位置" });
    const region = await canvas.findByRole("button", { name: "定位 revision_note 1" });
    await userEvent.click(note);
    await expect(region).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "定位 revision_note 2" }));
    await expect(canvas.getByRole("button", { name: "revision_note 2：断行" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "切换 revision_note 矩形显示" }));
    await expect(canvas.queryByRole("button", { name: "定位 revision_note 1" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "切换 revision_note 矩形显示" }));
    await expect(args.loadRevisionNotes).toHaveBeenCalledTimes(1);
    await expect(args.loadRevisionPage).toHaveBeenCalledTimes(1);
  },
};

export const WithoutNotes: Story = {
  name: "PSD 预览 · 无批注数据源",
  args: { ...createRevisionStoryArgs(), loadRevisionNotes: null },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector("img")).not.toBeNull());
    await expect(within(canvasElement).getByLabelText("选择 PSD 图层")).toBeVisible();
  },
};
export const Unavailable: Story = {
  name: "预览不可用",
  args: { ...createRevisionStoryArgs(), loadRevisionPage: null },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("预览暂不可用")).toBeVisible();
  },
};
export const EmptyPage: Story = {
  name: "当前页无 revision_note",
  args: { ...createRevisionStoryArgs(), startPageId: "page-2" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("本页没有 revision_note")).toBeVisible();
  },
};

export const LongAndOverlapping: Story = {
  name: "长文本 · 无框 · 重叠区域",
  args: { ...createRevisionStoryArgs(), startPageId: "page-3" },
};

export const MarkerOcclusion: Story = {
  name: "Marker 遮挡 · 标号与框",
  args: {
    ...createRevisionStoryArgs(),
    loadRevisionNotes: (pageId, signal) => {
      signal.throwIfAborted();
      return Promise.resolve([
        {
          id: `${pageId}-1`,
          number: 1,
          type: "文字位置",
          content: "与 2 的左上角接近，两个标号互相遮叠。",
          rect: { xCoord: 0.66, yCoord: 0.12, width: 0.18, height: 0.09 },
          layerId: "0.1.0",
        },
        {
          id: `${pageId}-2`,
          number: 2,
          type: "断行",
          content: "与 1 的标号重叠；从列表选择可观察选中后的遮挡。",
          rect: { xCoord: 0.67, yCoord: 0.125, width: 0.18, height: 0.09 },
          layerId: "0.1.0",
        },
        {
          id: `${pageId}-3`,
          number: 3,
          type: "文字位置",
          content: "上边框被 4 的标号压住。",
          rect: { xCoord: 0.09, yCoord: 0.42, width: 0.2, height: 0.12 },
          layerId: "0.1.1",
        },
        {
          id: `${pageId}-4`,
          number: 4,
          type: "断行",
          content: "标号跨过 3 的上边框，两个矩形也有重叠。",
          rect: { xCoord: 0.18, yCoord: 0.442, width: 0.2, height: 0.12 },
          layerId: "0.1.1",
        },
        {
          id: `${pageId}-5`,
          number: 5,
          type: "文字位置",
          content: "与 6 的矩形相交，框线互相遮叠。",
          rect: { xCoord: 0.1, yCoord: 0.73, width: 0.5, height: 0.13 },
          layerId: null,
        },
        {
          id: `${pageId}-6`,
          number: 6,
          type: "断行",
          content: "与 5 的区域重叠；切换选中项可对比框线的层级。",
          rect: { xCoord: 0.43, yCoord: 0.77, width: 0.3, height: 0.12 },
          layerId: null,
        },
      ]);
    },
  },
};

export const KeyboardAndNavigation: Story = {
  name: "键盘选择 · 翻页清除选择",
  args: createRevisionStoryArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const last = await canvas.findByRole("button", { name: "revision_note 4：整页说明" });
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect(last).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Escape}{Tab}");
    await expect(canvas.getByRole("button", { name: "revision_note 1：文字位置" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(await canvas.findByText("本页没有 revision_note")).toBeVisible();
    await expect(args.loadRevisionNotes).toHaveBeenCalledTimes(2);
    await expect(args.loadRevisionNotes).toHaveBeenLastCalledWith(
      "page-2",
      expect.any(AbortSignal),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
    await expect(
      await canvas.findByRole("button", { name: "revision_note 1：文字位置" }),
    ).toHaveAttribute("aria-pressed", "false");
  },
};

export const RapidNavigation: Story = {
  name: "加载中连续翻页 · 当前页优先",
  args: createRevisionStoryArgs({ delay: 350 }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Next page" }));
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(
      await canvas.findByRole("button", { name: "revision_note 5：区域重叠" }),
    ).toBeVisible();
    await expect(args.loadRevisionNotes).toHaveBeenLastCalledWith(
      "page-3",
      expect.any(AbortSignal),
    );
    await expect(args.loadRevisionPage).toHaveBeenLastCalledWith("page-3", expect.any(AbortSignal));
    await expect(canvas.queryByText("本页没有 revision_note")).toBeNull();
  },
};

export const Loading: Story = {
  name: "当前页加载中",
  args: {
    ...createRevisionStoryArgs(),
    loadRevisionNotes: () =>
      new Promise(() => {
        /* Deliberately pending to preview the loading state. */
      }),
  },
};

export const Failed: Story = {
  name: "加载失败 · 重试与返回",
  args: createRevisionStoryArgs({ fail: true }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("revision_note 加载失败");
    await userEvent.click(canvas.getByRole("button", { name: "重试 revision_note" }));
    await waitFor(async () => {
      await expect(args.loadRevisionNotes).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => expect(canvasElement.querySelector("img")).not.toBeNull());
  },
};

export const LayerFiltering: Story = {
  name: "PSD 图层 · 仅筛选批注",
  args: createRevisionStoryArgs(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "revision_note 1：文字位置" });
    await waitFor(() =>
      expect(canvasElement.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
    await waitFor(() =>
      expect(canvasElement.querySelector("img")?.getBoundingClientRect().width).toBeGreaterThan(0),
    );
    const image = canvasElement.querySelector("img");
    const imageSrc = image?.getAttribute("src");
    const imagePosition = image?.getBoundingClientRect();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(await canvas.findByRole("button", { name: "图层 0.1.1：对白" }));
    await expect(canvas.queryByRole("button", { name: "revision_note 1：文字位置" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "revision_note 2：断行" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "定位 revision_note 1" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "定位 revision_note 2" })).toBeVisible();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "图层 0.1：文字" }));
    await expect(canvas.getByRole("button", { name: "revision_note 1：文字位置" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "revision_note 4：整页说明" })).toBeNull();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "全部" }));
    await expect(canvas.getByRole("button", { name: "revision_note 4：整页说明" })).toBeVisible();
    await expect(canvasElement.querySelectorAll("img")).toHaveLength(1);
    await expect(canvasElement.querySelector("img")).toBe(image);
    await expect(image).toHaveAttribute("src", imageSrc);
    const currentPosition = image?.getBoundingClientRect();
    await expect([
      currentPosition?.x,
      currentPosition?.y,
      currentPosition?.width,
      currentPosition?.height,
    ]).toEqual([imagePosition?.x, imagePosition?.y, imagePosition?.width, imagePosition?.height]);
  },
};
