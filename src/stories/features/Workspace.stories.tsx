import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import Workspace from "../../features/Workspace/components/business/Workspace";
import type { AssignmentInfo } from "@/types/assignment";
import type { ChapterInfo } from "@/types/chapter";
import type { ComicInfo } from "@/types/comic";
import type { UserStatsInfo } from "@/types/userStats";

const meta: Meta<typeof Workspace> = {
  title: "features/Workspace",
  component: Workspace,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Workspace>;

const now = Date.now();
const reviewerNames = ["小七", "阿青", "Luna", "阿霖", "Mio", "夏川"];
const roleFields = [
  "assignedRawProviderAt",
  "assignedTranslatorAt",
  "assignedProofreaderAt",
  "assignedTypesetterAt",
  "assignedReviewerAt",
  "assignedPublisherAt",
] as const;

function seeded(seed: number) {
  const value = Math.sin(seed * 999.91) * 10000;
  return value - Math.floor(value);
}

function pickInt(seed: number, min: number, max: number) {
  return Math.floor(seeded(seed) * (max - min + 1)) + min;
}

const fullHeightDecorator: Decorator = (Story) => (
  <div style={{ height: "100vh" }}>
    <Story />
  </div>
);

function makeMockComic(idx: number): ComicInfo {
  return {
    id: `comic-${idx}`,
    worksetId: `workset-0`,
    title: `测试漫画 ${idx + 1}`,
    author: `作者 ${idx + 1}`,
    description: "这是一部测试用的漫画",
    index: idx,
    chapterCount: 10,
    creatorId: "user-0",
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function makeMockChapter(idx: number): ChapterInfo {
  const total = pickInt(idx + 1, 80, 380);
  const translated = pickInt(idx + 2, 0, total);
  const proofread = pickInt(idx + 3, 0, translated);

  return {
    id: `chapter-${idx}`,
    comicId: `comic-${idx % 3}`,
    comic: makeMockComic(idx % 3),
    index: idx + 1,
    subtitle: `第${idx + 1}话`,
    pageCount: pickInt(idx + 4, 14, 46),
    totalUnitCount: total,
    translatedUnitCount: translated,
    proofreadUnitCount: proofread,
    uploadedAt: now - 1000 * 60 * 60 * 24 * 3,
    translatingAt: now - 1000 * 60 * 60 * 12,
    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
  };
}

function makeMockAssignment(idx: number): AssignmentInfo {
  const assignment: AssignmentInfo = {
    id: `assignment-${idx}`,
    chapterId: `chapter-${idx}`,
    chapter: makeMockChapter(idx),
    userId: "mock-user-1",
    createdAt: now,
    updatedAt: now,
  };

  roleFields.forEach((field, fieldIdx) => {
    if (seeded(idx * 17 + fieldIdx * 23) > 0.52) {
      assignment[field] = now - pickInt(idx + fieldIdx, 3000, 900000);
    }
  });

  return assignment;
}

function makeMockStats(): UserStatsInfo {
  return {
    userId: "mock-user-1",
    totalAssignmentCount: pickInt(Date.now(), 60, 360),
    activeAssignmentCount: pickInt(Date.now() + 1, 8, 50),
    finishedAssignmentCount: pickInt(Date.now() + 2, 30, 280),
  };
}

function makeMockChapterAssignments(chapterId: string): AssignmentInfo[] {
  const results: AssignmentInfo[] = [];

  roleFields.forEach((field, idx) => {
    if (seeded(idx + chapterId.length) < 0.38) {
      return;
    }

    const uid = `${chapterId}-${field}-${idx}`;
    const assignment: AssignmentInfo = {
      id: `ca-${uid}`,
      chapterId,
      userId: uid,
      user: {
        id: uid,
        qq: `${100000 + idx}`,
        name: reviewerNames[idx % reviewerNames.length],
        avatarUrl: "",
        isAvatarUploaded: false,
        isSuperAdmin: false,
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };

    assignment[field] = now;
    results.push(assignment);
  });

  return results;
}

export const Default: Story = {
  args: {
    onLoadMyStats: async () => {
      await new Promise((resolve) => setTimeout(resolve, 280));
      return makeMockStats();
    },
    onMyLoadAssignments: async (offset: number, limit: number) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return Array.from({ length: limit }, (_, i) =>
        makeMockAssignment(offset + i),
      );
    },
    onLoadAssignments: async (chapterId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return makeMockChapterAssignments(chapterId);
    },
  },
  decorators: [fullHeightDecorator],
};

export const StatsLoading: Story = {
  args: {
    onLoadMyStats: async () => {
      // Never resolves — stays in loading state
      return new Promise<UserStatsInfo>(() => {});
    },
    onMyLoadAssignments: async (offset: number, limit: number) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return Array.from({ length: limit }, (_, i) =>
        makeMockAssignment(offset + i),
      );
    },
    onLoadAssignments: async (chapterId: string) =>
      makeMockChapterAssignments(chapterId),
  },
  decorators: [fullHeightDecorator],
};

export const StatsError: Story = {
  args: {
    onLoadMyStats: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return "加载统计信息失败，请检查网络";
    },
    onMyLoadAssignments: async (offset: number, limit: number) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return Array.from({ length: limit }, (_, i) =>
        makeMockAssignment(offset + i),
      );
    },
    onLoadAssignments: async (chapterId: string) =>
      makeMockChapterAssignments(chapterId),
  },
  decorators: [fullHeightDecorator],
};

export const EmptyAssignments: Story = {
  args: {
    onLoadMyStats: async () => ({
      userId: "mock-user-1",
      totalAssignmentCount: 0,
      activeAssignmentCount: 0,
      finishedAssignmentCount: 0,
    }),
    onMyLoadAssignments: async (_offset: number, _limit: number) => [],
    onLoadAssignments: async (_chapterId: string) => [],
  },
  decorators: [fullHeightDecorator],
};
