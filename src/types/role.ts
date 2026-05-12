export type Role =
  | "rawProvider"
  | "translator"
  | "proofreader"
  | "typesetter"
  | "redrawer"
  | "reviewer"
  | "publisher"
  | "admin";

// 利用 TS 的类型兼容，将任意满足 WithRole 的对象视为具有 Role 的对象
export type WithRole = {
  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedRedrawerAt?: number;
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
  if (role === "redrawer") {
    return !!withRole.assignedRedrawerAt;
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

export function matchesAssignmentRole(withRole: WithRole, role: Role) {
  if (role === "typesetter") {
    return hasRole(withRole, "typesetter") || hasRole(withRole, "redrawer");
  }

  return hasRole(withRole, role);
}

export type RoleMask = number;

const roleToBit: Record<Role, number> = {
  rawProvider: 1 << 0,  // 1
  translator:  1 << 1,  // 2
  proofreader: 1 << 2,  // 4
  typesetter:  1 << 3,  // 8
  redrawer:    1 << 4,  // 16
  reviewer:    1 << 5,  // 32
  publisher:   1 << 6,  // 64
  admin:       1 << 7,  // 128
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
