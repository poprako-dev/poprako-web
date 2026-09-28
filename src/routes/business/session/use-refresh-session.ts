import { useCallback } from "react";
import { refreshSession } from "@/routes/business/session/session";
import type { Result } from "@/shared/utility/result";

export function useRefreshLoginState(): () => Promise<Result<void>> {
  return useCallback(async (): Promise<Result<void>> => {
    const result = await refreshSession();
    return result.success ? { success: true, data: undefined } : result;
  }, []);
}
