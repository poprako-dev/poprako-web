import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BaseTranslator } from "../BaseTranslator";
import {
  createRevisionStoryArgs,
  revisionPreferenceFixture,
} from "../test/revision-note-story-fixture";

const meta: Meta<typeof BaseTranslator> = {
  title: "Features/Translator/revision_note",
  component: BaseTranslator,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => revisionPreferenceFixture(),
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  name: "完整双栏 · 选择与切换",
  args: createRevisionStoryArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole("application");
    const exit = canvas.getByRole("button", { name: "退出翻译器" });
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
    await userEvent.click(canvas.getByRole("button", { name: "切换到翻校对照" }));
    await expect(
      await canvas.findAllByRole("textbox", { name: "翻译与校对差异" }),
    ).not.toHaveLength(0);
    await expect(canvas.getByRole("application")).toBe(viewport);
    await expect(canvas.getByRole("button", { name: "退出翻译器" })).toBe(exit);
    await userEvent.click(canvas.getByRole("button", { name: "切换到 revision_note" }));
    await expect(canvas.getByRole("application")).toBe(viewport);
    await expect(
      await canvas.findByRole("button", { name: "revision_note 2：断行" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(args.loadRevisionNotes).toHaveBeenCalledTimes(1);
    await expect(args.loadRevisionPage).toHaveBeenCalledTimes(1);
  },
};

export const DefaultComparison: Story = {
  name: "偏好 · 翻校对照",
  args: createRevisionStoryArgs(),
  beforeEach: () => revisionPreferenceFixture("unit"),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("button", { name: "切换到 revision_note" })).toBeVisible();
    await expect(args.loadRevisionNotes).not.toHaveBeenCalled();
  },
};

export const Unavailable: Story = {
  name: "无数据 · 保留偏好并回退",
  args: createRevisionStoryArgs({ available: false }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findAllByRole("textbox", { name: "翻译与校对差异" }),
    ).not.toHaveLength(0);
    await expect(canvas.queryByRole("button", { name: "切换到 revision_note" })).toBeNull();
    await expect(localStorage.getItem("translator:read-only-view")).toBe("revision_note");
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
    await expect(args.loadRevisionNotes).toHaveBeenLastCalledWith("page-2");
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
    await expect(args.loadRevisionNotes).toHaveBeenLastCalledWith("page-3");
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
    await expect(await canvas.findByText("revision_note 加载失败")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "重试" }));
    await waitFor(async () => {
      await expect(args.loadRevisionNotes).toHaveBeenCalledTimes(2);
    });
    await expect(await canvas.findByRole("button", { name: "切换到翻校对照" })).toBeEnabled();
  },
};

export const LayerFiltering: Story = {
  name: "PSD 图层 · 筛选与独立预览",
  args: createRevisionStoryArgs(),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "revision_note 1：文字位置" });
    await expect(args.onLoadUnits).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "图层 0.1.1：对白" }));
    await expect(canvas.queryByRole("button", { name: "revision_note 1：文字位置" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "revision_note 2：断行" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "定位 revision_note 1" })).toBeNull();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "切换独立图层预览" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-preview-mode="layer"]')).not.toBeNull();
    });
    await expect(canvas.getByRole("button", { name: "定位 revision_note 2" })).toBeVisible();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "切换独立图层预览" }));
    await userEvent.keyboard("{Escape}");
    await expect(canvasElement.querySelector('[data-preview-mode="page"]')).not.toBeNull();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await userEvent.click(canvas.getByRole("button", { name: "图层 0.1：文字" }));
    await expect(canvas.getByRole("button", { name: "revision_note 1：文字位置" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "revision_note 4：整页说明" })).toBeNull();
    await userEvent.click(canvas.getByLabelText("选择 PSD 图层"));
    await expect(canvas.getByRole("button", { name: "切换独立图层预览" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    await expect(args.onLoadUnits).not.toHaveBeenCalled();
    await expect(args.onSaveUnits).not.toHaveBeenCalled();
  },
};
