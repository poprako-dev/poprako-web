import { useCallback } from "react";
import { listMembers } from "@/api/identity/identity-api";
import { useApiClient } from "@/route/business/api-context";
import { roleMask } from "@/route/business/identity/role";
import { toMemberInfo } from "@/route/business/identity/api-adapter";
import type { MemberInfo } from "@/route/business/identity/member";
import type { RoleFilter } from "@/route/_authenticated/_shell/member-list/business/member-list-type";
import type { Result } from "@/shared/utility/result";

export function useMemberGlanceLoader(
  activeTeamId: string | null,
  fuzzyName: string,
  activeRole: RoleFilter | null,
): (offset: number, limit: number) => Promise<Result<MemberInfo[]>> {
  const client = useApiClient();
  return useCallback(
    async (offset: number, limit: number): Promise<Result<MemberInfo[]>> => {
      if (!activeTeamId) {
        return { success: true, data: [] };
      }
      const result = await listMembers(client, {
        teamId: activeTeamId,
        offset,
        limit,
        includes: ["user"],
        nickname: fuzzyName.trim() || undefined,
        role: activeRole ? roleMask([activeRole]) : undefined,
      });
      if (!result.success) {
        return result;
      }
      return { success: true, data: result.data.map(toMemberInfo) };
    },
    [activeRole, activeTeamId, client, fuzzyName],
  );
}
