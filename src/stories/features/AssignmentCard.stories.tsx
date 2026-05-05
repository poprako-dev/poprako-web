import type { Meta, StoryObj } from "@storybook/react-vite";
import type { AssignmentInfo } from "@/types/assignment";
import type { ChapterInfo } from "@/types/chapter";

type AssignmentCardProps = {
  assignmentInfo: AssignmentInfo;
  mode: "translator" | "reviewer";
  onClick: () => void;
  onLoadAssignments: (chapterId: string) => Promise<AssignmentInfo[]>;
};

function AssignmentCard({ assignmentInfo, mode, onClick }: AssignmentCardProps) {
  const subtitle = assignmentInfo.chapter?.subtitle ?? "未指定章节";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded border border-border p-3 text-left"
    >
      <div className="text-sm font-medium">{subtitle}</div>
      <div className="text-xs text-muted-foreground">模式: {mode}</div>
    </button>
  );
}

type AssignmentRoleField =
  | "assignedRawProviderAt"
  | "assignedTranslatorAt"
  | "assignedProofreaderAt"
  | "assignedTypesetterAt"
  | "assignedReviewerAt"
  | "assignedPublisherAt";

function makeAssignment(
  seed: string,
  title: string,
  index: number,
  roles: AssignmentRoleField[],
  translated: number,
  proofread: number,
  total: number,
): AssignmentInfo {
  const now = Date.now();
  const roleFields = Object.fromEntries(roles.map((r) => [r, now]));
  return {
    id: seed,
    chapterId: `chapter-${seed}`,
    userId: "user-1",
    ...roleFields,
    chapter: {
      id: `chapter-${seed}`,
      comicId: `comic-${seed}`,
      index,
      subtitle: `第${index}话`,
      isPinned: false,
      pageCount: 24,
      totalUnitCount: total,
      translatedUnitCount: translated,
      proofreadUnitCount: proofread,
      creatorId: "user-1",
      createdAt: now - 86400000 * 30,
      updatedAt: now - 86400000,
      comic: {
        id: `comic-${seed}`,
        worksetId: `workset-${seed}`,
        title,
        author: "作者",
        description: "",
        creatorId: "user-1",
        index: 0,
        chapterCount: 100,
        coverUrl: "",
        isCoverUploaded: false,
        lastActiveAt: now,
        createdAt: now,
        updatedAt: now,
      },
    },
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000,
  };
}

function makeReviewerAssignment(
  seed: string,
  title: string,
  index: number,
  roles: AssignmentRoleField[],
  workflow: Partial<ChapterInfo>,
): AssignmentInfo {
  const now = Date.now();
  const roleFields = Object.fromEntries(roles.map((r) => [r, now]));
  return {
    id: seed,
    chapterId: `chapter-${seed}`,
    userId: "user-1",
    ...roleFields,
    chapter: {
      id: `chapter-${seed}`,
      comicId: `comic-${seed}`,
      index,
      subtitle: `第${index}话`,
      isPinned: false,
      pageCount: 24,
      totalUnitCount: 156,
      translatedUnitCount: 156,
      proofreadUnitCount: 156,
      creatorId: "user-1",
      createdAt: now - 86400000 * 30,
      updatedAt: now - 86400000,
      comic: {
        id: `comic-${seed}`,
        worksetId: `workset-${seed}`,
        title,
        author: "作者",
        description: "",
        creatorId: "user-1",
        index: 0,
        chapterCount: 100,
        coverUrl: "",
        isCoverUploaded: false,
        lastActiveAt: now,
        createdAt: now,
        updatedAt: now,
      },
      ...workflow,
    },
    createdAt: now - 86400000 * 30,
    updatedAt: now - 86400000,
  };
}

const TRANSLATOR_SAMPLES: AssignmentInfo[] = [
  makeAssignment(
    "manga1",
    "电锋人 第二部",
    102,
    ["assignedTranslatorAt", "assignedProofreaderAt"],
    89,
    20,
    156,
  ),
  makeAssignment(
    "manga2",
    "蓝色监狱 (Blue Lock)",
    45,
    [
      "assignedTranslatorAt",
      "assignedProofreaderAt",
      "assignedTypesetterAt",
      "assignedPublisherAt",
    ],
    210,
    180,
    210,
  ),
  makeAssignment("manga3", "咏术回战", 213, ["assignedTranslatorAt"], 0, 0, 88),
  makeAssignment(
    "manga4",
    "One Piece",
    1100,
    ["assignedProofreaderAt"],
    300,
    300,
    300,
  ),
];

