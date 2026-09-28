import type {
  LoginUserArgs,
  LoginUserResult,
  RegisterUserArgs,
  RegisterUserResult,
} from "@/routes/business/identity/auth";
import type {
  RawLoginUserResult,
  RawRegisterUserResult,
} from "@/routes/business/identity/raw-auth";
import {
  unwrapRawLoginUserResult,
  unwrapRawRegisterUserResult,
} from "@/routes/business/identity/raw-auth";
import { api } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";

export async function loginUser(args: LoginUserArgs): Promise<Result<LoginUserResult>> {
  const rawArgs = {
    qid: args.qq,
    password: args.password,
  };
  const res = await api.post<RawLoginUserResult, typeof rawArgs>("/auth/login", rawArgs, false);
  if (!res.success) return res;
  return { success: true, data: unwrapRawLoginUserResult(res.data) };
}

export async function registerUser(args: RegisterUserArgs): Promise<Result<RegisterUserResult>> {
  const rawArgs = {
    qid: args.qq,
    password: args.password,
    nickname: args.name,
    code: args.invitationCode,
  };
  const res = await api.post<RawRegisterUserResult, typeof rawArgs>(
    "/auth/register",
    rawArgs,
    false,
  );
  if (!res.success) return res;
  return { success: true, data: unwrapRawRegisterUserResult(res.data) };
}
