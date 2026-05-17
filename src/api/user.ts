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
  const res = await api.post<RawReserveUserAvatarResult, { file_extension: string }>(
    `/users/${userId}/avatar`,
    { file_extension: fileExtension },
  );
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveUserAvatarResult(res.data),
  };
}

export async function confirmUserAvatarUploaded(
  userId: string,
): Promise<Result<void>> {
  const res = await api.post<void, Record<string, never>>(
    `/users/${userId}/avatar/confirm`,
    {},
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
