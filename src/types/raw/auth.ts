import type {
  LoginUserArgs,
  LoginUserResult,
  RegisterUserArgs,
  RegisterUserResult,
  UpdateUserArgs,
} from "../auth";

export type RawLoginUserArgs = { qid: string; password: string };
export function unwrapRawLoginUserArgs(raw: RawLoginUserArgs): LoginUserArgs {
  return { qq: raw.qid, password: raw.password };
}

export type RawLoginUserResult = { access_token: string; user_id: string };
export function unwrapRawLoginUserResult(
  raw: RawLoginUserResult,
): LoginUserResult {
  return { accessToken: raw.access_token, userId: raw.user_id };
}

export type RawRegisterUserArgs = {
  qid: string;
  password: string;
  name: string;
  invitation_code: string;
};
export function unwrapRawRegisterUserArgs(
  raw: RawRegisterUserArgs,
): RegisterUserArgs {
  return {
    qq: raw.qid,
    password: raw.password,
    name: raw.name,
    invitationCode: raw.invitation_code,
  };
}

export type RawRegisterUserResult = { access_token: string; user_id: string };
export function unwrapRawRegisterUserResult(
  raw: RawRegisterUserResult,
): RegisterUserResult {
  return { accessToken: raw.access_token, userId: raw.user_id };
}

export type RawUpdateUserArgs = {
  user_id: string;
  qid?: string;
  name?: string;
  password?: string;
};
export function unwrapRawUpdateUserArgs(
  raw: RawUpdateUserArgs,
): UpdateUserArgs {
  return {
    userId: raw.user_id,
    qq: raw.qid,
    name: raw.name,
    password: raw.password,
  };
}
