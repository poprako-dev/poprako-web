import type { LoginUserResult, LoginUserArgs } from "@/types";
import { api } from "./util";

export async function loginUser(args: LoginUserArgs) {
  let result = await api.post<LoginUserResult, LoginUserArgs>(
    "/auth/login",
    args,
    false,
  );

  if (typeof result === "string") {
    throw new Error(result);
  }
  return result;
}
