import {
  unwrapRawMemberWithTeamInfo,
  type RawMemberWithTeamInfo,
} from "@/types/raw/member";
import { api } from "./util";

export async function listMyMembers() {
  let result = await api.get<RawMemberWithTeamInfo[]>("/members/mine");
  return result.data!.map(unwrapRawMemberWithTeamInfo);
}
