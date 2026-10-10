import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Reviewer } from "../Reviewer";
import { createIssueStoryArgs, loadOcclusionIssues } from "../test/issue-story-fixture";

type MarkerRegion = { x: number; y: number; width: number; height: number };

function currentScale(surface: HTMLElement): number {
  return new DOMMatrixReadOnly(getComputedStyle(surface).transform).a;
}

async function expectFixedBorders(
  image: HTMLImageElement,
  markers: HTMLElement[],
  regions: MarkerRegion[],
): Promise<void> {
  const imageBounds = image.getBoundingClientRect();
  await Promise.all(
    markers.map(async (marker, index) => {
      const style = getComputedStyle(marker);
      const bounds = marker.getBoundingClientRect();
      const screenScale = bounds.width / Number.parseFloat(style.width);
      const badgeBounds = marker.querySelector("span")?.getBoundingClientRect();
      for (const border of [
        style.borderTopWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
        style.borderLeftWidth,
      ]) {
        await expect(Number.parseFloat(border) * screenScale).toBeCloseTo(2, 1);
      }
      await expect(badgeBounds?.width).toBeCloseTo(32, 1);
      await expect(badgeBounds?.height).toBeCloseTo(32, 1);
      await expect((bounds.left - imageBounds.left) / imageBounds.width).toBeCloseTo(
        regions[index]?.x ?? -1,
        3,
      );
      await expect((bounds.top - imageBounds.top) / imageBounds.height).toBeCloseTo(
        regions[index]?.y ?? -1,
        3,
      );
      await expect(bounds.width / imageBounds.width).toBeCloseTo(regions[index]?.width ?? -1, 3);
      await expect(bounds.height / imageBounds.height).toBeCloseTo(regions[index]?.height ?? -1, 3);
    }),
  );
}

function zoomImage(image: HTMLImageElement, deltaY: number): void {
  const bounds = image.getBoundingClientRect();
  for (let step = 0; step < 40; step += 1) {
    image.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY,
        clientX: bounds.left + bounds.width / 2,
        clientY: bounds.top + bounds.height / 2,
      }),
    );
  }
}

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
  name: "成稿预览 · 无 issue",
  args: { ...createIssueStoryArgs(), loadIssues: () => Promise.resolve([]) },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector("img")).not.toBeNull());
    await expect(within(canvasElement).queryByLabelText("选择 PSD 图层")).toBeNull();
  },
};

export const ZoomInvariantBorders: Story = {
  name: "缩放 · 框线固定 2px",
  args: createIssueStoryArgs(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = await canvas.findByRole("button", { name: "定位 issue 1" });
    await waitFor(() =>
      expect(canvasElement.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
    const image = canvasElement.querySelector("img");
    const surface = region.parentElement;
    if (!image || !surface) {
      throw new Error("Reviewer canvas did not load");
    }

    const loadedImage = image;
    const loadedSurface = surface;
    const markers = canvas.getAllByRole("button", { name: /^定位 issue/ });
    const imageBounds = loadedImage.getBoundingClientRect();
    const regions = markers.map((marker) => {
      const bounds = marker.getBoundingClientRect();
      return {
        x: (bounds.left - imageBounds.left) / imageBounds.width,
        y: (bounds.top - imageBounds.top) / imageBounds.height,
        width: bounds.width / imageBounds.width,
        height: bounds.height / imageBounds.height,
      };
    });

    await expectFixedBorders(loadedImage, markers, regions);
    zoomImage(loadedImage, -100);
    await waitFor(() => expect(currentScale(loadedSurface)).toBe(5));
    await expectFixedBorders(loadedImage, markers, regions);
    await userEvent.click(canvas.getByRole("button", { name: "issue 1：文字位置" }));
    await expect(region).toHaveAttribute("aria-pressed", "true");
    await expectFixedBorders(loadedImage, markers, regions);
    zoomImage(loadedImage, 100);
    await waitFor(() => expect(currentScale(loadedSurface)).toBe(0.5));
    await expectFixedBorders(loadedImage, markers, regions);
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
    loadIssues: loadOcclusionIssues,
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
    await waitFor(() =>
      expect(canvasElement.querySelector("img")?.naturalWidth).toBeGreaterThan(0),
    );
    const previousImage = canvasElement.querySelector("img");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(await canvas.findByText("本页没有 issue")).toBeVisible();
    await expect(previousImage?.isConnected).toBe(false);
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
    await expect(canvas.queryByLabelText("嵌稿预览状态")).not.toBeInTheDocument();
    await expect(canvas.queryByText("正在下载当前页预览")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(await canvas.findByRole("button", { name: "issue 5：区域重叠" })).toBeVisible();
    await expect(args.loadIssues).toHaveBeenLastCalledWith("page-3", expect.any(AbortSignal));
    await expect(args.loadReviewPage).toHaveBeenLastCalledWith(
      "page-3",
      expect.any(AbortSignal),
      expect.any(Function),
    );
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
    await waitFor(() => expect(canvasElement.querySelector("img")).not.toBeNull());
  },
};
