export type InvitationInfo = {
  id: string;

  invitationCode: string;
  inviteeQq: string;
  invitorId: string;

  isPending: boolean;
  roles: number;
};

export type CreateInvitationArgs = {
  teamId: string;
  inviteeQq: string;
  roles: number;
};
export type UpdateInvitationArgs = {
  id: string;
  roles?: number | undefined;
  teamId?: string | undefined;
};
