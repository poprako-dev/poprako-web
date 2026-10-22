import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ApiClient } from "@/api/client";
import { useAppStore } from "@/route/business/session/session-store";
import { useReadySession } from "@/route/business/session/ready-session";
import { invalidateComicDetails } from "./comic-detail-cache";

export function useDetailInvalidation(
  client: ApiClient,
  comicId: string,
): (discard?: boolean) => boolean {
  const { userInfo, generation } = useReadySession();
  const teamId = useAppStore((state) => state.selectedTeamId);
  const userId = userInfo.id;
  const owner = useMemo(
    () => ({
      client,
      comicId,
      scope: { userId, generation, teamId },
    }),
    [client, comicId, userId, generation, teamId],
  );
  const activeOwnerRef = useRef<typeof owner | null>(null);
  useEffect(() => {
    activeOwnerRef.current = owner;
    return () => {
      activeOwnerRef.current = null;
    };
  }, [owner]);
  return useCallback(
    (discard = false) => {
      invalidateComicDetails(owner.client, owner.scope, owner.comicId, discard);
      return activeOwnerRef.current === owner;
    },
    [owner],
  );
}
