export {
  allocateTeamAvatar,
  allocateUserAvatar,
  confirmTeamAvatar,
  confirmUserAvatar,
  getMyUser,
  getTeam,
  getUser,
  joinTeam,
  listMembers,
  listMyMembers,
  listOnlineUserIds,
  listTeams,
  loginApi,
  markSelfOnline,
  registerApi,
  updateMemberRoles,
  updateTeam,
  updateUserPassword,
} from "@/api/identity/identity-api";
export type { ApiImageUploadSlot, ListApiMembersOptions } from "@/api/identity/identity-api";
export type { ApiAuthResult, ApiMember, ApiTeam, ApiUser } from "@/api/identity-contract";
