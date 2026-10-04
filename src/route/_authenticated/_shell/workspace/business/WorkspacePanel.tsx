import { useCallback } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";
import type { JSX, TouchEventHandler } from "react";
import clsx from "clsx";
import { AnnouncementTable } from "@/route/_authenticated/_shell/workspace/business/AnnouncementTable";
import { CommentChatBox } from "@/route/_authenticated/_shell/workspace/business/CommentChatBox";
import { OnlineUserPopover } from "@/route/_authenticated/_shell/workspace/business/OnlineUserPopover";
import { ComicTranslationList } from "@/route/_authenticated/_shell/business/comic-list/ComicTranslationList";
import type { CommentInfo } from "@/route/_authenticated/_shell/workspace/business/comment/comment";
import type { OnlineUserStatus } from "@/route/_authenticated/_shell/workspace/business/online/use-online-users";
import type { UserInfo } from "@/route/business/identity/user";
import { fetchMyAssignmentComicCards } from "@/route/_authenticated/_shell/workspace/business/assignment/workspace-request";

type Props = {
  username: string;
  selectedTeamId: string | null;
  team: { id: string; name: string } | null;
  isAdmin: boolean;
  onlineCount: number;
  onlineUsers: readonly UserInfo[];
  onlineStatus: OnlineUserStatus;
  comments: CommentInfo[];
  commentsLoading: boolean;
  onSendComment: (content: string) => Promise<void>;
  mobileTab: number;
  onChangeMobileTab: (tab: number) => void;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
  onTouchEnd: TouchEventHandler<HTMLDivElement>;
  comicListRefreshKey: number;
  onComicClick: (comicId: string, chapterId?: string | null) => void;
};

export function WorkspacePanel({
  username,
  selectedTeamId,
  team,
  isAdmin,
  onlineCount,
  onlineUsers,
  onlineStatus,
  comments,
  commentsLoading,
  onSendComment,
  mobileTab,
  onChangeMobileTab,
  onTouchStart,
  onTouchEnd,
  comicListRefreshKey,
  onComicClick,
}: Props): JSX.Element {
  const client = useApiClient();
  const { userInfo } = useReadySession();
  const loadComics = useCallback(
    (offset: number, limit: number) =>
      fetchMyAssignmentComicCards(client, userInfo.id, offset, limit),
    [client, userInfo.id],
  );
  return (
    <div className={clsx("flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden")}>
      <div
        className={clsx(
          "mb-3 flex flex-col",
          "sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        )}
      >
        <div>
          {username && (
            <>
              <p className={clsx("text-md text-text-muted-cool")}>欢迎回来</p>
              <h1 className={clsx("mt-0.5 ml-1 text-3xl font-bold text-ink-slate-700")}>
                {username}
              </h1>
            </>
          )}
        </div>
        {team && (
          <OnlineUserPopover onlineCount={onlineCount} users={onlineUsers} status={onlineStatus} />
        )}
      </div>

      {!team && (
        <p className="mb-3 text-sm text-muted-foreground">
          {selectedTeamId
            ? "当前汉化组对你不可用，请选择其他汉化组。"
            : "你还没有选择汉化组。加入汉化组后，这里会显示公告和留言。"}
        </p>
      )}

      {team && (
        <AnnouncementTable key={team.id} teamId={team.id} teamName={team.name} isAdmin={isAdmin} />
      )}

      <div className={clsx("hidden md:flex", "flex-1 min-h-0 min-w-0 flex-row gap-4")}>
        <div className={clsx("flex-1 min-h-0 min-w-0 overflow-hidden", "flex flex-col")}>
          <SectionHeading label="任务列表" />
          <div className="flex-1 min-h-0 overflow-hidden">
            <ComicTranslationList
              key={comicListRefreshKey}
              onLoadComics={loadComics}
              onComicClick={onComicClick}
            />
          </div>
        </div>
        {team && (
          <div className={clsx("w-64 shrink-0 min-h-0", "flex flex-col")}>
            <SectionHeading label="留言板" />
            <div
              className={clsx(
                "flex-1 min-h-0",
                "rounded-md border border-border/50",
                "overflow-hidden",
              )}
            >
              <CommentChatBox
                comments={comments}
                loading={commentsLoading}
                onSend={onSendComment}
              />
            </div>
          </div>
        )}
      </div>

      {team && (
        <div className="md:hidden flex-1 min-h-0 min-w-0 flex flex-col">
          <div className={clsx("flex items-center gap-4 px-1 mb-2 shrink-0")}>
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
          <div
            className="flex-1 min-h-0 overflow-hidden relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="absolute inset-0 h-full overflow-y-auto"
              style={{ visibility: mobileTab === 0 ? "visible" : "hidden" }}
            >
              <ComicTranslationList
                key={comicListRefreshKey}
                onLoadComics={loadComics}
                onComicClick={onComicClick}
              />
            </div>
            <div
              className="absolute inset-0 h-full"
              style={{ visibility: mobileTab === 1 ? "visible" : "hidden" }}
            >
              <div
                className={clsx("h-full", "rounded-md border border-border/50", "overflow-hidden")}
              >
                <CommentChatBox
                  comments={comments}
                  loading={commentsLoading}
                  onSend={onSendComment}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ label }: { label: "任务列表" | "留言板" }): JSX.Element {
  return (
    <div className={clsx("flex items-center gap-2 px-1 mb-2 shrink-0")}>
      <span className="w-1.5 h-1.5 rounded-full bg-surface-slate-300 shrink-0" />
      <span className="text-sm font-semibold text-text-muted-cool tracking-tight">{label}</span>
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
    <button type="button" onClick={onClick} className="flex items-center gap-2">
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
