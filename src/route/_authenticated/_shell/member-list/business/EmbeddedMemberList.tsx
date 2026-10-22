import { type JSX, useRef } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { MemberInfo } from "@/route/business/identity/member";
import { MemberCard } from "./member/MemberCard";
import { Button } from "@/shared/component/Button";
import type { PageLoader } from "@/shared/hook/paged-list";
import { usePagedList } from "@/shared/hook/use-paged-list";
import { useListPagination } from "@/shared/hook/use-list-pagination";
import { useAppStore } from "@/route/business/session/session-store";

type Props = {
  onLoadMembers: PageLoader<MemberInfo>;
  onMemberClick?: ((member: MemberInfo) => void) | undefined;
};

export function EmbeddedMemberList({ onLoadMembers, onMemberClick }: Props): JSX.Element {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const generation = useAppStore((state) => state.generation);
  const state = usePagedList({ loader: onLoadMembers, pageSize: 20, resetKey: generation });
  const { items: members, isLoading, hasMore, error, retry } = state;
  useListPagination({
    ...state,
    sentinelRef: loadMoreRef,
    containerRef: scrollContainerRef,
  });

  return (
    <div ref={scrollContainerRef} className="w-full h-full min-h-0 overflow-y-auto py-4 px-4">
      <div
        className={clsx(
          "grid gap-4 xl:grid-cols-3",
          "grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))]",
        )}
      >
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            onClick={
              onMemberClick
                ? () => {
                    onMemberClick(m);
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* 无限滚动触发器 */}
      <div ref={loadMoreRef} className="flex justify-center py-6">
        {isLoading && <LoaderCircle size={18} className="animate-spin text-icon-muted-cool" />}
        {error !== null && (
          <div className="flex items-center gap-2">
            <p role="alert" className="text-sm text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => void retry()}>重试</Button>
          </div>
        )}
        {!isLoading && error === null && !hasMore && members.length > 0 && (
          <span className="text-sm text-text-muted-cool">没有更多成员了 O^O</span>
        )}
        {!isLoading && error === null && !hasMore && members.length === 0 && (
          <span className="text-xs text-text-muted-cool">暂无成员</span>
        )}
      </div>
    </div>
  );
}
