import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComicCreatorModal } from "@/route/_authenticated/_shell/comic-playground/business/ComicCreatorModal";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { MemberInfo } from "@/route/business/identity/member";

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

const activeMember: MemberInfo = {
  id: "member-1",
  userId: "user-1",
  teamId: "team-1",
  roles: 255,

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
    activeMember,
    onCreateComic: async (_args) => {
      await new Promise((r) => setTimeout(r, 800));
      return { success: true, data: "new-comic-id" };
    },
    onClose: () => {
      return;
    },
  },
};

export const SubmitError: Story = {
  name: "提交失败",
  args: {
    currWorkset: mockWorkset,
    activeMember,
    onCreateComic: async (_args) => {
      await new Promise((r) => setTimeout(r, 800));
      return { success: false, error: "作品标题已存在" };
    },
    onClose: () => {
      return;
    },
  },
};

export const LongWorksetName: Story = {
  name: "作品集名称较长",
  args: {
    currWorkset: { ...mockWorkset, name: "超级无敌长的作品集名称组织队伍名" },
    activeMember,
    onCreateComic: async (_args) => {
      await new Promise((r) => setTimeout(r, 800));
      return { success: true, data: "new-comic-id" };
    },
    onClose: () => {
      return;
    },
  },
};
