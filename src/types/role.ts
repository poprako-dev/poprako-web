export type Role =
  | "rawProvider"
  | "translator"
  | "proofreader"
  | "typesetter"
  | "reviewer"
  | "publisher";

// 利用 TS 的类型兼容，将任意满足 WithRole 的对象视为具有 Role 的对象
export type WithRole = {
  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedReviewerAt?: number;
  assignedPublisherAt?: number;
};

export function hasRole(withRole: WithRole, role: Role) {
  if (role === "rawProvider") {
    return !!withRole.assignedRawProviderAt;
  }
  if (role === "translator") {
    return !!withRole.assignedTranslatorAt;
  }
  if (role === "proofreader") {
    return !!withRole.assignedProofreaderAt;
  }
  if (role === "typesetter") {
    return !!withRole.assignedTypesetterAt;
  }
  if (role === "reviewer") {
    return !!withRole.assignedReviewerAt;
  }
  if (role === "publisher") {
    return !!withRole.assignedPublisherAt;
  }

  return false;
}
