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
  assignedRawProviderAt?: number | undefined;
  assignedTranslatorAt?: number | undefined;
  assignedProofreaderAt?: number | undefined;
  assignedTypesetterAt?: number | undefined;
  assignedRedrawerAt?: number | undefined;
  assignedReviewerAt?: number | undefined;
  assignedPublisherAt?: number | undefined;
  assignedAdminAt?: number | undefined;
};

export function hasRole(withRole: WithRole, role: Role): boolean {
  if (role === "rawProvider") {
    return Boolean(withRole.assignedRawProviderAt);
  }
  if (role === "translator") {
    return Boolean(withRole.assignedTranslatorAt);
  }
  if (role === "proofreader") {
    return Boolean(withRole.assignedProofreaderAt);
  }
  if (role === "typesetter") {
    return Boolean(withRole.assignedTypesetterAt);
  }
  if (role === "redrawer") {
    return Boolean(withRole.assignedRedrawerAt);
  }
  if (role === "reviewer") {
    return Boolean(withRole.assignedReviewerAt);
  }
  if (role === "publisher") {
    return Boolean(withRole.assignedPublisherAt);
  }
  return Boolean(withRole.assignedAdminAt);
}

export function matchesAssignmentRole(withRole: WithRole, role: Role): boolean {
  if (role === "typesetter") {
    return hasRole(withRole, "typesetter") || hasRole(withRole, "redrawer");
  }

  return hasRole(withRole, role);
}

export type RoleMask = number;

const roleToBit: Record<Role, number> = {
  rawProvider: Math.trunc(1), // 1
  translator: 1 << 1, // 2
  proofreader: 1 << 2, // 4
  typesetter: 1 << 3, // 8
  redrawer: 1 << 4, // 16
  reviewer: 1 << 5, // 32
  publisher: 1 << 6, // 64
  admin: 1 << 7, // 128
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
