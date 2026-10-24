import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { ReviewEditorPreview } from "../test/ReviewEditorPreview";

const meta = {
  title: "Features/Reviewer/Editor",
  component: ReviewEditorPreview,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-screen w-full">
        <Story />
      </div>
    ),
  ],
  args: { scenario: "normal" },
} satisfies Meta<typeof ReviewEditorPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { name: "创建与编辑" };
export const KeyboardNavigation: Story = {
  name: "条目切换 · Tab 与 Shift+Tab",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = await canvas.findByLabelText("标注 1 说明");
    const second = canvas.getByLabelText("标注 2 说明");
    const last = canvas.getByLabelText("标注 4 说明");
    await userEvent.click(second);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await waitFor(() => expect(first).toHaveFocus());
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await waitFor(() => expect(last).toHaveFocus());
    await userEvent.keyboard("{Tab}{Tab}");
    await waitFor(() => expect(second).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "标注 1：文字位置" }));
    await userEvent.keyboard("{Tab}");
    await waitFor(() => expect(second).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "标注 2 分类" }));
    await userEvent.click(within(document.body).getByRole("menuitem", { name: "自定义分类…" }));
    const dialog = within(await within(document.body).findByRole("dialog"));
    const input = dialog.getByRole("textbox", { name: "分类名称" });
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.keyboard("{Tab}");
    await expect(dialog.getByRole("button", { name: "取消" })).toHaveFocus();
  },
};
export const EmptyPage: Story = { name: "空页 · 创建第一条", args: { startPageId: "page-2" } };
export const Overlapping: Story = { name: "重叠区域与长文本", args: { startPageId: "page-3" } };
export const WithoutImage: Story = { name: "预览不可用 · 整页说明", args: { unavailable: true } };
export const SlowSave: Story = { name: "保存中继续编辑", args: { scenario: "slow" } };
export const RestoredDraft: Story = { name: "恢复未保存草稿", args: { scenario: "recovery" } };
export const CompleteFailure: Story = {
  name: "完成失败 · 可重试",
  args: { scenario: "complete-failure" },
};
export const RemoteChanged: Story = {
  name: "远端更新 · 本地修改优先",
  args: { scenario: "remote-change" },
};
export const RemoteDeleted: Story = {
  name: "远端删除 · 保留本地编辑",
  args: { scenario: "remote-delete" },
};
export const ReviewReplaced: Story = {
  name: "重新导入 · 暂停旧草稿",
  args: { scenario: "import" },
};
export const ImageReplaced: Story = { name: "图片更新 · 核对区域", args: { scenario: "image" } };
export const StorageFailure: Story = {
  name: "草稿存储失败",
  args: { scenario: "storage-failure" },
};
export const LostResponse: Story = {
  name: "保存结果丢失 · 重试",
  args: { scenario: "lost-response" },
};

