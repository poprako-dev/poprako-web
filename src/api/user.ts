import { unwrapRawUserInfo, type RawUserInfo } from "@/types/raw/user";
import { api } from "./util";

export async function getMyUser() {
  const userInfo = await api.get<RawUserInfo>("/users/me");
  if (!userInfo.success) throw new Error(userInfo.error);
  return unwrapRawUserInfo(userInfo.data);
}
