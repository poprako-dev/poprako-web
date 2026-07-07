import {
  unwrapRawReserveUserAvatarResult,
  unwrapRawUserInfo,
  type RawReserveUserAvatarResult,
  type RawUserInfo,
} from "@/types/raw/user";
import type { ReserveUserAvatarResult } from "@/types/user";
import type { Result } from "@/types/utils/result";
import { api } from "./util";

export async function getMyUser() {
  const userInfo = await api.get<RawUserInfo>("/users/me");
  if (!userInfo.success) throw new Error(userInfo.error);
  return unwrapRawUserInfo(userInfo.data);
}

export async function reserveUserAvatarUpload(
  userId: string,
  fileExtension: string,
): Promise<Result<ReserveUserAvatarResult>> {
  const res = await api.post<RawReserveUserAvatarResult, { file_ext: string }>(
    `/users/${userId}/avatar/reserve`,
    { file_ext: fileExtension },
  );
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveUserAvatarResult(res.data),
  };
}

export async function confirmUserAvatarUploaded(
  userId: string,
  avatarVersion: number,
): Promise<Result<void>> {
  const res = await api.post<void, { avatar_version: number }>(
    `/users/${userId}/avatar/mark-uploaded`,
    { avatar_version: avatarVersion },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
