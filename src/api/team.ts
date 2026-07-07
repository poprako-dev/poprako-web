import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { ReserveTeamAvatarResult, UpdateTeamArgs } from "@/types/team";
import {
  unwrapRawReserveTeamAvatarResult,
  type RawReserveTeamAvatarResult,
} from "@/types/raw/team";

type ReserveTeamAvatarArgs = {
  fileExtension: string;
};

export async function reserveTeamAvatarUpload(
  teamId: string,
  args: ReserveTeamAvatarArgs,
): Promise<Result<ReserveTeamAvatarResult>> {
  const res = await api.post<
    RawReserveTeamAvatarResult,
    { file_ext: string }
  >(`/teams/${teamId}/avatar/reserve`, { file_ext: args.fileExtension });
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveTeamAvatarResult(res.data),
  };
}

export async function confirmTeamAvatarUploaded(
  teamId: string,
  avatarVersion: number,
): Promise<Result<void>> {
  const res = await api.post<void, { avatar_version: number }>(
    `/teams/${teamId}/avatar/mark-uploaded`,
    { avatar_version: avatarVersion },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function updateTeam(
  args: UpdateTeamArgs,
): Promise<Result<void>> {
  const res = await api.put<
    void,
    { id: string; name?: string; description?: string }
  >(
    `/teams/${args.id}`,
    {
      id: args.id,
      name: args.name,
      description: args.description,
    },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
