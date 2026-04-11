import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorksetCreatorModal } from "../../features/ComicPlayground";

const meta: Meta<typeof WorksetCreatorModal> = {
  title: "Features/WorksetCreatorModal",
  component: WorksetCreatorModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WorksetCreatorModal>;

export const Default: Story = {
  args: {
    teamId: "team-1",
    onCreateWorkset: async (args) => {
      await new Promise((r) => setTimeout(r, 800));
      console.log("创建作品集:", args);
      return { success: true, data: "new-workset-id" };
    },
    onClose: () => console.log("关闭弹窗"),
  },
};

export const SubmitError: Story = {
  name: "提交失败",
  args: {
    teamId: "team-1",
    onCreateWorkset: async (args) => {
      await new Promise((r) => setTimeout(r, 800));
      console.log("创建作品集（模拟失败）:", args);
      return { success: false, error: "网络错误，请稍后重试" };
    },
    onClose: () => console.log("关闭弹窗"),
  },
};
