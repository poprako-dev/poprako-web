export type UserInfo = {
  id: string;

  qq: string;
  nickname: string;

  avatar_url: string;

  assignedTranslatorAt?: Date;
  assignedProofreaderAt?: Date;
  assignedTypesetterAt?: Date;
  assignedRedrawerAt?: Date;
  assignedReviewerAt?: Date;
  assignedPublisherAt?: Date;

  isAdmin: boolean;

  createdAt: Date;
};

export type UserRole =
  | "translator"
  | "proofreader"
  | "typesetter"
  | "redrawer"
  | "reviewer"
  | "publisher";

export function hasRole(user: UserInfo, ...role: UserRole[]): boolean {
  const roleMap: Record<UserRole, keyof UserInfo> = {
    translator: "assignedTranslatorAt",
    proofreader: "assignedProofreaderAt",
    typesetter: "assignedTypesetterAt",
    redrawer: "assignedRedrawerAt",
    reviewer: "assignedReviewerAt",
    publisher: "assignedPublisherAt",
  };

  return user.isAdmin || role.some((r) => !!user[roleMap[r]]);
}
