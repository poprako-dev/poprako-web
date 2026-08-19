import { Fragment, useEffect, useRef } from "react";
import clsx from "clsx";
import { CircleAlert, History } from "lucide-react";
import LoadingCircle from "@/components/ui/LoadingCircle";
import type { ChapterWorkflowRecord } from "@/types/chapterWorkflowRecord";
import type {
  WorkflowRecordState,
} from "../../hook/useComicDetailWorkflowRecords";
import {
  formatWorkflowRecordTime,
  presentWorkflowRecordEvent,
  type WorkflowRecordTextPart,
} from "../../workflowRecord";

type Props = {
  chapterId: string | null;
  state: WorkflowRecordState;
  getUserLabel: (userId: string) => string;
  onLoadMore: () => void;
};

type RecordItemProps = {
  record: ChapterWorkflowRecord;
  getUserLabel: Props["getUserLabel"];
};

type TextPartsProps = {
  parts: WorkflowRecordTextPart[];
};

function TextParts({ parts }: TextPartsProps) {
  return parts.map((part, index) => (
    <Fragment key={`${index}-${part.text}`}>
      {part.variable ? (
        <span
          data-workflow-variable="true"
          className={clsx(
            "underline decoration-stone-400 decoration-1",
            "underline-offset-4",
          )}
        >
          {part.text}
        </span>
      ) : part.text}
    </Fragment>
  ));
}

function RecordItem({ record, getUserLabel }: RecordItemProps) {
  const presentation = presentWorkflowRecordEvent(record.event, getUserLabel);
  const actor = record.actorUserId
    ? getUserLabel(record.actorUserId)
    : "系统";
  const time = formatWorkflowRecordTime(record.createdAt);

  return (
    <li className="group/record relative py-2.5 pl-5">
      <span
        aria-hidden="true"
        className={clsx(
          "absolute left-0 top-4 h-1.5 w-1.5 rounded-full bg-stone-300",
          "transition-colors group-hover/record:bg-stone-400",
        )}
      />
      <p className="text-sm font-normal leading-6 text-stone-600">
        <span className="text-[15px] font-semibold text-stone-800">
          <TextParts parts={presentation.title} />：
        </span>
        <span> </span>
        <span
          data-workflow-variable="true"
          className={clsx(
            "underline decoration-stone-400 decoration-1",
            "underline-offset-4",
          )}
        >
          {actor}
        </span>
        <span> </span>
        <TextParts parts={presentation.detail} />
        <time
          dateTime={new Date(record.createdAt).toISOString()}
          className="ml-2 whitespace-nowrap text-xs text-stone-400"
        >
          · {time}
        </time>
      </p>
    </li>
  );
}

export default function WorkflowRecordList({
  chapterId,
  state,
  getUserLabel,
  onLoadMore,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (
      !root ||
      !sentinel ||
      !state.hasMore ||
      state.isLoadingMore ||
      state.loadMoreError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root, rootMargin: "0px 0px 120px", threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, state.hasMore, state.isLoadingMore, state.loadMoreError]);

  if (!chapterId) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-2"
      >
        <History size={26} className="text-stone-300" />
        <p className="text-sm text-stone-400">选择章节后查看活动记录</p>
      </div>
    );
  }

  if (state.isLoading && !state.loadedOnce) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingCircle size={22} aria-label="正在加载活动记录" />
      </div>
    );
  }

  if (state.error && state.records.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <CircleAlert size={24} className="text-stone-300" />
        <p className="text-sm text-stone-400">活动记录加载失败</p>
      </div>
    );
  }

  if (state.loadedOnce && state.records.length === 0) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-2"
      >
        <History size={26} className="text-stone-300" />
        <p className="text-sm text-stone-400">暂无活动记录</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={clsx(
        "h-full overflow-y-auto px-5 py-3 sm:px-7",
        "scrollbar-thin scrollbar-thumb-stone-300",
      )}
    >
      <div className="mx-auto w-full max-w-180">
        {state.error && (
          <p className="mb-4 text-xs text-stone-400">最新记录刷新失败</p>
        )}

        <ol>
          {state.records.map((record) => (
            <RecordItem
              key={record.id}
              record={record}
              getUserLabel={getUserLabel}
            />
          ))}
        </ol>

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
        {state.isLoadingMore && (
          <div className="flex justify-center py-4">
            <LoadingCircle size={20} aria-label="正在加载更早记录" />
          </div>
        )}
        {state.loadMoreError && (
          <p className="py-4 text-center text-xs text-stone-400">
            更早记录加载失败
          </p>
        )}
      </div>
    </div>
  );
}
