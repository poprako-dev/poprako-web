import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ComicDetailModal } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import type { Role } from "@/routes/business/identity/role";
import {
  ALL_CHAPTERS,
  makeAssignments,
  makeMember,
  makePages,
  makeUser,
  mockComic,
  now,
  pinnedChapter,
  required,
} from "./test/comic-detail-story-fixtures.ts";
import {
  delay,
  makeManyAssignments,
  makeWorkflowRecords,
} from "./test/comic-detail-workflow-fixtures.ts";

const removeCombinedTypesetAssignment = fn(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (_chapterId: string, _userId: string, _role: Role) => {
    return { success: true as const, data: undefined };
  },
);

const meta: Meta<typeof ComicDetailModal> = {
  title: "Features/ComicDetailModal",
  component: ComicDetailModal,
  parameters: {
    layout: "fullscreen",
  },
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

export const Default: Story = {
  name: "默认（有置顶章节 + 200章无限滚动）",
  args: {
    onImportChapter: fn(() =>
      Promise.resolve({
        success: true as const,
        data: { importedPageCount: 1, importedUnitCount: 2 },
      }),
    ),
    comicInfo: mockComic,
    pinnedChapter,
    pinnedChapterAssignments: makeAssignments("chapter-42"),
    currentUserId: "u-aki",
    onLoadChapters: async (args) => {
      await delay(200);
      const sliced = ALL_CHAPTERS.slice(args.offset, args.offset + args.limit);
      return { success: true, data: sliced };
    },
    onLoadAssignments: async (chapterId) => {
      await delay(150);
      return { success: true, data: makeAssignments(chapterId) };
    },
    onLoadPages: async (chapterId) => {
      await delay(200);
      // 每个章节 25 页，足够测试页面列表滚动
      return { success: true, data: makePages(chapterId, 25) };
    },
    onLoadWorkflowRecords: async (args) => {
      await delay(120);
      const records = makeWorkflowRecords(args.chapterId);
      return {
        success: true,
        data: records.slice(args.offset, args.offset + args.limit),
      };
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    onResolveWorkflowRecordUser: async (userId) => {
      const names: Record<string, string> = {
        "u-admin": "Mori",
        "u-aki": "Aki",
        "u-former": "已退出成员",
      };
      return {
        success: true,
        data: makeUser(userId, names[userId] ?? userId),
      };
    },
    onTransiteWorkflow: async (_chapterId, _transition) => {
      await delay(300);
      return { success: true, data: undefined };
    },
    onCreateChapter: async (_args) => {
      await delay(200);
      return { success: true, data: `new-chapter-${String(now)}` };
    },
    onDeleteChapter: async (_chapterId) => {
      await delay(200);
      return { success: true, data: undefined };
    },
    onRemoveAssignment: async (_chapterId, _userId) => {
      await delay(200);
      return { success: true, data: undefined };
    },
    activeMember: makeMember("u-aki", "Aki", { assignedTranslatorAt: now }),
    onClose: fn(),
  },
};

export const NoPinnedChapter: Story = {
  name: "无置顶章节",
  args: {
    ...Default.args,
    pinnedChapter: null,
  },
};

export const ManyPeopleWithLongNames: Story = {
  name: "每职位超多人 + 超长名字",
  args: {
    ...Default.args,
    onLoadAssignments: async (chapterId) => {
      await delay(150);
      return { success: true, data: makeManyAssignments(chapterId) };
    },
  },
};

export const EmptyAssignments: Story = {
  name: "所有阶段均未分配",
  args: {
    ...Default.args,
    currentUserId: "u-viewer",
    onLoadAssignments: async () => {
      await delay(150);
      return { success: true, data: [] };
    },
    activeMember: makeMember("u-viewer", "Viewer"),
  },
};

export const SlowAssignments: Story = {
  name: "分工成员加载中",
  args: {
    ...Default.args,
    onLoadAssignments: async (chapterId) => {
      await delay(5000);
      return { success: true, data: makeAssignments(chapterId) };
    },
  },
};

export const AdminAssignmentControls: Story = {
  name: "管理员分配与移除",
  args: {
    ...Default.args,
    currentUserId: "u-admin",
    onLoadAssignments: async (chapterId) => {
      await delay(100);
      return {
        success: true,
        data: [
          ...makeManyAssignments(chapterId),
          {
            id: "a-admin",
            chapterId,
            userId: "u-admin",
            user: makeUser("u-admin", "Mori"),
            assignedAdminAt: now,
            assignedTranslatorAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    },
    activeMember: makeMember("u-admin", "Mori", {
      assignedAdminAt: now,
      assignedTranslatorAt: now,
    }),
    // eslint-disable-next-line @typescript-eslint/require-await
    onLoadAssignableMembers: async () => ({ success: true, data: [] }),
    // eslint-disable-next-line @typescript-eslint/require-await
    onAddAssignment: async (_chapterId, _userId, _role) => {
      return { success: true, data: undefined };
    },
  },
};

export const SelfServiceControls: Story = {
  name: "成员加入与退出",
  args: {
    ...Default.args,
    currentUserId: "u-aki",
    activeMember: makeMember("u-aki", "Aki", {
      assignedTranslatorAt: now,
      assignedProofreaderAt: now,
    }),
    // eslint-disable-next-line @typescript-eslint/require-await
    onJoinChapterRole: async (_chapterId, _role) => {
      return { success: true, data: undefined };
    },
  },
};

export const CombinedTypesetRemoval: Story = {
  name: "嵌字与美工角色同时移除",
  args: {
    ...Default.args,
    currentUserId: "u-admin",
    // eslint-disable-next-line @typescript-eslint/require-await
    onLoadAssignments: async (chapterId) => ({
      success: true,
      data: [
        {
          id: "a-admin",
          chapterId,
          userId: "u-admin",
          user: makeUser("u-admin", "Mori"),
          assignedAdminAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "a-dual",
          chapterId,
          userId: "u-dual",
          user: makeUser("u-dual", "Dual Artist"),
          assignedTypesetterAt: now,
          assignedRedrawerAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }),
    activeMember: makeMember("u-admin", "Mori", { assignedAdminAt: now }),
    onRemoveAssignment: removeCombinedTypesetAssignment,
  },
  play: async ({ canvasElement }) => {
    removeCombinedTypesetAssignment.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "工作流记录",
      }),
    );
    const avatar = await canvas.findByRole("button", {
      name: "移除Dual Artist的当前分工",
    });
    await userEvent.click(avatar);

    const body = within(document.body);
    await expect(body.queryByRole("heading", { name: "嵌字流程" })).not.toBeInTheDocument();
    await userEvent.click(await body.findByRole("button", { name: "移除" }));

    await waitFor(async () => {
      await expect(removeCombinedTypesetAssignment).toHaveBeenNthCalledWith(
        1,
        "chapter-42",
        "u-dual",
        "typesetter",
      );
      await expect(removeCombinedTypesetAssignment).toHaveBeenNthCalledWith(
        2,
        "chapter-42",
        "u-dual",
        "redrawer",
      );
    });
  },
};

export const EmptyPages: Story = {
  name: "无页面数据",
  args: {
    ...Default.args,
    onLoadPages: async () => {
      await delay(100);
      return { success: true, data: [] };
    },
  },
};

export const SlowNetwork: Story = {
  name: "慢速网络（章节分页延迟 1s）",
  args: {
    ...Default.args,
    onLoadChapters: async (args) => {
      await delay(1000);
      const sliced = ALL_CHAPTERS.slice(args.offset, args.offset + args.limit);
      return { success: true, data: sliced };
    },
    onLoadPages: async (chapterId) => {
      await delay(800);
      return { success: true, data: makePages(chapterId, 25) };
    },
  },
};

export const AllCompleted: Story = {
  name: "全部工作流完成",
  args: {
    ...Default.args,
    onLoadChapters: async (args) => {
      await delay(200);
      const completedChapters = ALL_CHAPTERS.map((ch) => ({
        ...ch,
        uploadedAt: now,
        translatedAt: now,
        proofreadAt: now,
        typesetAt: now,
        reviewedAt: now,
        publishedAt: now,
      })).slice(args.offset, args.offset + args.limit);
      return { success: true, data: completedChapters };
    },
  },
};

export const LoadError: Story = {
  name: "加载失败",
  args: {
    ...Default.args,
    onLoadChapters: async () => {
      await delay(300);
      return { success: false, error: "网络连接失败" };
    },
  },
};

export const ArtworkActions: Story = {
  name: "嵌稿上传（多分工管理员 · 最多操作）",
  args: {
    ...Default.args,
    currentUserId: "u-admin",
    activeMember: makeMember("u-admin", "Mori", { assignedAdminAt: now }),
    onLoadAssignments: (chapterId) =>
      Promise.resolve({
        success: true,
        data: [
          {
            ...required(makeAssignments(chapterId)[0]),
            assignedRawProviderAt: now,
            assignedTranslatorAt: now,
            assignedTypesetterAt: now,
          },
        ],
      }),
    onDeleteChapterPages: fn(() => Promise.resolve({ success: true as const, data: undefined })),
    onArchiveComic: fn(() => Promise.resolve({ success: true as const, data: undefined })),
    onDeleteComic: fn(() => Promise.resolve({ success: true as const, data: undefined })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const upload = await canvas.findByRole("button", { name: "上传嵌稿" });
    await expect(canvas.queryByRole("button", { name: "只读查看" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "导入翻校" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "清空页面" })).not.toBeInTheDocument();
    await userEvent.click(upload);
    const body = within(document.body);
    const artworkDialog = await body.findByRole("dialog", { name: "上传嵌稿" });
    await waitFor(() => expect(artworkDialog).toBeVisible());
    await expect(body.getByRole("button", { name: "上传" })).toBeDisabled();
    await expect(body.queryByText(/压缩/)).not.toBeInTheDocument();
    await expect(body.queryByText(/请一次选齐/)).not.toBeInTheDocument();
  },
};