const now = Date.now();

const REVIEWER_SAMPLES: AssignmentInfo[] = [
  makeReviewerAssignment("rev1", "电锋人 第二部", 102, ["assignedReviewerAt"], {
    uploadedAt: now,
    translatedAt: now,
    proofreadAt: now,
    typesettingAt: now,
  }),
  makeReviewerAssignment(
    "rev2",
    "蓝色监狱 (Blue Lock)",
    45,
    ["assignedProofreaderAt"],
    {
      uploadedAt: now,
      translatedAt: now,
      proofreadingAt: now,
    },
  ),
  makeReviewerAssignment("rev3", "葬送的芝莉迍", 12, ["assignedPublisherAt"], {
    uploadedAt: now,
    translatedAt: now,
    proofreadAt: now,
    typesetAt: now,
    reviewedAt: now,
    publishedAt: now,
  }),
  makeReviewerAssignment("rev4", "咏术回战", 213, ["assignedReviewerAt"], {}),
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
    onLoadAssignments: async () => [],
  },
  render: (args) => (
    <div className="w-120">
      <AssignmentCard {...args} />
    </div>
  ),
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
          onLoadAssignments={async () => []}
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
            assignedTranslatorAt: Date.now(),
            user: {
              id: "u1",
              name: "张三",
              qq: "",
              avatarUrl: "",
              isAvatarUploaded: false,
              isSuperAdmin: false,
              createdAt: 0,
              updatedAt: 0,
            },
            createdAt: 0,
            updatedAt: 0,
          },
          {
            id: "2",
            chapterId: "102",
            userId: "u2",
            assignedProofreaderAt: Date.now(),
            user: {
              id: "u2",
              name: "李四",
              qq: "",
              avatarUrl: "",
              isAvatarUploaded: false,
              isSuperAdmin: false,
              createdAt: 0,
              updatedAt: 0,
            },
            createdAt: 0,
            updatedAt: 0,
          },
          {
            id: "3",
            chapterId: "102",
            userId: "u3",
            assignedTypesetterAt: Date.now(),
            user: {
              id: "u3",
              name: "极其超级无敌长的名字王五",
              qq: "",
              avatarUrl: "",
              isAvatarUploaded: false,
              isSuperAdmin: false,
              createdAt: 0,
              updatedAt: 0,
            },
            createdAt: 0,
            updatedAt: 0,
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
              chapterId: item.chapter?.id ?? "",
              userId: "u1",
              assignedRawProviderAt: Date.now(),
              assignedTranslatorAt: Date.now(),
              user: {
                id: "u1",
                name: "测试人员A",
                qq: "",
                avatarUrl: "",
                isAvatarUploaded: false,
                isSuperAdmin: false,
                createdAt: 0,
                updatedAt: 0,
              },
              createdAt: 0,
              updatedAt: 0,
            },
            {
              id: "2",
              chapterId: item.chapter?.id ?? "",
              userId: "u2",
              assignedProofreaderAt: Date.now(),
              assignedTypesetterAt: Date.now(),
              user: {
                id: "u2",
                name: "测试人员B",
                qq: "",
                avatarUrl: "",
                isAvatarUploaded: false,
                isSuperAdmin: false,
                createdAt: 0,
                updatedAt: 0,
              },
              createdAt: 0,
              updatedAt: 0,
            },
            {
              id: "3",
              chapterId: item.chapter?.id ?? "",
              userId: "u3",
              assignedReviewerAt: Date.now(),
              assignedPublisherAt: Date.now(),
              user: {
                id: "u3",
                name: "名字超长的测试人员CDEF",
                qq: "",
                avatarUrl: "",
                isAvatarUploaded: false,
                isSuperAdmin: false,
                createdAt: 0,
                updatedAt: 0,
              },
              createdAt: 0,
              updatedAt: 0,
            },
          ]}
        />
      ))}
    </div>
  ),
};
