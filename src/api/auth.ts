import type { LoginUserResult, LoginUserArgs } from "@/types";
import { api } from "./util";

export async function loginUser(args: LoginUserArgs) {
  const body = {
    qid: args.qq,
    password: args.password,
  };

  const result = await api.post<LoginUserResult, typeof body>(
    "/auth/login",
    body,
    false,
  );

  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}
