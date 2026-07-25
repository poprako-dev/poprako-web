import {
  unwrapRawReserveUserAvatarResult,
  unwrapRawUserInfo,
  type RawReserveUserAvatarResult,
  type RawUserInfo,
} from "@/types/raw/user";
import type { ReserveUserAvatarResult } from "@/types/user";
import type { ReserveImageArgs } from "@/types/image";
import type { Result } from "@/types/utils/result";
import { api } from "./util";

type UpdateUserPasswordArgs = {
  currentPassword: string;
  newPassword: string;
};

export async function getMyUser() {
  const userInfo = await api.get<RawUserInfo>("/users/me");
  if (!userInfo.success) throw new Error(userInfo.error);
  return unwrapRawUserInfo(userInfo.data);
}

export async function updateUserPassword(
  userId: string,
  args: UpdateUserPasswordArgs,
): Promise<Result<void>> {
  return api.put<
    void,
    { current_password: string; new_password: string }
  >(`/users/${userId}/password`, {
    current_password: args.currentPassword,
    new_password: args.newPassword,
  });
}

export async function reserveUserAvatarUpload(
  userId: string,
  args: ReserveImageArgs,
): Promise<Result<ReserveUserAvatarResult>> {
  const res = await api.post<RawReserveUserAvatarResult, {
    image_hash: string;
    new_byte_len: number;
    ext: string;
  }>(
    `/users/${userId}/avatar/reserve`,
    { image_hash: args.imageHash, new_byte_len: args.newByteLen, ext: args.extension },
  );
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawReserveUserAvatarResult(res.data),
  };
}

export async function confirmUserAvatarUploaded(
  userId: string,
  imageVersion: number,
): Promise<Result<void>> {
  const res = await api.post<void, { image_version: number }>(
    `/users/${userId}/avatar/mark-uploaded`,
    { image_version: imageVersion },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
