import type { MemberInfo } from "@/routes/business/identity/member";
import type { UserInfo } from "@/routes/business/identity/user";

export type LoginState = {
  userInfo: UserInfo;
  // 此处的 MemberInfo 必须填充了 team 字段
  memberInfos: MemberInfo[];
};
