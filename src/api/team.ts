import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { ReserveTeamAvatarResult, UpdateTeamArgs } from "@/types/team";
import type { ReserveImageArgs } from "@/types/image";
import {
  unwrapRawReserveTeamAvatarResult,
  type RawReserveTeamAvatarResult,
} from "@/types/raw/team";

export async function markSelfOnline(teamId: string): Promise<Result<void>> {
  return api.put<void, Record<string, never>>(
    `/teams/${teamId}/mark-self-online`,
    {},
  );
}

export async function listOnlineUserIds(
  teamId: string,
): Promise<Result<string[]>> {
  return api.get<string[]>(`/teams/${teamId}/online-users`);
}

export async function reserveTeamAvatarUpload(
  teamId: string,
  args: ReserveImageArgs,
): Promise<Result<ReserveTeamAvatarResult>> {
  const res = await api.post<
    RawReserveTeamAvatarResult,
    { image_hash: string; new_byte_len: number; ext: string }
  >(`/teams/${teamId}/avatar/reserve`, {
    image_hash: args.imageHash,
    new_byte_len: args.newByteLen,
    ext: args.extension,
  });
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveTeamAvatarResult(res.data),
  };
}

export async function confirmTeamAvatarUploaded(
  teamId: string,
  imageVersion: number,
): Promise<Result<void>> {
  const res = await api.post<void, { image_version: number }>(
    `/teams/${teamId}/avatar/mark-uploaded`,
    { image_version: imageVersion },
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
