import {
  unwrapRawMemberWithTeamInfo,
  type RawMemberWithTeamInfo,
} from "@/types/raw/member";
import { api } from "./util";

export async function listMyMembers() {
  const result = await api.get<RawMemberWithTeamInfo[]>("/members/mine");
  if (!result.success) throw new Error(result.error);
  return result.data.map(unwrapRawMemberWithTeamInfo);
}
