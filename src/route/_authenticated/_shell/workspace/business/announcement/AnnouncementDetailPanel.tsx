import type { Dispatch, JSX, SetStateAction } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import type { AnnouncementInfo } from "./announcement";
import type { AnnouncementDraft } from "./use-announcement";
import { formatAnnouncementDate } from "./announcement-date";

type Props = {
  announcement: AnnouncementInfo;
  isAdmin: boolean;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  draft: AnnouncementDraft;
  setDraft: Dispatch<SetStateAction<AnnouncementDraft>>;
  isSaving: boolean;
  canPublish: boolean;
  onRequestDelete: () => void;
  onStartEditing: () => void;
  onUpdate: () => void;
};

export function AnnouncementDetailPanel({
  announcement,
  isAdmin,
  isEditing,
  setIsEditing,
  draft,
  setDraft,
  isSaving,
  canPublish,
  onRequestDelete,
  onStartEditing,
  onUpdate,
}: Props): JSX.Element {
  return (
    <>
      <AnnouncementTitle
        announcement={announcement}
        isEditing={isEditing}
        draft={draft}
        setDraft={setDraft}
      />
      <AnnouncementContent
        announcement={announcement}
        isEditing={isEditing}
        draft={draft}
        setDraft={setDraft}
      />
      <AnnouncementMetadata announcement={announcement} />
      {isAdmin && (
        <AnnouncementActions
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSaving={isSaving}
          canPublish={canPublish}
          onRequestDelete={onRequestDelete}
          onStartEditing={onStartEditing}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

function AnnouncementTitle({
  announcement,
  isEditing,
  draft,
  setDraft,
}: Pick<Props, "announcement" | "isEditing" | "draft" | "setDraft">): JSX.Element {
  if (!isEditing) {
    return (
      <h2 className={clsx("text-sm font-bold text-ink-slate-700", "leading-relaxed mb-3")}>
        {announcement.title}
      </h2>
    );
  }
  return (
    <textarea
      aria-label="公告标题"
      rows={2}
      className={clsx(
        "w-full resize-none rounded-md px-2 py-1.5 mb-3",
        "text-sm font-bold text-ink-slate-700 leading-relaxed",
        "border border-control-border bg-surface-white",
        "focus:border-line-slate-300 focus:outline-none",
      )}
      value={draft.title}
      onChange={(event) => {
        setDraft((current) => ({ ...current, title: event.target.value }));
      }}
    />
  );
}

function AnnouncementContent({
  announcement,
  isEditing,
  draft,
  setDraft,
}: Pick<Props, "announcement" | "isEditing" | "draft" | "setDraft">): JSX.Element {
  if (!isEditing) {
    return (
      <p
        className={clsx(
          "text-xs text-text-muted-cool leading-relaxed",
          "whitespace-pre-wrap flex-1",
        )}
      >
        {announcement.content}
      </p>
    );
  }
  return (
    <textarea
      aria-label="公告内容"
      className={clsx(
        "w-full flex-1 min-h-24 resize-none rounded-md px-2 py-1.5",
        "text-xs text-text-muted-cool leading-relaxed",
        "border border-control-border bg-surface-white",
        "focus:border-line-slate-300 focus:outline-none",
      )}
      value={draft.content}
      onChange={(event) => {
        setDraft((current) => ({ ...current, content: event.target.value }));
      }}
    />
  );
}

function AnnouncementMetadata({ announcement }: Pick<Props, "announcement">): JSX.Element {
  return (
    <div
      className={clsx(
        "pt-3 border-t border-line-slate-100",
        "flex items-center justify-between",
        "text-[10px] text-text-muted-cool font-mono",
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={clsx(
            "w-4 h-4 rounded border border-line-slate-200",
            "bg-surface-slate-50 flex items-center justify-center",
            "text-[9px] font-bold text-text-muted-cool",
          )}
        >
          {announcement.user?.avatarThumbnailUrl ? (
            <img
              src={announcement.user.avatarThumbnailUrl}
              alt={`${announcement.user.name} 的头像`}
              className="w-full h-full object-cover rounded-[inherit]"
            />
          ) : (
            (announcement.user?.name.charAt(0) ?? "?")
          )}
        </span>
        {announcement.user?.name ?? "未知用户"}
      </span>
      <span>{formatAnnouncementDate(announcement.createdAt)}</span>
    </div>
  );
}

function AnnouncementActions({
  isEditing,
  setIsEditing,
  isSaving,
  canPublish,
  onRequestDelete,
  onStartEditing,
  onUpdate,
}: Pick<
  Props,
  | "isEditing"
  | "setIsEditing"
  | "isSaving"
  | "canPublish"
  | "onRequestDelete"
  | "onStartEditing"
  | "onUpdate"
>): JSX.Element {
  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        disabled={isSaving}
        onClick={() => {
          if (isEditing) {
            setIsEditing(false);
            return;
          }
          onRequestDelete();
        }}
        className={clsx(
          "flex-1 py-2 text-xs font-semibold rounded-lg",
          "transition-all duration-200 active:scale-[0.98]",
          isEditing
            ? [
                "text-text-muted-cool bg-surface-slate-50 hover:bg-surface-slate-100",
                "border border-line-slate-100",
              ]
            : [
                "text-text-danger bg-surface-red-50 hover:bg-surface-red-100",
                "border border-(--danger-border)",
              ],
          isSaving && "opacity-60 cursor-not-allowed",
        )}
      >
        {isEditing ? "取消" : "删除"}
      </button>
      <button
        type="button"
        disabled={isEditing && !canPublish}
        onClick={() => {
          if (isEditing) {
            onUpdate();
            return;
          }
          onStartEditing();
        }}
        className={clsx(
          "flex-1 py-2 text-xs font-semibold rounded-lg",
          "flex items-center justify-center gap-1",
          "transition-all duration-200 active:scale-[0.98]",
          isEditing && !canPublish
            ? "bg-surface-slate-50 text-ink-slate-300 cursor-not-allowed border border-line-slate-100"
            : [
                "bg-surface-green-50 text-ink-green-500 hover:bg-surface-green-100",
                "border border-(--brand-leaf-border)",
              ],
        )}
      >
        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : isEditing ? "发布" : "修改"}
      </button>
    </div>
  );
}
