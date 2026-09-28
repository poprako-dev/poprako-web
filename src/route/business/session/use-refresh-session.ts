import { useCallback } from "react";
import { useApiClient } from "@/route/business/api-context";
import { refreshSession } from "@/route/business/session/session";
import type { Result } from "@/shared/utility/result";

export function useRefreshLoginState(): () => Promise<Result<void>> {
  const client = useApiClient();
  return useCallback(async (): Promise<Result<void>> => {
    const result = await refreshSession(client);
    return result.success ? { success: true, data: undefined } : result;
  }, [client]);
}
