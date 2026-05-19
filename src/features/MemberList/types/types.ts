import type { Role } from "@/types/role";

export type RoleFilter = Exclude<Role, "admin">;
