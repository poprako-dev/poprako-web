import {
  type RawAllocUserAvatarResult,
  type RawUserInfo,
  unwrapRawAllocUserAvatarResult,
  unwrapRawUserInfo,
} from "@/routes/business/identity/raw-user";
import type { AllocUserAvatarResult, UserInfo } from "@/routes/business/identity/user";
import type { AllocImageArgs } from "@/routes/business/identity/image";
import type { Result } from "@/shared/utility/result";
import { api, toApiRequestError } from "@/routes/business/request";

type UpdateUserPasswordArgs = {
  currentPassword: string;
  newPassword: string;
};

export async function getMyUser(): Promise<UserInfo> {
  const userInfo = await api.get<RawUserInfo>("/users/me");
  if (!userInfo.success) throw toApiRequestError(userInfo);
  return unwrapRawUserInfo(userInfo.data);
}

export async function getUser(userId: string): Promise<Result<UserInfo>> {
  const result = await api.get<RawUserInfo>(`/users/${userId}`);
  if (!result.success) return result;

  return { success: true, data: unwrapRawUserInfo(result.data) };
}

export async function updateUserPassword(
  userId: string,
  args: UpdateUserPasswordArgs,
): Promise<Result<undefined>> {
  return api.put<undefined, { current_password: string; new_password: string }>(
    `/users/${userId}/password`,
    {
      current_password: args.currentPassword,
      new_password: args.newPassword,
    },
  );
}

export async function allocUserAvatarUpload(
  userId: string,
  args: AllocImageArgs,
): Promise<Result<AllocUserAvatarResult>> {
  const res = await api.post<
    RawAllocUserAvatarResult,
    {
      image_hash: string;
      new_byte_len: number;
      ext: string;
    }
  >(`/users/${userId}/avatar/alloc`, {
    image_hash: args.imageHash,
    new_byte_len: args.newByteLen,
    ext: args.extension,
  });
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawAllocUserAvatarResult(res.data),
  };
}

export async function confirmUserAvatarUploaded(
  userId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  const res = await api.post<undefined, { image_version: number }>(
    `/users/${userId}/avatar/mark-uploaded`,
    { image_version: imageVersion },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
