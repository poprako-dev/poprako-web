import type { MemberInfo } from "./member";
import type { UserInfo } from "./user";

export type LoginState = {
  userInfo: UserInfo;
  // 此处的 MemberInfo 必须填充了 team 字段
  memberInfos: MemberInfo[];
};
