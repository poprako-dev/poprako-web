import type { LoginUserResult, LoginUserArgs } from "@/types";
import { api } from "./util";

export async function loginUser(args: LoginUserArgs) {
  const result = await api.post<LoginUserResult, LoginUserArgs>(
    "/auth/login",
    args,
    false,
  );

  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}
