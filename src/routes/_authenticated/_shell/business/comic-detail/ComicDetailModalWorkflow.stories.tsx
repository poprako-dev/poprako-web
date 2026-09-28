import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ComicDetailModal } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import { Default } from "./ComicDetailModal.stories.tsx";

const meta: Meta<typeof ComicDetailModal> = {
  title: "Features/ComicDetailModal/Workflow",
  component: ComicDetailModal,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComicDetailModal>;

export const WorkflowTimeline: Story = {
  name: "工作流时间线",
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "工作流记录",
      }),
    );
    const eventText = await canvas.findByText(/翻校数据导入推进/);
    const record = eventText.closest("li");

    await waitFor(async () => {
      await expect(record).toHaveTextContent("翻译阶段已完成： Aki 翻校数据导入推进");
    });
    await expect(record?.querySelectorAll("p")).toHaveLength(1);
    await expect(canvas.getByText(/嵌稿上传推进/)).toBeInTheDocument();
    await expect(canvas.getByText(/嵌稿导出/)).toBeInTheDocument();
    await expect(canvas.queryByText("总管")).not.toBeInTheDocument();
  },
};

export const EmptyWorkflowRecords: Story = {
  name: "工作流记录为空",
  args: {
    ...Default.args,
    // eslint-disable-next-line @typescript-eslint/require-await
    onLoadWorkflowRecords: async () => ({ success: true, data: [] }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "工作流记录",
      }),
    );
    await expect(await canvas.findByText("暂无活动记录")).toBeInTheDocument();
  },
};

export const WorkflowRecordsLoadError: Story = {
  name: "工作流记录加载失败",
  args: {
    ...Default.args,
    // eslint-disable-next-line @typescript-eslint/require-await
    onLoadWorkflowRecords: async () => ({
      success: false,
      error: "网络连接失败",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "工作流记录",
      }),
    );
    await expect(await canvas.findByText("活动记录加载失败")).toBeInTheDocument();
  },
};

export const MobileWorkflow: Story = {
  name: "移动端完整分工与时间线",
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  play: async (context) => {
    if (WorkflowTimeline.play) {
      await WorkflowTimeline.play(context);
    }
  },
};
