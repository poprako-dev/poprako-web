import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Reviewer } from "../Reviewer";
import { createIssueStoryArgs } from "../test/issue-story-fixture";

const meta: Meta<typeof Reviewer> = {
  title: "Features/Reviewer/issue",
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

function readPixels(image: HTMLCanvasElement | null): Uint8ClampedArray {
  if (!image) throw new Error("Expected a rendered PSD page");
  const copy = new OffscreenCanvas(image.width, image.height);
  const context = copy.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Expected a pixel readback context");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, copy.width, copy.height).data;
  copy.width = 0;
  copy.height = 0;
  return pixels;
}

export const Interactive: Story = {
  name: "完整双栏 · 选择与切换",
  args: createIssueStoryArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const issue = await canvas.findByRole("button", { name: "issue 1：文字位置" });
    const region = await canvas.findByRole("button", { name: "定位 issue 1" });
    await userEvent.click(issue);
    await expect(region).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "定位 issue 2" }));
    await expect(canvas.getByRole("button", { name: "issue 2：断行" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "切换 issue 矩形显示" }));
    await expect(canvas.queryByRole("button", { name: "定位 issue 1" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "切换 issue 矩形显示" }));
    await expect(args.loadIssues).toHaveBeenCalledTimes(1);
    await expect(args.loadReviewPage).toHaveBeenCalledTimes(1);
  },
};

export const WithoutIssues: Story = {
  name: "PSD 预览 · 无 issue",
  args: { ...createIssueStoryArgs(), loadIssues: () => Promise.resolve([]) },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector("canvas")).not.toBeNull());
    await expect(within(canvasElement).getByLabelText("选择 PSD 图层")).toBeVisible();
  },
};
export const Unavailable: Story = {
  name: "预览不可用",
  args: { ...createIssueStoryArgs(), loadReviewPage: null },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("预览暂不可用")).toBeVisible();
  },
};
export const EmptyPage: Story = {
  name: "当前页无 issue",
  args: { ...createIssueStoryArgs(), startPageId: "page-2" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("本页没有 issue")).toBeVisible();
  },
};

export const LongAndOverlapping: Story = {
  name: "长文本 · 无框 · 重叠区域",
  args: { ...createIssueStoryArgs(), startPageId: "page-3" },
};

export const MarkerOcclusion: Story = {
  name: "Marker 遮挡 · 标号与框",
  args: {
    ...createIssueStoryArgs(),
    loadIssues: (pageId, signal) => {
      signal.throwIfAborted();
      return Promise.resolve([
        {
          id: `${pageId}-1`,
          pageId,
          index: 0,
          variant: "文字位置",
          note: "与 2 的左上角接近，两个标号互相遮叠。",
          rect: { xCoord: 0.66, yCoord: 0.12, width: 0.18, height: 0.09 },
          layerPath: "0.1.0",
        },
        {
          id: `${pageId}-2`,
          pageId,
          index: 1,
          variant: "断行",
          note: "与 1 的标号重叠；从列表选择可观察选中后的遮挡。",
          rect: { xCoord: 0.67, yCoord: 0.125, width: 0.18, height: 0.09 },
          layerPath: "0.1.0",
        },
        {
          id: `${pageId}-3`,
          pageId,
          index: 2,
          variant: "文字位置",
          note: "上边框被 4 的标号压住。",
          rect: { xCoord: 0.09, yCoord: 0.42, width: 0.2, height: 0.12 },
          layerPath: "0.1.1",
        },
        {
          id: `${pageId}-4`,
          pageId,
          index: 3,
          variant: "断行",
          note: "标号跨过 3 的上边框，两个矩形也有重叠。",
          rect: { xCoord: 0.18, yCoord: 0.442, width: 0.2, height: 0.12 },
          layerPath: "0.1.1",
        },
        {
          id: `${pageId}-5`,
          pageId,
          index: 4,
          variant: "文字位置",
          note: "与 6 的矩形相交，框线互相遮叠。",
          rect: { xCoord: 0.1, yCoord: 0.73, width: 0.5, height: 0.13 },
          layerPath: null,
        },
        {
          id: `${pageId}-6`,
          pageId,
          index: 5,
          variant: "断行",
          note: "与 5 的区域重叠；切换选中项可对比框线的层级。",
          rect: { xCoord: 0.43, yCoord: 0.77, width: 0.3, height: 0.12 },
          layerPath: null,
        },
      ]);
    },
  },
};

