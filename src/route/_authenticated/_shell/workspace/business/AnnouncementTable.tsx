import type { JSX } from "react";
import { Loader2, Plus } from "lucide-react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { AnnouncementCreatorModal } from "@/route/_authenticated/_shell/workspace/business/AnnouncementCreatorModal";
import { AnnouncementRow } from "@/route/_authenticated/_shell/workspace/business/announcement/AnnouncementRow";
import { formatAnnouncementDate } from "@/route/_authenticated/_shell/workspace/business/announcement/announcement-date";
import { AnnouncementDetailHeader } from "@/route/_authenticated/_shell/workspace/business/announcement/AnnouncementDetailHeader";
import { useAnnouncement } from "@/route/_authenticated/_shell/workspace/business/announcement/use-announcement";

type Props = {
  teamId: string;
  teamName: string;
  isAdmin: boolean;
};

export function AnnouncementTable({ teamId, teamName, isAdmin }: Props): JSX.Element {
  const {
    announcements,
    loading,
    selected,
    showCreate,
    setShowCreate,
    isEditing,
    setIsEditing,
    draft,
    setDraft,
    isSaving,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isDeleting,
    canPublish,
    handleSubmit,
    handleOpenDetail,
    handleCloseDetail,
    handleStartEditing,
    handleUpdate,
    handleDelete,
  } = useAnnouncement({ teamId });

  return (
    <div className="mb-4">
      {/* Header */}
      <div className={clsx("flex items-center justify-between", "mb-2 px-0.5")}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
          <span className="text-sm font-semibold text-muted-foreground tracking-tight">
            当前公告
          </span>
        </div>
        <div className="flex-1 mx-2 h-0.5 bg-border" />
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setShowCreate(true);
            }}
            className={clsx(
              "inline-flex items-center gap-1 px-2 py-1",
              "hover:text-foreground bg-muted hover:bg-primary-subtle",
              "transition-colors duration-150 focus:outline-none",
              "rounded-sm",
            )}
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          <LoadingCircle size={18} />
        </div>
      ) : announcements.length === 0 ? (
        <div
          className={clsx(
            "flex items-center justify-center h-20",
            "text-xs text-muted-foreground border border-dashed",
            "border-border rounded-md",
          )}
        >
          暂无公告
        </div>
      ) : (
        <div
          className={clsx(
            announcements.length === 1
              ? "grid grid-cols-1"
              : announcements.length === 2
                ? "grid grid-cols-1 sm:grid-cols-2"
                : "grid grid-cols-1 sm:grid-cols-3",
            "border border-border rounded-md overflow-hidden",
            "divide-y sm:divide-y-0 sm:divide-x divide-border",
          )}
        >
          {announcements.map((announcement, index) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              hiddenOnMobile={index > 0}
              onOpen={handleOpenDetail}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div
          className={clsx(
            "fixed inset-0 z-50 flex justify-end",
            "bg-overlay/10 backdrop-blur-[1px]",
          )}
        >
          <button
            type="button"
            aria-label="关闭公告详情"
            className="fixed inset-0"
            onClick={handleCloseDetail}
          />
          <div
            className={clsx(
              "relative w-full max-w-xs bg-muted h-full",
              "border-l border-border p-5",
              "flex flex-col shadow-sm",
              "animate-in slide-in-from-right duration-200",
            )}
          >
            <AnnouncementDetailHeader onClose={handleCloseDetail} />
            {isEditing ? (
              <textarea
                aria-label="公告标题"
                rows={2}
                className={clsx(
                  "w-full resize-none rounded-md px-2 py-1.5 mb-3",
                  "text-sm font-bold text-foreground leading-relaxed",
                  "border border-border bg-surface-panel",
                  "focus:border-border focus:outline-none",
                )}
                value={draft.title}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }));
                }}
              />
            ) : (
              <h2 className={clsx("text-sm font-bold text-foreground", "leading-relaxed mb-3")}>
                {selected.title}
              </h2>
            )}
            {isEditing ? (
              <textarea
                aria-label="公告内容"
                className={clsx(
                  "w-full flex-1 min-h-24 resize-none rounded-md px-2 py-1.5",
                  "text-xs text-muted-foreground leading-relaxed",
                  "border border-border bg-surface-panel",
                  "focus:border-border focus:outline-none",
                )}
                value={draft.content}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    content: event.target.value,
                  }));
                }}
              />
            ) : (
              <p
                className={clsx(
                  "text-xs text-muted-foreground leading-relaxed",
                  "whitespace-pre-wrap flex-1",
                )}
              >
                {selected.content}
              </p>
            )}
            <div
              className={clsx(
                "pt-3 border-t border-border",
                "flex items-center justify-between",
                "text-[10px] text-muted-foreground font-mono",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "w-4 h-4 rounded border border-border",
                    "bg-muted flex items-center justify-center",
                    "text-[9px] font-bold text-muted-foreground",
                  )}
                >
                  {selected.user?.avatarThumbnailUrl ? (
                    <img
                      src={selected.user.avatarThumbnailUrl}
                      alt={`${selected.user.name} 的头像`}
                      className="w-full h-full object-cover rounded-[inherit]"
                    />
                  ) : (
                    (selected.user?.name.charAt(0) ?? "?")
                  )}
                </span>
                {selected.user?.name ?? "未知用户"}
              </span>
              <span>{formatAnnouncementDate(selected.createdAt)}</span>
            </div>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      return;
                    }
                    setIsDeleteConfirmOpen(true);
                  }}
                  className={clsx(
                    "flex-1 py-2 text-xs font-semibold rounded-lg",
                    "transition-all duration-200 active:scale-[0.98]",
                    isEditing
                      ? [
                          "text-muted-foreground bg-muted hover:bg-surface-hover",
                          "border border-border",
                        ]
                      : [
                          "text-destructive bg-surface-panel hover:bg-destructive/10",
                          "border border-destructive/30",
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
                      void handleUpdate();
                      return;
                    }
                    handleStartEditing();
                  }}
                  className={clsx(
                    "flex-1 py-2 text-xs font-semibold rounded-lg",
                    "flex items-center justify-center gap-1",
                    "transition-all duration-200 active:scale-[0.98]",
                    isEditing && !canPublish
                      ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      : [
                          "bg-primary-subtle text-primary-text hover:bg-primary-muted",
                          "border border-primary-border",
                        ],
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isEditing ? (
                    "发布"
                  ) : (
                    "修改"
                  )}
                </button>
              </div>
            )}
          </div>
          {isDeleteConfirmOpen && (
            <ConfirmDialog
              title="删除公告"
              description="删除后无法恢复，确定删除该公告吗？"
              confirmLabel="删除"
              loading={isDeleting}
              onConfirm={() => void handleDelete()}
              onCancel={() => {
                setIsDeleteConfirmOpen(false);
              }}
            />
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <AnnouncementCreatorModal
          teamName={teamName}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
