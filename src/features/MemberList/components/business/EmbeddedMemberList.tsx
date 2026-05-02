import { useRef, useState, useEffect, useCallback } from "react";
import { LoaderCircle } from "lucide-react";
import type { MemberInfo } from "@/types/member";
import MemberCard from "@/features/MemberCard/components/business/MemberCard";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";

type Props = {
  onLoadMembers: (
    offset: number,
    limit: number,
  ) => Promise<MemberInfo[] | string>;
  onMemberClick?: (member: MemberInfo) => void;
};

// 受控的成员列表展示组件，负责无限下滑加载
// 过滤/搜索逻辑由父组件通过 onLoadMembers 闭包注入
export default function EmbeddedMemberList({ onLoadMembers, onMemberClick }: Props) {
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
      if (typeof result === "string") {
        console.error("[EmbeddedMemberList] 加载成员列表失败:", result);
        showToast(result, "error");
        setHasMore(false);
      } else {
        if (result.length < 20) setHasMore(false);
        setMembers((prev) => [...prev, ...result]);
        setOffset((prev) => prev + result.length);
      }
    } catch (err) {
      console.error("[EmbeddedMemberList] 加载成员列表异常:", err);
      showToast("发生未知错误", "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, onLoadMembers, showToast]);

  useEffect(() => {
    setMembers([]);
    setHasMore(true);
    setOffset(0);
    setIsLoading(false);
  }, [onLoadMembers]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) loadMembers();
      },
      { root: scrollContainerRef.current },
    );
    observerRef.current.observe(loadMoreRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMembers]);

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full min-h-0 overflow-y-auto py-4 px-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            onClick={onMemberClick ? () => onMemberClick(m) : undefined}
          />
        ))}
      </div>

      {/* 无限滚动触发器 */}
      <div ref={loadMoreRef} className="flex justify-center py-6">
        {isLoading && (
          <LoaderCircle size={18} className="animate-spin text-slate-300" />
        )}
        {!isLoading && !hasMore && members.length > 0 && (
          <span className="text-sm text-slate-400">没有更多成员了 O^O</span>
        )}
        {!isLoading && !hasMore && members.length === 0 && (
          <span className="text-xs text-slate-400">暂无成员</span>
        )}
      </div>
    </div>
  );
}