export const KeyboardAndNavigation: Story = {
  name: "键盘选择 · 翻页清除选择",
  args: createIssueStoryArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const last = await canvas.findByRole("button", { name: "issue 4：整页说明" });
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect(last).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Escape}{Tab}");
    await expect(canvas.getByRole("button", { name: "issue 1：文字位置" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const previousImage = canvasElement.querySelector("canvas");
    await expect(previousImage?.width).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(await canvas.findByText("本页没有 issue")).toBeVisible();
    await expect(previousImage?.width).toBe(0);
    await expect(previousImage?.height).toBe(0);
    await expect(args.loadIssues).toHaveBeenCalledTimes(2);
    await expect(args.loadIssues).toHaveBeenLastCalledWith("page-2", expect.any(AbortSignal));
    await userEvent.click(canvas.getByRole("button", { name: "Previous page" }));
    await expect(await canvas.findByRole("button", { name: "issue 1：文字位置" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};

export const RapidNavigation: Story = {
  name: "加载中连续翻页 · 当前页优先",
  args: createIssueStoryArgs({ delay: 350 }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Next page" }));
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(await canvas.findByRole("button", { name: "issue 5：区域重叠" })).toBeVisible();
    await expect(args.loadIssues).toHaveBeenLastCalledWith("page-3", expect.any(AbortSignal));
    await expect(args.loadReviewPage).toHaveBeenLastCalledWith("page-3", expect.any(AbortSignal));
    await expect(canvas.queryByText("本页没有 issue")).toBeNull();
  },
};

export const Loading: Story = {
  name: "当前页加载中",
  args: {
    ...createIssueStoryArgs(),
    loadIssues: () =>
      new Promise(() => {
        /* Deliberately pending to preview the loading state. */
      }),
  },
};

export const Failed: Story = {
  name: "加载失败 · 重试与返回",
  args: createIssueStoryArgs({ fail: true }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("issue 加载失败");
    await userEvent.click(canvas.getByRole("button", { name: "重试 issue" }));
    await waitFor(async () => {
      await expect(args.loadIssues).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => expect(canvasElement.querySelector("canvas")).not.toBeNull());
  },
};

export const LayerFiltering: Story = {
  name: "PSD 图层 · 仅筛选批注",
  args: createIssueStoryArgs(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "issue 1：文字位置" });
    await waitFor(() => expect(canvasElement.querySelector("canvas")?.width).toBeGreaterThan(0));
    await waitFor(() =>
      expect(canvasElement.querySelector("canvas")?.getBoundingClientRect().width).toBeGreaterThan(
        0,
      ),
    );
    const image = canvasElement.querySelector("canvas");
    const pixels = readPixels(image);
    const imagePosition = image?.getBoundingClientRect();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(await canvas.findByRole("button", { name: "图层 0.1.1：对白" }));
    await expect(canvas.queryByRole("button", { name: "issue 1：文字位置" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "issue 2：断行" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "定位 issue 1" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "定位 issue 2" })).toBeVisible();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "图层 0.1：文字" }));
    await expect(canvas.getByRole("button", { name: "issue 1：文字位置" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "issue 4：整页说明" })).toBeNull();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "全部" }));
    await expect(canvas.getByRole("button", { name: "issue 4：整页说明" })).toBeVisible();
    await expect(canvasElement.querySelectorAll("canvas")).toHaveLength(1);
    await expect(canvasElement.querySelector("canvas")).toBe(image);
    await expect(readPixels(image)).toEqual(pixels);
    const currentPosition = image?.getBoundingClientRect();
    await expect([
      currentPosition?.x,
      currentPosition?.y,
      currentPosition?.width,
      currentPosition?.height,
    ]).toEqual([imagePosition?.x, imagePosition?.y, imagePosition?.width, imagePosition?.height]);
  },
};
