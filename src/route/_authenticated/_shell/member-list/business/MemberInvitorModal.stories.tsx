import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberInvitorModal } from "@/route/_authenticated/_shell/member-list/business/MemberInvitorModal";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";

async function loadInvitations(
  invitations: InvitationInfo[],
  offset: number,
  limit: number,
): Promise<Result<InvitationInfo[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true, data: invitations.slice(offset, offset + limit) };
}

async function createInvitation(
  args: CreateInvitationArgs,
  setInvitations: Dispatch<SetStateAction<InvitationInfo[]>>,
): Promise<Result<string>> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const code = fakeCode();
  const invitation: InvitationInfo = {
    id: `inv-${String(Date.now())}`,
    inviteeQq: args.inviteeQq,
    invitorId: "user-me",
    invitationCode: code,
    roles: args.roles,
    isPending: true,
  };
  setInvitations((previous) => [invitation, ...previous]);
  return { success: true, data: code };
}

async function deleteInvitation(
  invitationId: string,
  setInvitations: Dispatch<SetStateAction<InvitationInfo[]>>,
): Promise<Result<void>> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  setInvitations((previous) => previous.filter((invitation) => invitation.id !== invitationId));
  return { success: true, data: undefined };
}

// ── Shared mock data ──────────────────────────────────────────────────────────

const MOCK_INVITATIONS: InvitationInfo[] = [
  {
    id: "inv-1",
    inviteeQq: "2458262309",
    invitorId: "user-0",
    invitationCode: "POP-A1B2C3",
    roles: 2 | 16, // 翻译 + 美工
    isPending: true,
  },
  {
    id: "inv-2",
    inviteeQq: "3591716014",
    invitorId: "user-0",
    invitationCode: "POP-X9Y8Z7",
    roles: 2, // 翻译
    isPending: true,
  },
  {
    id: "inv-3",
    inviteeQq: "9988776655",
    invitorId: "user-0",
    invitationCode: "POP-R3V1EW",
    roles: 1 | 4 | 32, // 图源 + 校对 + 监修
    isPending: true,
  },
];

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof MemberInvitorModal> = {
  title: "Features/MemberInvitorModal",
  component: MemberInvitorModal,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MemberInvitorModal>;

// ── Helper: generate a random-looking invitation code ─────────────────────────

function fakeCode(): string {
  return `POP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * 默认场景：右侧已有若干待处理邀请，提交后生成邀请码并刷新列表。
 */
export const Default: Story = {
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    const [invitations, setInvitations] =
      // eslint-disable-next-line @eslint-react/rules-of-hooks
      useState<InvitationInfo[]>(MOCK_INVITATIONS);

    const handleLoad = (offset: number, limit: number): Promise<Result<InvitationInfo[]>> =>
      loadInvitations(invitations, offset, limit);
    const handleCreate = (args: CreateInvitationArgs): Promise<Result<string>> =>
      createInvitation(args, setInvitations);
    const handleDelete = (id: string): Promise<Result<void>> =>
      deleteInvitation(id, setInvitations);

    return (
      <div className="min-h-screen bg-surface-slate-100">
        {!open && (
          <div className="flex items-center justify-center pt-32">
            <button
              type="button"
              className="rounded-lg bg-ink-blue-500 px-4 py-2 text-ink-white hover:bg-ink-blue-600"
              onClick={() => {
                setOpen(true);
              }}
            >
              重新打开
            </button>
          </div>
        )}
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => {
              setOpen(false);
            }}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={handleDelete}
          />
        )}
      </div>
    );
  },
};

/**
 * 空列表：右侧没有任何待处理邀请，展示空状态文案。
 */
export const EmptyPending: Story = {
  name: "空待处理列表",
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: [] };
    };

    const handleCreate = async (_args: CreateInvitationArgs): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-surface-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => {
              setOpen(false);
            }}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (_id) => {
              await new Promise((resolve) => setTimeout(resolve, 400));
              return { success: true, data: undefined };
            }}
          />
        )}
      </div>
    );
  },
};

/**
 * 加载失败：listInvitations 返回错误，右侧列表保持空并触发 toast。
 */
export const LoadError: Story = {
  name: "加载邀请列表失败",
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 500));
      return { success: false, error: "网络超时，无法加载邀请列表" };
    };

    const handleCreate = async (_args: CreateInvitationArgs): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-surface-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => {
              setOpen(false);
            }}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (_id) => {
              await new Promise((resolve) => setTimeout(resolve, 400));
              return { success: true, data: undefined };
            }}
          />
        )}
      </div>
    );
  },
};

/**
 * 提交失败：createInvitation 返回业务错误，表单保持可用状态。
 */
export const SubmitError: Story = {
  name: "邀请提交失败",
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [invitations, setInvitations] = useState<InvitationInfo[]>(MOCK_INVITATIONS);

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: invitations };
    };
    const handleCreate = async (): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      return { success: false, error: "该 QQ 号已是汉化组成员，无法重复邀请" };
    };

    return (
      <div className="min-h-screen bg-surface-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => {
              setOpen(false);
            }}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => {
              await new Promise((r) => setTimeout(r, 400));
              setInvitations((prev) => prev.filter((inv) => inv.id !== id));
              return { success: true, data: undefined };
            }}
          />
        )}
      </div>
    );
  },
};

/**
 * 满角色：右侧列表展示一个开启了所有 8 个角色位的邀请记录（roles = 255）。
 */
export const AllRoles: Story = {
  name: "所有角色全开",
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [invitations, setInvitations] = useState<InvitationInfo[]>([
      {
        id: "inv-all",
        inviteeQq: "123456789",
        invitorId: "user-0",
        invitationCode: "POP-FULL01",
        roles: 255, // all 8 bits
        isPending: true,
      },
    ]);

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: invitations };
    };

    const handleCreate = async (_args: CreateInvitationArgs): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-surface-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => {
              setOpen(false);
            }}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => {
              await new Promise((r) => setTimeout(r, 400));
              setInvitations((prev) => prev.filter((inv) => inv.id !== id));
              return { success: true, data: undefined };
            }}
          />
        )}
      </div>
    );
  },
};

/**
 * 长列表：右侧展示 12 条待处理邀请，验证滚动行为。
 */
export const LongList: Story = {
  name: "待处理邀请列表较长",
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [invitations, setInvitations] = useState<InvitationInfo[]>(
      Array.from({ length: 12 }, (_, i) => ({
        id: `inv-long-${String(i)}`,
        inviteeQq: String(100_000_000 + i * 11_111_111),
        invitorId: "user-0",
        invitationCode: `POP-${i.toString(16).toUpperCase().padStart(6, "0")}`,
        roles: (1 << i % 8) | (1 << (i + 3) % 8),
        isPending: true,
      })),
    );

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: invitations };
    };

    const handleCreate = async (_args: CreateInvitationArgs): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-surface-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => {
              setOpen(false);
            }}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => {
              await new Promise((r) => setTimeout(r, 400));
              setInvitations((prev) => prev.filter((inv) => inv.id !== id));
              return { success: true, data: undefined };
            }}
          />
        )}
      </div>
    );
  },
};
