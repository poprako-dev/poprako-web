import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  MemberList,
  EmbeddedMemberList,
  MemberListFilterHeader,
  type RoleFilter,
} from "@/features/MemberList";
import type { MemberInfo } from "@/types/member";

const now = Date.now();

// ── Mock Builders ─────────────────────────────────

function makeMockMember(idx: number): MemberInfo {
  const roleFields: (keyof MemberInfo)[] = [
    "assignedRawProviderAt",
    "assignedTranslatorAt",
    "assignedProofreaderAt",
    "assignedTypesetterAt",
    "assignedReviewerAt",
    "assignedPublisherAt",
  ];
  const assignedRole = roleFields[idx % roleFields.length];
  return {
    id: `member-${idx}`,
    userId: `user-${idx}`,
    teamId: "team-1",
    user: {
      id: `user-${idx}`,
      qq: `100${idx}0000`,
      name: ["苍井翔太", "草莓大福", "云雀小队", "星河制作", "翡翠工坊"][
        idx % 5
      ],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=member${idx}`,
      isAvatarUploaded: true,
      isSuperAdmin: idx === 0,
      lastActiveAt: now - 1000 * 60 * 60 * idx,
      createdAt: now - 1000 * 60 * 60 * 24 * 30,
      updatedAt: now - 1000 * 60 * 60 * idx,
    },
    assignedAdminAt: idx === 0 ? now : undefined,
    [assignedRole]: now - 1000 * 60 * 60 * 24 * idx,
    roles: idx === 0 ? 0b1 : 0,
    createdAt: now - 1000 * 60 * 60 * 24 * 30,
    updatedAt: now - 1000 * 60 * 60 * idx,
  };
}

const MOCK_MEMBERS = Array.from({ length: 24 }, (_, i) => makeMockMember(i));

async function mockLoadMembers(
  offset: number,
  limit: number,
): Promise<MemberInfo[] | string> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_MEMBERS.slice(offset, offset + limit);
}

// ── MemberList Story ──────────────────────────────

const meta: Meta<typeof MemberList> = {
  title: "features/MemberList",
  component: MemberList,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof MemberList>;

function MemberListDemo() {
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRoles, setActiveRoles] = useState<RoleFilter[]>([]);

  return (
    <div className="h-screen p-6 bg-slate-50">
      <MemberList
        fuzzyName={fuzzyName}
        onChangeFuzzyName={setFuzzyName}
        activeRoles={activeRoles}
        onChangeRoles={setActiveRoles}
        onCreateMember={() => alert("创建成员")}
        onLoadMembers={mockLoadMembers}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <MemberListDemo />,
};

// ── EmbeddedMemberList Story ──────────────────────

export const Embedded: StoryObj<typeof EmbeddedMemberList> = {
  render: () => (
    <div className="h-screen p-6 bg-slate-50">
      <EmbeddedMemberList onLoadMembers={mockLoadMembers} />
    </div>
  ),
};

// ── FilterHeader Story ────────────────────────────

export const FilterHeader: StoryObj<typeof MemberListFilterHeader> = {
  render: () => {
    const [fuzzyName, setFuzzyName] = useState("");
    const [activeRoles, setActiveRoles] = useState<RoleFilter[]>([]);
    return (
      <div className="p-6 bg-slate-50 max-w-xl">
        <MemberListFilterHeader
          activeFuzzyName={fuzzyName}
          onChangeFuzzyName={setFuzzyName}
          activeRoles={activeRoles}
          onChangeRoles={setActiveRoles}
          onCreateMember={() => alert("创建成员")}
        />
      </div>
    );
  },
};
