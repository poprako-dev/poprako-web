import type { Role } from "@/route/business/identity/role";

export type RoleFilter = Exclude<Role, "admin">;
