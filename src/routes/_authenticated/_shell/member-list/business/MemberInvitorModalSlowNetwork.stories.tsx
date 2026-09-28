import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberInvitorModal } from "@/routes/_authenticated/_shell/member-list/business/MemberInvitorModal";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/routes/_authenticated/_shell/member-list/business/invitation/invitation";
import type { Result } from "@/shared/utility/result";

const meta: Meta<typeof MemberInvitorModal> = {
  title: "Features/MemberInvitorModal/Slow network",
  component: MemberInvitorModal,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof MemberInvitorModal>;
const MOCK_INVITATIONS: InvitationInfo[] = [
  {
    id: "inv-slow",
    inviteeQq: "2458262309",
    invitorId: "user-0",
    invitationCode: "POP-SLOW01",
    roles: 2,
    isPending: true,
    createdAt: Date.now(),
  },
];
function fakeCode(): string {
  return "POP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * 慢网络：加载和提交都有明显延迟，可测试加载态 UI。
 */
export const SlowNetwork: Story = {
  name: "慢网络模拟",
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [open, setOpen] = useState(true);
    const [invitations, setInvitations] =
      // eslint-disable-next-line @eslint-react/rules-of-hooks
      useState<InvitationInfo[]>(MOCK_INVITATIONS);

    const handleLoad = async (offset: number, limit: number): Promise<Result<InvitationInfo[]>> => {
      await new Promise((r) => setTimeout(r, 2000));
      return { success: true, data: invitations.slice(offset, offset + limit) };
    };

    const handleCreate = async (args: CreateInvitationArgs): Promise<Result<string>> => {
      await new Promise((r) => setTimeout(r, 3000));
      const code = fakeCode();
      setInvitations((prev) => [
        {
          id: `inv-${String(Date.now())}`,
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
      <div className="min-h-screen bg-surface-hover">
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
