import type { JSX, TouchEventHandler } from "react";
import clsx from "clsx";
import { ComicTranslationListView } from "../../business/comic-list/ComicTranslationListView";
import type { ComicTranslationListState } from "../../business/comic-list/use-comic-translation-list";
import { CommentChatBox } from "./CommentChatBox";
import type { CommentInfo } from "./comment/comment";
import { useWorkspaceDesktop } from "./use-workspace-desktop";

type Props = {
  state: ComicTranslationListState;
  onComicClick: (comicId: string, chapterId?: string | null) => void;
  teamScope: string | null;
  comments: CommentInfo[];
  commentsLoading: boolean;
  onSendComment: (content: string) => Promise<void>;
  mobileTab: number;
  onChangeMobileTab: (tab: number) => void;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
};

export function WorkspaceContent({
  state,
  onComicClick,
  teamScope,
  comments,
  commentsLoading,
  onSendComment,
  mobileTab,
  onChangeMobileTab,
  onTouchStart,
  onTouchEnd,
}: Props): JSX.Element {
  const desktop = useWorkspaceDesktop();
  const showTasks = teamScope === null || mobileTab === 0;
  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col">
      {teamScope !== null && (
        <div className="md:hidden flex items-center gap-4 px-1 mb-2 shrink-0">
          <TabButton
            label="任务列表"
            active={mobileTab === 0}
            onClick={() => {
              onChangeMobileTab(0);
            }}
          />
          <TabButton
            label="留言板"
            active={mobileTab === 1}
            onClick={() => {
              onChangeMobileTab(1);
            }}
          />
          <div className="flex-1 h-0.5 bg-surface-stone-200" />
        </div>
      )}
      <div
        className="grid flex-1 min-h-0 min-w-0 overflow-hidden md:flex md:flex-row md:gap-4"
        onTouchStart={desktop ? undefined : onTouchStart}
        onTouchEnd={desktop ? undefined : onTouchEnd}
      >
        <div
          className={clsx(
            "col-start-1 row-start-1 flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden",
            !showTasks && "invisible md:visible",
          )}
        >
          <div className={teamScope !== null ? "hidden md:block" : undefined}>
            <SectionHeading label="任务列表" />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ComicTranslationListView
              state={state}
              onComicClick={onComicClick}
              enabled={desktop || showTasks}
            />
          </div>
        </div>
        {teamScope !== null && (
          <div
            className={clsx(
              "col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col md:w-64 md:shrink-0",
              mobileTab !== 1 && "invisible md:visible",
            )}
          >
            <div className="hidden md:block">
              <SectionHeading label="留言板" />
            </div>
            <div className="flex-1 min-h-0 rounded-md border border-border/50 overflow-hidden">
              <CommentChatBox
                key={teamScope}
                comments={comments}
                loading={commentsLoading}
                onSend={onSendComment}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ label }: { label: "任务列表" | "留言板" }): JSX.Element {
  return (
    <div className="flex items-center gap-2 px-1 mb-2 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-surface-slate-300 shrink-0" />
      <span className="text-sm font-semibold text-ink-slate-500 tracking-tight">{label}</span>
      <div
        className={clsx(
          "flex-1 h-0.5",
          label === "任务列表" ? "bg-surface-slate-200" : "bg-surface-stone-200",
        )}
      />
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-2"
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full shrink-0",
          active ? "bg-surface-slate-500" : "bg-surface-slate-300",
        )}
      />
      <span
        className={clsx(
          "text-sm font-semibold tracking-tight",
          active ? "text-ink-slate-600" : "text-text-muted-cool",
        )}
      >
        {label}
      </span>
    </button>
  );
}
