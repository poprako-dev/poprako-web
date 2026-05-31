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
    { file_extension: string }
  >(`/teams/${teamId}/avatar`, { file_extension: args.fileExtension });
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveTeamAvatarResult(res.data),
  };
}

export async function confirmTeamAvatarUploaded(
  teamId: string,
): Promise<Result<void>> {
  const res = await api.post<void, Record<string, never>>(
    `/teams/${teamId}/avatar/confirm`,
    {},
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function updateTeam(
  args: UpdateTeamArgs,
): Promise<Result<void>> {
  const res = await api.put<void, { name?: string; description?: string }>(
    `/teams/${args.id}`,
    { name: args.name, description: args.description },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
