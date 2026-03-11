import type { MemberWithTeamInfo } from "./member";
import type { UserInfo } from "./user";

export type LoginState = {
  userInfo: UserInfo;
  memberInfos: MemberWithTeamInfo[];
};
