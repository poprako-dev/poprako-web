export type LoginUserArgs = { qq: string; password: string };
export type LoginUserResult = { accessToken: string; userId: string };

export type RegisterUserArgs = {
  qq: string;
  password: string;
  name: string;
  invitationCode: string;
};
export type RegisterUserResult = LoginUserResult;

export type UpdateUserArgs = {
  userId: string;
  qq?: string;
  name?: string;
  password?: string;
};