export const SaveFailure: Story = {
  name: "保存失败 · 修改保留",
  args: { scenario: "save-failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const note = await canvas.findByLabelText("标注 1 说明");
    await userEvent.clear(note);
    await userEvent.type(note, "请向左移动。");
    await userEvent.click(canvas.getByRole("button", { name: /^保存 ·/ }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("保存失败");
    await expect(note).toHaveValue("请向左移动。");
  },
};

export const AddPageNote: Story = {
  name: "整页说明 · 删除与回退",
  args: { startPageId: "page-2" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("本页暂无标注");
    const creation = within(canvas.getByRole("group", { name: "创建标注" }));
    await userEvent.click(creation.getByRole("button", { name: "新增整页说明" }));
    const note = await canvas.findByLabelText("标注 1 说明");
    await expect(note).toHaveFocus();
    await userEvent.type(note, "统一全角标点。");
    await expect(canvas.queryByRole("button", { name: "定位标注 1" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "删除标注" }));
    await userEvent.click(within(document.body).getByRole("button", { name: "删除" }));
    await canvas.findByText("本页暂无标注");
    await userEvent.click(canvas.getByRole("button", { name: "万能回退" }));
    await expect(await canvas.findByLabelText("标注 1 说明")).toHaveValue("统一全角标点。");
  },
};

export const CategorySelection: Story = {
  name: "分类 · 预设与自定义",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = await canvas.findByRole("button", { name: "标注 1 分类" });
    await userEvent.click(trigger);
    await expect(body.getByText("默认分类")).toBeVisible();
    for (const name of ["居中", "字体", "字号", "字重", "修图"]) {
      await expect(body.getByRole("menuitemradio", { name })).toBeVisible();
      await expect(body.getByRole("menuitemradio", { name })).toHaveAttribute("title", name);
    }
    await userEvent.click(body.getByRole("menuitemradio", { name: "居中" }));
    await userEvent.click(trigger);
    await userEvent.click(body.getByRole("menuitemradio", { name: "字体" }));
    await expect(trigger).toHaveTextContent("字体");
    await userEvent.click(trigger);
    await userEvent.click(body.getByRole("menuitem", { name: "自定义分类…" }));
    const dialog = within(await body.findByRole("dialog", { name: "自定义分类" }));
    const input = dialog.getByRole("textbox", { name: "分类名称" });
    await waitFor(() => expect(input).toHaveFocus());
    await expect(input).toHaveAttribute("autocomplete", "off");
    await userEvent.type(input, "气泡留白");
    await userEvent.click(dialog.getByRole("button", { name: "应用" }));
    await expect(trigger).toHaveTextContent("气泡留白");
    await expect(canvasElement.querySelector("datalist, input[list]")).toBeNull();
    await expect(canvas.queryByText("对白")).toBeNull();
    await userEvent.click(trigger);
    await expect(body.getByRole("menuitemradio", { name: "气泡留白" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.keyboard("{Escape}");
  },
};

export const RedrawFeedback: Story = {
  name: "重新框选 · 状态与取消",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "标注 1：文字位置" }));
    await userEvent.click(canvas.getByRole("button", { name: "重新框选" }));
    const redraw = canvas.getByRole("button", { name: "取消框选" });
    await expect(redraw).toHaveAttribute("aria-pressed", "true");
    await expect(redraw).toHaveClass("text-ink-green-800");
    await expect(redraw).toHaveTextContent("");
    await expect(redraw).toHaveAttribute("title", "正在框选 · 点击取消");
    await expect(canvas.queryByText(/正在框选/)).toBeNull();
    await expect(canvas.getByRole("button", { name: "取消框选 · Esc" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await expect(await canvas.findByRole("button", { name: "重新框选" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await userEvent.click(canvas.getByRole("button", { name: "重新框选" }));
    await userEvent.click(canvas.getByRole("button", { name: "取消框选 · Esc" }));
    await expect(canvas.queryByText("正在框选")).toBeNull();
  },
};

export const DeleteCustomCategory: Story = {
  name: "分类 · 删除自定义分类",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const first = await canvas.findByRole("button", { name: "标注 1 分类" });
    await userEvent.click(first);
    await userEvent.click(body.getByRole("menuitem", { name: "自定义分类…" }));
    await userEvent.type(body.getByRole("textbox", { name: "分类名称" }), "气泡留白");
    await userEvent.click(body.getByRole("button", { name: "应用" }));
    await userEvent.click(first);
    await expect(body.getByRole("menuitem", { name: "删除分类：气泡留白" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(body.getByRole("menuitemradio", { name: "居中" }));
    await userEvent.click(first);
    await waitFor(() =>
      expect(body.getByRole("menuitem", { name: "删除分类：气泡留白" })).not.toHaveAttribute(
        "aria-disabled",
        "true",
      ),
    );
    await userEvent.click(body.getByRole("menuitem", { name: "删除分类：气泡留白" }));
    const dialog = within(await body.findByRole("dialog", { name: "删除分类" }));
    await waitFor(() => expect(dialog.getByText("气泡留白")).toBeVisible());
    await userEvent.click(dialog.getByRole("button", { name: "关闭" }));
    await userEvent.click(first);
    await expect(body.getByRole("menuitemradio", { name: "气泡留白" })).toBeVisible();
    await userEvent.click(body.getByRole("menuitem", { name: "删除分类：气泡留白" }));
    await userEvent.click(body.getByRole("button", { name: "删除" }));
    await expect(first).toHaveTextContent("居中");
    await userEvent.click(canvas.getByRole("button", { name: "标注 2 分类" }));
    await expect(body.queryByRole("menuitemradio", { name: "气泡留白" })).toBeNull();
    await expect(body.getByRole("menuitemradio", { name: "居中" })).toBeVisible();
    await userEvent.click(body.getByRole("menuitem", { name: "自定义分类…" }));
    const input = body.getByRole("textbox", { name: "分类名称" });
    await userEvent.clear(input);
    await userEvent.type(input, "气泡留白");
    await userEvent.click(body.getByRole("button", { name: "应用" }));
    await userEvent.click(first);
    await expect(body.getByRole("menuitemradio", { name: "气泡留白" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const RenameCategory: Story = {
  name: "分类 · 重命名与跨页引用",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = await canvas.findByRole("button", { name: "标注 3 分类" });
    await userEvent.click(trigger);
    const rename = body.getByRole("menuitemradio", { name: "自定义：叠字节奏" });
    await waitFor(() => expect(rename).toHaveAttribute("title", "自定义：叠字节奏 · 长按编辑分类"));
    const remove = body.getByRole("menuitem", { name: "删除分类：自定义：叠字节奏" });
    await expect(remove).toHaveAttribute("aria-disabled", "true");
    await expect(remove).toHaveAttribute("title", "被 2 条标注引用，不能删除");
    await userEvent.pointer({ target: rename, keys: "[MouseLeft>]" });
    const dialog = within(await body.findByRole("dialog", { name: "重命名分类" }));
    await userEvent.pointer({ keys: "[/MouseLeft]" });
    const input = dialog.getByRole("textbox", { name: "分类名称" });
    await expect(input).toHaveValue("自定义：叠字节奏");
    await userEvent.clear(input);
    await expect(dialog.getByRole("button", { name: "应用" })).toBeDisabled();
    await userEvent.type(input, "字体");
    await expect(dialog.getByRole("alert")).toHaveTextContent("分类名称已存在");
    await expect(dialog.getByRole("button", { name: "应用" })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "叠字间距");
    await userEvent.click(dialog.getByRole("button", { name: "应用" }));
    await expect(trigger).toHaveTextContent("叠字间距");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await canvas.findByText("本页暂无标注");
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(await canvas.findByRole("button", { name: "标注 3 分类" })).toHaveTextContent(
      "叠字间距",
    );
    await userEvent.click(canvas.getByRole("button", { name: "标注 3 分类" }));
    await expect(body.queryByRole("menuitemradio", { name: "自定义：叠字节奏" })).toBeNull();
    await expect(body.getByRole("menuitem", { name: "删除分类：叠字间距" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{Escape}");
  },
};
