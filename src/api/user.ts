import { unwrapRawUserInfo, type RawUserInfo } from "@/types/raw/user";
import { api } from "./util";

export async function getMyUser() {
  let userInfo = await api.get<RawUserInfo>("/users/me");
  return unwrapRawUserInfo(userInfo.data!);
}
