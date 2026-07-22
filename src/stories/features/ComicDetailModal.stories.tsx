import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import ComicDetailModal from "@/features/ComicPlayground/features/ComicDetailModal";
import type { ComicInfo } from "@/types/comic";
import type { ChapterInfo } from "@/types/chapter";
import type { PageInfo } from "@/types/page";
import type { AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import type { Role } from "@/types/role";
import type { UserInfo } from "@/types/user";

const now = Date.now();

// Mock builders

function makeUser(id: string, name: string): UserInfo {
  return {
    id,
    name,
    qq: "",
    avatarUrl: "",
    isSuperAdmin: false,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function makeMember(
  userId: string,
  name: string,
  roles: Partial<MemberInfo> = {},
): MemberInfo {
  return {
    id: `member-${userId}`,
    userId,
    user: makeUser(userId, name),
    teamId: "team-1",
    roles: 0,
    createdAt: now,
    updatedAt: now,
    ...roles,
  };
}

const mockComic: ComicInfo = {
  id: "comic-1",
  worksetId: "ws-1",
  title: "咒术回战",
  author: "芥见下下",
  description: "全球风靡的奇幻热血漫画",
  index: 0,
  chapterCount: 200,
  creatorId: "user-0",
  coverUrl: "",
  isCoverUploaded: false,
  lastActiveAt: now - 1000 * 60 * 60 * 2,
  createdAt: now,
  updatedAt: now,
};

const SUBTITLE_POOL = [
  "宿命对决",
  "深渊回响",
  "逆命之刃",
  "血色晨曦",
  "虚空裂变",
  "幽冥之门",
  "末日序曲",
  "命运交汇",
];

function makeChapter(
  idx: number,
  extraFlags?: Partial<ChapterInfo>,
): ChapterInfo {
  const hasSubtitle = idx % 3 === 0;
  return {
    id: `chapter-${idx}`,
    comicId: "comic-1",
    index: idx,
    subtitle: hasSubtitle ? SUBTITLE_POOL[idx % SUBTITLE_POOL.length] : "",
    isPinned: false,
    pageCount: 18 + (idx % 8),
    totalUnitCount: 140 + idx * 8,
    translatedUnitCount: Math.floor((140 + idx * 8) * (0.3 + (idx % 5) * 0.1)),
    proofreadUnitCount: Math.floor((140 + idx * 8) * (idx % 4) * 0.05),
    uploadedAt: now - 1000 * 60 * 60 * 24,
    translatingAt: now - 1000 * 60 * 60,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
    ...extraFlags,
  };
}

// 200 chapters for infinite-scroll testing
const ALL_CHAPTERS: ChapterInfo[] = Array.from({ length: 200 }, (_, i) =>
  makeChapter(i + 1),
);

const pinnedChapter = makeChapter(42, {
  isPinned: true,
  subtitle: "深渊回响",
});

function makePages(chapterId: string, count: number): PageInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${chapterId}-${i + 1}`,
    chapterId,
    index: i + 1,
    imageUrl: "",
    isUploaded: i < count - 3,
    totalUnitCount: 10 + (i % 4),
    translatedUnitCount: i % 3 === 0 ? 10 + (i % 4) : i % 2,
    proofreadUnitCount: i % 5 === 0 ? 10 + (i % 4) : 0,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
  }));
}

function makeAssignments(chapterId: string): AssignmentInfo[] {
  return [
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
      id: "a1",
      chapterId,
      userId: "u-kira",
      user: makeUser("u-kira", "Kira"),
      assignedRawProviderAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a2",
      chapterId,
      userId: "u-mio",
      user: makeUser("u-mio", "Mio"),
      assignedRawProviderAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a3",
      chapterId,
      userId: "u-aki",
      user: makeUser("u-aki", "Aki"),
      assignedTranslatorAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a4",
      chapterId,
      userId: "u-sora",
      user: makeUser("u-sora", "Sora"),
      assignedTranslatorAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a5",
      chapterId,
      userId: "u-lin",
      user: makeUser("u-lin", "Lin"),
      assignedProofreaderAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a6",
      chapterId,
      userId: "u-baka",
      user: makeUser("u-baka", "Baka"),
      assignedTypesetterAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a7",
      chapterId,
      userId: "u-yuki",
      user: makeUser("u-yuki", "Yuki"),
      assignedTypesetterAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a8",
      chapterId,
      userId: "u-kira2",
      user: makeUser("u-kira2", "Kira"),
      assignedReviewerAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a9",
      chapterId,
      userId: "u-sys",
      user: makeUser("u-sys", "System"),
      assignedPublisherAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// 超大量、超长名测试数据

const LONG_NAMES = [
  "芥見下下のファン一号",
  "夏油傑崇拜者999",
  "Александр Иванович Петров",
  "Wolfgang Amadeus Translator",
  "五条悟専属スタッフ二号三号四号",
  "MidnightBlossom_TL",
  "翻译组全能选手神里绫华的粉丝",
  "Bartholomew Thaddeus McAllister IV",
  "きみがいなければ翻译できない君",
  "超级无敌大好人不知道怎么命名",
];

function makeManyAssignments(chapterId: string): AssignmentInfo[] {
  const assignments: AssignmentInfo[] = [];
  let idCounter = 1;

  const push = (
    name: string,
    role: keyof Omit<
      AssignmentInfo,
      "id" | "chapterId" | "userId" | "user" | "createdAt" | "updatedAt"
    >,
  ) => {
    const uid = `u-many-${idCounter}`;
    assignments.push({
      id: `am-${idCounter}`,
      chapterId,
      userId: uid,
      user: makeUser(uid, name),
      [role]: now,
      createdAt: now,
      updatedAt: now,
    });
    idCounter++;
  };

  // 4x 原始提供者
  ["佐仓绫音大粉丝", "RawHunterZero", "Nakamura Yū Fan", LONG_NAMES[0]].forEach(
    (n) => push(n, "assignedRawProviderAt"),
  );

  // 6x 翻译
  [
    "Aki Translator",
    LONG_NAMES[2],
    LONG_NAMES[6],
    "Mitsuki",
    LONG_NAMES[9],
    "神崎蘭子之友",
  ].forEach((n) => push(n, "assignedTranslatorAt"));

  // 5x 校对
  [
    LONG_NAMES[1],
    LONG_NAMES[7],
    "校对博士学位",
    "Proofreader_X",
    "星野",
  ].forEach((n) => push(n, "assignedProofreaderAt"));

  // 5x 排版
  [
    LONG_NAMES[3],
    LONG_NAMES[4],
    "LayoutMaster2077",
    "排版狂魔不知疲倦的人",
    LONG_NAMES[8],
  ].forEach((n) => push(n, "assignedTypesetterAt"));

  // 3x 监修
  [LONG_NAMES[5], "ReviewerElite", "最终boss级监修官"].forEach((n) =>
    push(n, "assignedReviewerAt"),
  );

  // 3x 发布
  ["Publisher_A", LONG_NAMES[9], "全能发布王者"].forEach((n) =>
    push(n, "assignedPublisherAt"),
  );

  return assignments;
}

// Simulate async page delay
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const removeCombinedTypesetAssignment = fn(
  async (_chapterId: string, _userId: string, _role: Role) => ({
    success: true as const,
    data: undefined,
  }),
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
    onTransiteWorkflow: async (_chapterId, transition) => {
      await delay(300);
      console.log("workflow transition:", transition);
      return { success: true, data: undefined };
    },
    onCreateChapter: async (args) => {
      await delay(200);
      console.log("create chapter:", args);
      return { success: true, data: `new-chapter-${now}` };
    },
    onDeleteChapter: async (chapterId) => {
      await delay(200);
      console.log("delete chapter:", chapterId);
      return { success: true, data: undefined };
    },
    onRemoveAssignment: async (_chapterId, userId) => {
      await delay(200);
      console.log("remove assignment:", userId);
      return { success: true, data: undefined };
    },
    onResolveActiveMember: () =>
      makeMember("u-aki", "Aki", { assignedTranslatorAt: now }),
    onClose: () => console.log("closed"),
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
    onResolveActiveMember: () => makeMember("u-viewer", "Viewer"),
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
        data: makeManyAssignments(chapterId).concat({
          id: "a-admin",
          chapterId,
          userId: "u-admin",
          user: makeUser("u-admin", "Mori"),
          assignedAdminAt: now,
          assignedTranslatorAt: now,
          createdAt: now,
          updatedAt: now,
        }),
      };
    },
    onResolveActiveMember: () =>
      makeMember("u-admin", "Mori", {
        assignedAdminAt: now,
        assignedTranslatorAt: now,
      }),
    onLoadAssignableMembers: async () => ({ success: true, data: [] }),
    onAddAssignment: async (_chapterId, userId, role) => {
      console.log("add assignment:", userId, role);
      return { success: true, data: undefined };
    },
  },
};

export const SelfServiceControls: Story = {
  name: "成员加入与退出",
  args: {
    ...Default.args,
    currentUserId: "u-aki",
    onResolveActiveMember: () =>
      makeMember("u-aki", "Aki", {
        assignedTranslatorAt: now,
        assignedProofreaderAt: now,
      }),
    onJoinChapterRole: async (_chapterId, role) => {
      console.log("join assignment:", role);
      return { success: true, data: undefined };
    },
  },
};

export const CombinedTypesetRemoval: Story = {
  name: "嵌字与美工角色同时移除",
  args: {
    ...Default.args,
    currentUserId: "u-admin",
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
    onResolveActiveMember: () =>
      makeMember("u-admin", "Mori", { assignedAdminAt: now }),
    onRemoveAssignment: removeCombinedTypesetAssignment,
  },
  play: async ({ canvasElement }) => {
    removeCombinedTypesetAssignment.mockClear();
    const canvas = within(canvasElement);
    const avatar = await canvas.findByRole("button", {
      name: "移除Dual Artist的当前分工",
    });
    await userEvent.click(avatar);

    const body = within(document.body);
    expect(body.queryByRole("heading", { name: "嵌字流程" })).not.toBeInTheDocument();
    await userEvent.click(await body.findByRole("button", { name: "移除" }));

    await waitFor(() => {
      expect(removeCombinedTypesetAssignment).toHaveBeenNthCalledWith(
        1,
        "chapter-42",
        "u-dual",
        "typesetter",
      );
      expect(removeCombinedTypesetAssignment).toHaveBeenNthCalledWith(
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
