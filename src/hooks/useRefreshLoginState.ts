import { useCallback } from "react";
import { listMyMembers } from "@/api/member";
import { getMyUser } from "@/api/user";
import { useAppStore } from "@/store/app";
import type { Result } from "@/types/utils/result";

export function useRefreshLoginState() {
  const setLoginState = useAppStore((s) => s.setLoginState);

  return useCallback(async (): Promise<Result<void>> => {
    try {
      const [userInfo, memberInfos] = await Promise.all([
        getMyUser(),
        listMyMembers(),
      ]);

      setLoginState({ userInfo, memberInfos });
      return { success: true, data: undefined };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "刷新登录状态失败",
      };
    }
  }, [setLoginState]);
}
