import type { LoginUserArgs, LoginUserResult } from "@/routes/business/identity/auth";
import { api, toApiRequestError } from "@/routes/business/request";
import type { RawLoginUserResult } from "@/routes/business/identity/raw-auth";
import { unwrapRawLoginUserResult } from "@/routes/business/identity/raw-auth";

export async function loginUser(args: LoginUserArgs): Promise<LoginUserResult> {
  const body = {
    qid: args.qq,
    password: args.password,
  };

  const result = await api.post<RawLoginUserResult, typeof body>("/auth/login", body, false);

  if (!result.success) {
    throw toApiRequestError(result);
  }
  return unwrapRawLoginUserResult(result.data);
}

export async function logoutUser(): Promise<void> {
  const result = await api.post("/auth/logout", {}, true);
  if (!result.success) {
    throw toApiRequestError(result);
  }
}
