import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorksetCreatorModal } from "@/route/_authenticated/_shell/comic-playground/business/WorksetCreatorModal";
import type { CreateWorksetArgs } from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-input";

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
    onCreateWorkset: async (_args: CreateWorksetArgs) => {
      await new Promise((r) => setTimeout(r, 800));
      return { success: true, data: "new-workset-id" };
    },
    onClose: () => {
      return;
    },
  },
};

export const SubmitError: Story = {
  name: "提交失败",
  args: {
    teamId: "team-1",
    onCreateWorkset: async (_args: CreateWorksetArgs) => {
      await new Promise((r) => setTimeout(r, 800));
      return { success: false, error: "网络错误，请稍后重试" };
    },
    onClose: () => {
      return;
    },
  },
};
