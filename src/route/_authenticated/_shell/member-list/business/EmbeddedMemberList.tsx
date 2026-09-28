import { type JSX, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { MemberInfo } from "@/route/business/identity/member";
import { MemberCard } from "@/route/_authenticated/_shell/member-list/business/member/MemberCard";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { Result } from "@/shared/utility/result";

type Props = {
  onLoadMembers: (offset: number, limit: number) => Promise<Result<MemberInfo[]>>;
  onMemberClick?: ((member: MemberInfo) => void) | undefined;
};

// 受控的成员列表展示组件，负责无限下滑加载
// 过滤/搜索逻辑由父组件通过 onLoadMembers 闭包注入
export function EmbeddedMemberList({ onLoadMembers, onMemberClick }: Props): JSX.Element {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToastStore();

  const loadMembers = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const result = await onLoadMembers(offset, 20);
      if (result.success) {
        if (result.data.length < 20) setHasMore(false);
        setMembers((prev) => [...prev, ...result.data]);
        setOffset((prev) => prev + result.data.length);
      } else {
        console.error("[EmbeddedMemberList] 加载成员列表失败:", result.error);
        showLocalApiFailure(result, showToast);
        setHasMore(false);
      }
    } catch (error) {
      console.error("[EmbeddedMemberList] 加载成员列表异常:", error);
      showLocalCaughtError(error, showToast, "发生未知错误");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, onLoadMembers, showToast]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect */
    setMembers([]);
    setHasMore(true);
    setOffset(0);
    setIsLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect */
  }, [onLoadMembers]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) void loadMembers();
      },
      { root: scrollContainerRef.current },
    );
    observerRef.current.observe(loadMoreRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMembers]);

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
        {isLoading && <LoaderCircle size={18} className="animate-spin text-muted-foreground" />}
        {!isLoading && !hasMore && members.length > 0 && (
          <span className="text-sm text-muted-foreground">没有更多成员了 O^O</span>
        )}
        {!isLoading && !hasMore && members.length === 0 && (
          <span className="text-xs text-muted-foreground">暂无成员</span>
        )}
      </div>
    </div>
  );
}
