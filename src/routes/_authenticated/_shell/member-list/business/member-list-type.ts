import type { Role } from "@/routes/business/identity/role";

export type RoleFilter = Exclude<Role, "admin">;
