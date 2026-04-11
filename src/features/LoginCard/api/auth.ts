import type {
  LoginUserArgs,
  LoginUserResult,
  RegisterUserArgs,
  RegisterUserResult,
} from "@/types";
import type {
  RawLoginUserResult,
  RawRegisterUserResult,
} from "@/types/raw/auth";
import {
  unwrapRawLoginUserResult,
  unwrapRawRegisterUserResult,
} from "@/types/raw/auth";
import { api } from "@/api/util";
import type { Result } from "@/types/utils/result";

export async function loginUser(
  args: LoginUserArgs,
): Promise<Result<LoginUserResult>> {
  const res = await api.post<RawLoginUserResult, LoginUserArgs>(
    "/auth/login",
    args,
    false,
  );
  if (!res.success) return res;
  return { success: true, data: unwrapRawLoginUserResult(res.data) };
}

export async function registerUser(
  args: RegisterUserArgs,
): Promise<Result<RegisterUserResult>> {
  const rawArgs = {
    qq: args.qq,
    password: args.password,
    name: args.name,
    invitation_code: args.invitationCode,
  };
  const res = await api.post<RawRegisterUserResult, typeof rawArgs>(
    "/auth/register",
    rawArgs,
    false,
  );
  if (!res.success) return res;
  return { success: true, data: unwrapRawRegisterUserResult(res.data) };
}
