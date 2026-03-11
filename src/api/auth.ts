import type { LoginUserResult, LoginUserArgs } from "@/types";
import { api } from "./util";

export async function loginUser(args: LoginUserArgs) {
  let result = await api.post<LoginUserResult, LoginUserArgs>(
    "/auth/login",
    args,
    false,
  );

  return result.data!;
}
