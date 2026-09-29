import type { MemberInfo } from "@/route/business/identity/member";
import type { UserInfo } from "@/route/business/identity/user";

import type { TeamInfo } from "./team";
export type ReadyMember = MemberInfo & { team: TeamInfo };

export type LoginState = {
  userInfo: UserInfo;
  memberInfos: ReadyMember[];
};
