import { type JSX, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberList } from "@/routes/_authenticated/_shell/member-list/business/MemberList";
import { EmbeddedMemberList } from "@/routes/_authenticated/_shell/member-list/business/EmbeddedMemberList";
import { MemberListFilterHeader } from "@/routes/_authenticated/_shell/member-list/business/MemberListFilterHeader";
import type { RoleFilter } from "@/routes/_authenticated/_shell/member-list/business/member-list-type";
import type { MemberInfo } from "@/routes/business/identity/member";
import type { Result } from "@/shared/utility/result";

const now = Date.now();

// ── Mock Builders ─────────────────────────────────

function makeMockMember(idx: number): MemberInfo {
  const roleFields: (keyof MemberInfo)[] = [
    "assignedRawProviderAt",
    "assignedTranslatorAt",
    "assignedProofreaderAt",
    "assignedTypesetterAt",
    "assignedRedrawerAt",
    "assignedReviewerAt",
    "assignedPublisherAt",
  ];
  const assignedRole = roleFields[idx % roleFields.length];
  return {
    id: `member-${String(idx)}`,
    userId: `user-${String(idx)}`,
    teamId: "team-1",
    user: {
      id: `user-${String(idx)}`,
      qq: `100${String(idx)}0000`,
      name: ["苍井翔太", "草莓大福", "云雀小队", "星河制作", "翡翠工坊"][idx % 5] ?? "",
      avatarUrl:
        "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="gray"/></svg>',
        ),
      isSuperAdmin: idx === 0,
      lastActiveAt: now - 1000 * 60 * 60 * idx,
      createdAt: now - 1000 * 60 * 60 * 24 * 30,
      updatedAt: now - 1000 * 60 * 60 * idx,
    },
    assignedAdminAt: idx === 0 ? now : undefined,
    ...(assignedRole && {
      [assignedRole]: now - 1000 * 60 * 60 * 24 * idx,
    }),
    roles: idx === 0 ? 0b1 : 0,
    createdAt: now - 1000 * 60 * 60 * 24 * 30,
    updatedAt: now - 1000 * 60 * 60 * idx,
  };
}

const MOCK_MEMBERS = Array.from({ length: 24 }, (_, i) => makeMockMember(i));

async function mockLoadMembers(offset: number, limit: number): Promise<Result<MemberInfo[]>> {
  await new Promise((r) => setTimeout(r, 400));
  return { success: true, data: MOCK_MEMBERS.slice(offset, offset + limit) };
}

// ── MemberList Story ──────────────────────────────

const meta: Meta<typeof MemberList> = {
  title: "features/MemberList",
  component: MemberList,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof MemberList>;

function MemberListDemo(): JSX.Element {
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter | null>(null);

  return (
    <div className="h-screen p-6 bg-muted">
      <MemberList
        fuzzyName={fuzzyName}
        onChangeFuzzyName={setFuzzyName}
        activeRole={activeRole}
        onChangeRole={setActiveRole}
        onCreateMember={() => {
          return;
        }}
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
    <div className="h-screen p-6 bg-muted">
      <EmbeddedMemberList onLoadMembers={mockLoadMembers} />
    </div>
  ),
};

// ── FilterHeader Story ────────────────────────────

function FilterHeaderDemo(): JSX.Element {
  const [fuzzyName, setFuzzyName] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter | null>(null);
  return (
    <div className="p-6 bg-muted max-w-xl">
      <MemberListFilterHeader
        activeFuzzyName={fuzzyName}
        onChangeFuzzyName={setFuzzyName}
        activeRole={activeRole}
        onChangeRole={setActiveRole}
        onCreateMember={() => {
          return;
        }}
      />
    </div>
  );
}

export const FilterHeader: StoryObj<typeof MemberListFilterHeader> = {
  render: () => <FilterHeaderDemo />,
};
