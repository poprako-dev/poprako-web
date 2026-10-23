import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useApiClient } from "@/route/business/api-context";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useMailStore } from "@/route/_authenticated/_shell/business/mail/mail-store";

export function useMailPagination(
  enabled: boolean,
  pageSize: number,
): { sentinelRef: RefObject<HTMLDivElement | null>; fetchMore: () => Promise<void> } {
  const client = useApiClient();
  const showToast = useToastStore((state) => state.showToast);
  const loadMore = useMailStore((state) => state.loadMore);
  const hasMore = useMailStore((state) => state.hasMore);
  const loadMoreError = useMailStore((state) => state.loadMoreError);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchMore = useCallback(async () => {
    const result = await loadMore(client, pageSize);
    if (!result.success) showLocalApiFailure(result, showToast);
  }, [client, loadMore, pageSize, showToast]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (hasMore && loadMoreError === null && entries[0]?.isIntersecting) void fetchMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, loadMoreError, fetchMore]);

  return { sentinelRef, fetchMore };
}
