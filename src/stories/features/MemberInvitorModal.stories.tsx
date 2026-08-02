import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberInvitorModal } from "@/features/MemberList";
import type { InvitationInfo, CreateInvitationArgs } from "@/types/invitation";
import type { Result } from "@/types/utils/result";

// ── Shared mock data ──────────────────────────────────────────────────────────

const now = Date.now();

const MOCK_INVITATIONS: InvitationInfo[] = [
  {
    id: "inv-1",
    inviteeQq: "2458262309",
    invitorId: "user-0",
    invitationCode: "POP-A1B2C3",
    roles: 2 | 16,     // 翻译 + 美工
    isPending: true,
    createdAt: now - 1000 * 60 * 30,
  },
  {
    id: "inv-2",
    inviteeQq: "3591716014",
    invitorId: "user-0",
    invitationCode: "POP-X9Y8Z7",
    roles: 2,          // 翻译
    isPending: true,
    createdAt: now - 1000 * 60 * 60 * 2,
  },
  {
    id: "inv-3",
    inviteeQq: "9988776655",
    invitorId: "user-0",
    invitationCode: "POP-R3V1EW",
    roles: 1 | 4 | 32, // 图源 + 校对 + 监修
    isPending: true,
    createdAt: now - 1000 * 60 * 60 * 5,
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

function fakeCode() {
  return `POP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * 默认场景：右侧已有若干待处理邀请，提交后生成邀请码并刷新列表。
 */
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [invitations, setInvitations] =
      useState<InvitationInfo[]>(MOCK_INVITATIONS);

    const handleLoad = async (
      offset: number,
      limit: number,
    ): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: invitations.slice(offset, offset + limit) };
    };

    const handleCreate = async (
      args: CreateInvitationArgs,
    ): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      const code = fakeCode();
      const newInv: InvitationInfo = {
        id: `inv-${Date.now()}`,
        inviteeQq: args.inviteeQq,
        invitorId: "user-me",
        invitationCode: code,
        roles: args.roles,
        isPending: true,
        createdAt: Date.now(),
      };
      setInvitations((prev) => [newInv, ...prev]);
      return { success: true, data: code };
    };

    const handleDelete = async (invitationId: string): Promise<Result<void>> => {
      await new Promise((r) => setTimeout(r, 400));
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      return { success: true, data: undefined };
    };

    return (
      <div className="min-h-screen bg-slate-100">
        {!open && (
          <div className="flex items-center justify-center pt-32">
            <button
              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => setOpen(true)}
            >
              重新打开
            </button>
          </div>
        )}
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
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
    const [open, setOpen] = useState(true);

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: [] };
    };

    const handleCreate = async (
      args: CreateInvitationArgs,
    ): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      console.log("创建邀请:", args);
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => { await new Promise(r => setTimeout(r, 400)); console.log("删除邀请:", id); return { success: true, data: undefined }; }}
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
    const [open, setOpen] = useState(true);

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 500));
      return { success: false, error: "网络超时，无法加载邀请列表" };
    };

    const handleCreate = async (
      args: CreateInvitationArgs,
    ): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      console.log("创建邀请:", args);
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => { await new Promise(r => setTimeout(r, 400)); console.log("删除邀请:", id); return { success: true, data: undefined }; }}
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
    const [open, setOpen] = useState(true);
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
      <div className="min-h-screen bg-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => { await new Promise(r => setTimeout(r, 400)); setInvitations(prev => prev.filter(inv => inv.id !== id)); return { success: true, data: undefined }; }}
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
    const [open, setOpen] = useState(true);
    const [invitations, setInvitations] = useState<InvitationInfo[]>([{
      id: "inv-all",
      inviteeQq: "123456789",
      invitorId: "user-0",
      invitationCode: "POP-FULL01",
      roles: 255, // all 8 bits
      isPending: true,
      createdAt: now,
    }]);

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: invitations };
    };

    const handleCreate = async (
      args: CreateInvitationArgs,
    ): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      console.log("创建邀请:", args);
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => { await new Promise(r => setTimeout(r, 400)); setInvitations(prev => prev.filter(inv => inv.id !== id)); return { success: true, data: undefined }; }}
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
    const [open, setOpen] = useState(true);
    const [invitations, setInvitations] = useState<InvitationInfo[]>(
      Array.from({ length: 12 }, (_, i) => ({
        id: `inv-long-${i}`,
        inviteeQq: `${100000000 + i * 11111111}`,
        invitorId: "user-0",
        invitationCode: `POP-${i.toString(16).toUpperCase().padStart(6, "0")}`,
        roles: (1 << (i % 8)) | (1 << ((i + 3) % 8)),
        isPending: true,
        createdAt: now - 1000 * 60 * 10 * i,
      })),
    );

    const handleLoad = async (): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, data: invitations };
    };

    const handleCreate = async (
      args: CreateInvitationArgs,
    ): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 700));
      console.log("创建邀请:", args);
      return { success: true, data: fakeCode() };
    };

    return (
      <div className="min-h-screen bg-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={async (id) => { await new Promise(r => setTimeout(r, 400)); setInvitations(prev => prev.filter(inv => inv.id !== id)); return { success: true, data: undefined }; }}
          />
        )}
      </div>
    );
  },
};

/**
 * 慢网络：加载和提交都有明显延迟，可测试加载态 UI。
 */
export const SlowNetwork: Story = {
  name: "慢网络模拟",
  render: () => {
    const [open, setOpen] = useState(true);
    const [invitations, setInvitations] =
      useState<InvitationInfo[]>(MOCK_INVITATIONS);

    const handleLoad = async (
      offset: number,
      limit: number,
    ): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 2000));
      return { success: true, data: invitations.slice(offset, offset + limit) };
    };

    const handleCreate = async (
      args: CreateInvitationArgs,
    ): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 3000));
      const code = fakeCode();
      setInvitations((prev) => [
        {
          id: `inv-${Date.now()}`,
          inviteeQq: args.inviteeQq,
          invitorId: "user-me",
          invitationCode: code,
          roles: args.roles,
          isPending: true,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      return { success: true, data: code };
    };

    const handleDelete = async (invitationId: string): Promise<Result<void>> => {
      await new Promise((r) => setTimeout(r, 1500));
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      return { success: true, data: undefined };
    };

    return (
      <div className="min-h-screen bg-slate-100">
        {open && (
          <MemberInvitorModal
            teamId="team-1"
            onClose={() => setOpen(false)}
            onLoadInvitations={handleLoad}
            onCreateInvitation={handleCreate}
            onDeleteInvitation={handleDelete}
          />
        )}
      </div>
    );
  },
};
