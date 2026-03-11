// 在程序启动时调用，尝试是否登录过期

import { useAppStore } from "@/store/app";
import { listMyMembers } from "./member";
import { getMyUser } from "./user";

// 如果登录信息过期则抛出异常，调用者应该返回登录界面
export async function persistLogin() {
  // 先检查本地是否有 token，没有的话直接抛出异常
  const token = useAppStore.getState().getAccessToken();
  if (!token) {
    throw new Error("没有找到访问令牌，跳转至登录");
  }
  // 调用获取我的用户信息的接口
  let myUser = await getMyUser();

  // 调用获取我的成员信息的接口
  let myMembers = await listMyMembers();

  // 如果没有抛出异常，说明登录信息有效，可以继续使用
  // 将所有数据载入 app store 中

  useAppStore.getState().setLoginState({
    userInfo: myUser,
    memberInfos: myMembers,
  });
}
