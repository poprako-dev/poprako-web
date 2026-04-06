import type { Meta, StoryObj } from "@storybook/react-vite";
import ComicCreatorModal from "@/features/ComicPlayground/components/business/ComicCreatorModal";
import type { WorksetInfo } from "@/types/workset";

const now = Date.now();

const mockWorkset: WorksetInfo = {
  id: "workset-1",
  teamId: "team-1",
  index: 0,
  name: "日漫翻译组",
  description: "负责日文漫画的汉化工作",
  comicCount: 12,
  createdAt: now,
  updatedAt: now,
};

const meta: Meta<typeof ComicCreatorModal> = {
  title: "Features/ComicCreatorModal",
  component: ComicCreatorModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ComicCreatorModal>;

export const Default: Story = {
  args: {
    currWorkset: mockWorkset,
    onCreateComic: async (args) => {
      await new Promise((r) => setTimeout(r, 800));
      console.log("创建作品:", args);
      return { success: true, data: "new-comic-id" };
    },
    onClose: () => console.log("关闭弹窗"),
  },
};

export const SubmitError: Story = {
  name: "提交失败",
  args: {
    currWorkset: mockWorkset,
    onCreateComic: async (args) => {
      await new Promise((r) => setTimeout(r, 800));
      console.log("创建作品（模拟失败）:", args);
      return { success: false, error: "作品标题已存在" };
    },
    onClose: () => console.log("关闭弹窗"),
  },
};

export const LongWorksetName: Story = {
  name: "作品集名称较长",
  args: {
    currWorkset: { ...mockWorkset, name: "超级无敌长的作品集名称组织队伍名" },
    onCreateComic: async (args) => {
      await new Promise((r) => setTimeout(r, 800));
      console.log("创建作品:", args);
      return { success: true, data: "new-comic-id" };
    },
    onClose: () => console.log("关闭弹窗"),
  },
};
