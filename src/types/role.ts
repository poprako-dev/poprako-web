export type Role =
  | "rawProvider"
  | "translator"
  | "proofreader"
  | "typesetter"
  | "reviewer"
  | "publisher"
  | "admin";

// 利用 TS 的类型兼容，将任意满足 WithRole 的对象视为具有 Role 的对象
export type WithRole = {
  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedReviewerAt?: number;
  assignedPublisherAt?: number;
  assignedAdminAt?: number;
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
  if (role === "admin") {
    return !!withRole.assignedAdminAt;
  }

  return false;
}

export type RoleMask = number;

const roleToBit: Record<Role, number> = {
  rawProvider: 1 << 0,
  translator: 1 << 1,
  proofreader: 1 << 2,
  typesetter: 1 << 3,
  reviewer: 1 << 4,
  publisher: 1 << 5,
  admin: 1 << 6,
};

export function roleMask(roles: Role[]): RoleMask {
  return roles.reduce((mask, role) => mask | roleToBit[role], 0);
}

export function unmaskRoles(mask: RoleMask): Role[] {
  const roles: Role[] = [];

  for (const role in roleToBit) {
    if ((mask & roleToBit[role as Role]) !== 0) {
      roles.push(role as Role);
    }
  }

  return roles;
}
