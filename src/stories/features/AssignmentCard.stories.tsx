import type { Meta, StoryObj } from "@storybook/react-vite";
import AssignmentCard from "@/features/AssignmentCard/components/business/AssignmentCard";
import type {
  AssignmentWithChapterInfo,
  ReviewerAssignmentWithChapterInfo,
} from "@/types/assignment";

function makeAssignment(
  seed: string,
  title: string,
  chapterNo: string,
  roles: number,
  translated: number,
  proofread: number,
  total: number,
): AssignmentWithChapterInfo {
  return {
    id: seed,
    userId: "user-1",
    roles,
    chapter: {
      id: `chapter-${seed}`,
      chapterNo,
      index: 0,
      coverUrl: `https://picsum.photos/seed/${seed}/150/200`,
      pageCount: 24,
      totalUnitCount: total,
      translatedUnitCount: translated,
      proofreadUnitCount: proofread,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000,
      comic: {
        id: `comic-${seed}`,
        title,
        author: "作者",
        description: "",
        creatorId: "user-1",
        index: 0,
        chapterCount: 100,
        coverUrl: `https://picsum.photos/seed/${seed}/150/200`,
        lastActiveAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  };
}

function makeReviewerAssignment(
  seed: string,
  title: string,
  chapterNo: string,
  roles: number,
  workflow: Partial<ReviewerAssignmentWithChapterInfo["chapter"]>,
): ReviewerAssignmentWithChapterInfo {
  return {
    id: seed,
    userId: "user-1",
    roles,
    chapter: {
      id: `chapter-${seed}`,
      chapterNo,
      index: 0,
      coverUrl: `https://picsum.photos/seed/${seed}/150/200`,
      pageCount: 24,
      totalUnitCount: 156,
      translatedUnitCount: 156,
      proofreadUnitCount: 156,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000,
      comic: {
        id: `comic-${seed}`,
        title,
        author: "作者",
        description: "",
        creatorId: "user-1",
        index: 0,
        chapterCount: 100,
        coverUrl: `https://picsum.photos/seed/${seed}/150/200`,
        lastActiveAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      ...workflow,
    },
  };
}

const TRANSLATOR_SAMPLES: AssignmentWithChapterInfo[] = [
  makeAssignment("manga1", "电锯人 第二部", "102", 6, 89, 20, 156),
  makeAssignment("manga2", "蓝色监狱 (Blue Lock)", "45", 46, 210, 180, 210),
  makeAssignment("manga3", "咒术回战", "213", 2, 0, 0, 88),
  makeAssignment("manga4", "One Piece", "1100", 4, 300, 300, 300),
];

const now = Date.now();

const REVIEWER_SAMPLES: ReviewerAssignmentWithChapterInfo[] = [
  makeReviewerAssignment("rev1", "电锯人 第二部", "102", 16, {
    uploadedAt: now,
    translatedAt: now,
    proofreadAt: now,
    typesettingAt: now,
  }),
  makeReviewerAssignment("rev2", "蓝色监狱 (Blue Lock)", "45", 4, {
    uploadedAt: now,
    translatedAt: now,
    proofreadingAt: now,
  }),
  makeReviewerAssignment("rev3", "葬送的芙莉莲", "12", 32, {
    uploadedAt: now,
    translatedAt: now,
    proofreadAt: now,
    typesetAt: now,
    reviewedAt: now,
    publishedAt: now,
  }),
  makeReviewerAssignment("rev4", "咒术回战", "213", 16, {}),
];

const meta: Meta<typeof AssignmentCard> = {
  title: "Features/AssignmentCard",
  component: AssignmentCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AssignmentCard>;

export const TranslatorSingle: Story = {
  args: {
    assignmentInfo: TRANSLATOR_SAMPLES[0],
    mode: "translator",
    onClick: () => console.log("card clicked"),
  },
  decorators: [
    (StoryComponent) => (
      <div className="w-120">
        <StoryComponent />
      </div>
    ),
  ],
};

export const TranslatorGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-240">
      {TRANSLATOR_SAMPLES.map((item) => (
        <AssignmentCard
          key={item.id}
          assignmentInfo={item}
          mode="translator"
          onClick={() => console.log(`clicked ${item.id}`)}
        />
      ))}
    </div>
  ),
};

export const ReviewerSingle: Story = {
  render: () => (
    <div className="w-120">
      <AssignmentCard
        assignmentInfo={REVIEWER_SAMPLES[0]}
        mode="reviewer"
        onClick={() => console.log("card clicked")}
        onLoadAssignments={async () => [
          {
            id: "1",
            chapterId: "102",
            userId: "u1",
            roles: 2,
            userName: "张三",
          },
          {
            id: "2",
            chapterId: "102",
            userId: "u2",
            roles: 4,
            userName: "李四",
          },
          {
            id: "3",
            chapterId: "102",
            userId: "u3",
            roles: 8,
            userName: "极其超级无敌长的名字王五",
          },
        ]}
      />
    </div>
  ),
};

export const ReviewerGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-240">
      {REVIEWER_SAMPLES.map((item) => (
        <AssignmentCard
          key={item.id}
          assignmentInfo={item}
          mode="reviewer"
          onClick={() => console.log(`clicked ${item.id}`)}
          onLoadAssignments={async () => [
            {
              id: "1",
              chapterId: item.chapter.id,
              userId: "u1",
              roles: 3,
              userName: "测试人员A",
            },
            {
              id: "2",
              chapterId: item.chapter.id,
              userId: "u2",
              roles: 12,
              userName: "测试人员B",
            },
            {
              id: "3",
              chapterId: item.chapter.id,
              userId: "u3",
              roles: 48,
              userName: "名字超长的测试人员CDEF",
            },
          ]}
        />
      ))}
    </div>
  ),
};
