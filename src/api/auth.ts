import type { LoginUserArgs } from "@/types";
import { api } from "./util";
import type { RawLoginUserResult } from "@/types/raw/auth";
import { unwrapRawLoginUserResult } from "@/types/raw/auth";

export async function loginUser(args: LoginUserArgs) {
  const body = {
    qid: args.qq,
    password: args.password,
  };

  const result = await api.post<RawLoginUserResult, typeof body>(
    "/auth/login",
    body,
    false,
  );

  if (!result.success) {
    throw new Error(result.error);
  }
  return unwrapRawLoginUserResult(result.data);
}

export async function logoutUser() {
  const result = await api.post("/auth/logout", {}, true);
  if (!result.success) {
    throw new Error(result.error);
  }
}
