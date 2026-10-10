import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberInvitorModal } from "@/route/_authenticated/_shell/member-list/business/MemberInvitorModal";
import type {
  CreateInvitationArgs,
  InvitationInfo,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation";
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
  },
];
function fakeCode(): string {
  return "POP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function loadInvitations(
  invitations: InvitationInfo[],
  offset: number,
  limit: number,
): Promise<Result<InvitationInfo[]>> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { success: true, data: invitations.slice(offset, offset + limit) };
}

async function createInvitation(
  args: CreateInvitationArgs,
  setInvitations: Dispatch<SetStateAction<InvitationInfo[]>>,
): Promise<Result<string>> {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const code = fakeCode();
  setInvitations((previous) => [
    {
      id: `inv-${String(Date.now())}`,
      inviteeQq: args.inviteeQq,
      invitorId: "user-me",
      invitationCode: code,
      roles: args.roles,
      isPending: true,
    },
    ...previous,
  ]);
  return { success: true, data: code };
}

async function deleteInvitation(
  invitationId: string,
  setInvitations: Dispatch<SetStateAction<InvitationInfo[]>>,
): Promise<Result<void>> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  setInvitations((previous) => previous.filter((invitation) => invitation.id !== invitationId));
  return { success: true, data: undefined };
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

    const handleLoad = (offset: number, limit: number): Promise<Result<InvitationInfo[]>> =>
      loadInvitations(invitations, offset, limit);
    const handleCreate = (args: CreateInvitationArgs): Promise<Result<string>> =>
      createInvitation(args, setInvitations);
    const handleDelete = (id: string): Promise<Result<void>> =>
      deleteInvitation(id, setInvitations);

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
            onDeleteInvitation={handleDelete}
          />
        )}
      </div>
    );
  },
};
