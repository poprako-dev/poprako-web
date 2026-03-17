import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { PencilLine, Eye, LoaderCircle } from "lucide-react";
import type { AssignmentInfo } from "@/types/assignment";
import type { ViewMode } from "../../types/types";
import AssignmentCard from "@/features/AssignmentCard/components/business/AssignmentCard";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";

type Props = {
  mode: ViewMode;
  // 当出现错误时，错误信息会以字符串的形式返回，成功时返回 AssignmentInfo 数组
  onMyLoadAssignments: (
    offset: number,
    limit: number,
  ) => Promise<AssignmentInfo[] | string>;
  onLoadAssignments: (chapterId: string) => Promise<AssignmentInfo[] | string>;
};

// 分工列表，用于在个人工作区页部分展示用户的近期的分工信息
// 本身是一个使用 page guard 实现无限下滑加载的组件，分工卡片的展示交由 AssignmentCard 组件负责
export default function AssignmentList({
  mode,
  onMyLoadAssignments,
  onLoadAssignments,
}: Props) {
  const [currentMode, setCurrentMode] = useState<ViewMode>(mode);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToastStore();

  const loadAssignments = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const result = await onMyLoadAssignments(offset, 10);
      if (typeof result === "string") {
        console.error("Failed to load assignments: ", result);
        showToast(result, "error");
        setHasMore(false);
      } else {
        if (result.length < 10) {
          setHasMore(false);
        }
        setAssignments((prev) => [...prev, ...result]);
        setOffset((prev) => prev + result.length);
      }
    } catch (err) {
      console.error(err);
      showToast("发生未知错误", "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, onMyLoadAssignments, showToast]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.isIntersecting) {
          loadAssignments();
        }
      },
      { root: scrollContainerRef.current },
    );
    observerRef.current.observe(loadMoreRef.current);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadAssignments]);

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode);
  };

  const handleCardClick = (id: string) => {
    console.log(`Clicked assignment card ${id}`);
  };

  // 包装 onLoadAssignments：统一处理错误字符串，toast 提示后返回空数组
  const handleLoadReviewerAssignments = async (
    chapterId: string,
  ): Promise<AssignmentInfo[]> => {
    const result = await onLoadAssignments(chapterId);
    if (typeof result === "string") {
      console.error("Failed to load chapter assignments: ", result);
      showToast(result, "error");
      return [];
    }
    return result;
  };

  return (
    <div
      className={clsx("w-full h-full min-h-0 flex flex-col overflow-hidden")}
    >
      <div className={clsx("flex items-center justify-between shrink-0 pb-4")}>
        <h2 className={clsx("text-lg font-semibold text-slate-800")}>
          当前参加任务
        </h2>
        <div className={clsx("flex bg-slate-100 p-1 rounded-md")}>
          <button
            type="button"
            onClick={() => handleModeChange("translator")}
            className={clsx(
              "px-3 py-1.5 rounded-sm transition-colors flex items-center gap-2",
              currentMode === "translator"
                ? "bg-white shadow-sm text-slate-800 font-medium"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
            )}
          >
            <PencilLine size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("reviewer")}
            className={clsx(
              "px-3 py-1.5 rounded-sm transition-colors flex items-center gap-2",
              currentMode === "reviewer"
                ? "bg-white shadow-sm text-slate-800 font-medium"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
            )}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className={clsx("flex-1 min-h-0 overflow-y-auto overflow-x-hidden")}
      >
        <div
          className={clsx(
            "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 w-full justify-start items-start",
          )}
        >
          {assignments.map((assignment) =>
            currentMode === "translator" ? (
              <AssignmentCard
                key={assignment.id}
                assignmentInfo={assignment}
                mode="translator"
                onClick={() => handleCardClick(assignment.id)}
              />
            ) : (
              <AssignmentCard
                key={assignment.id}
                assignmentInfo={assignment}
                mode="reviewer"
                onClick={() => handleCardClick(assignment.id)}
                onLoadAssignments={handleLoadReviewerAssignments}
              />
            ),
          )}
        </div>
        <div
          ref={loadMoreRef}
          className={clsx("w-full flex justify-center py-4 h-16 items-center")}
        >
          {isLoading && (
            <LoaderCircle
              className={clsx("h-8 w-8 text-blue-300 animate-spin")}
            />
          )}
          {!hasMore && assignments.length > 0 && (
            <span className={clsx("text-slate-400 text-sm")}>没有更多数据</span>
          )}
        </div>
      </div>
    </div>
  );
}
