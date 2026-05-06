export type AssignmentInvitationInfo = {
  id: string;
  chapterId: string;
  invitationCode: string;
  inviteeQq: string;
  inviterId: string;
  pending: boolean;
  roles: number;
  createdAt: number;
  updatedAt: number;
};

export type ListAssignmentInvitationsArgs = {
  chapterId: string;
  pending?: boolean;
  offset: number;
  limit: number;
};

export type CreateAssignmentInvitationArgs = {
  chapterId: string;
  inviteeQq: string;
  roles: number;
};

export type CreateAssignmentInvitationResult = {
  id: string;
  invitationCode: string;
};
