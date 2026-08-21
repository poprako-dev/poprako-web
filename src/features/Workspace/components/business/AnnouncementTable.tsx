import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, X } from "lucide-react";
import clsx from "clsx";
import type { AnnouncementInfo } from "@/types/announcement";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import LoadingCircle from "@/components/ui/LoadingCircle";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "@/api/announcement";
import AnnouncementCreatorModal from "./AnnouncementCreatorModal";

type Props = {
  teamId: string;
  teamName: string;
  isAdmin: boolean;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function avatarChar(name: string | undefined): string {
  return name ? name.charAt(0) : "?";
}

export default function AnnouncementTable({
  teamId,
  teamName,
  isAdmin,
}: Props) {
  const { showToast } = useToastStore();
  const [announcements, setAnnouncements] = useState<AnnouncementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnnouncementInfo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listAnnouncements({ teamId, offset: 0, limit: 3 });
    setLoading(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 加载公告失败:", result.error);
      showToast("加载公告失败", "error");
      return;
    }
    setAnnouncements(result.data.slice(0, 3));
  }, [teamId, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSubmit = useCallback(
    async (args: { title: string; content: string }) => {
      const result = await createAnnouncement({
        teamId,
        title: args.title,
        content: args.content,
      });
      if (!result.success) {
        console.error("[AnnouncementTable] 发布公告失败:", result.error);
        showToast("发布公告失败", "error");
        return result;
      }
      await load();
      return result;
    },
    [teamId, showToast, load],
  );

  const handleOpenDetail = (announcement: AnnouncementInfo) => {
    setSelected(announcement);
    setIsEditing(false);
    setIsDeleteConfirmOpen(false);
  };

  const handleCloseDetail = () => {
    setSelected(null);
    setIsEditing(false);
    setIsDeleteConfirmOpen(false);
  };

  const handleStartEditing = () => {
    if (!selected) return;
    setDraft({ title: selected.title, content: selected.content });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) return;

    setIsSaving(true);
    const result = await updateAnnouncement(selected.id, { title, content });
    setIsSaving(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 修改公告失败:", result.error);
      showToast("修改公告失败", "error");
      return;
    }

    const updatedAnnouncement = { ...selected, title, content };
    setSelected(updatedAnnouncement);
    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === updatedAnnouncement.id
          ? updatedAnnouncement
          : announcement,
      ),
    );
    setIsEditing(false);
    await load();
  };

  const handleDelete = async () => {
    if (!selected) return;

    setIsDeleting(true);
    const result = await deleteAnnouncement(selected.id);
    setIsDeleting(false);
    if (!result.success) {
      console.error("[AnnouncementTable] 删除公告失败:", result.error);
      showToast("删除公告失败", "error");
      return;
    }

    handleCloseDetail();
    await load();
  };

  const isDraftDirty =
    selected !== null &&
    (draft.title !== selected.title || draft.content !== selected.content);
  const isDraftValid = draft.title.trim().length > 0 && draft.content.trim().length > 0;
  const canPublish = isDraftDirty && isDraftValid && !isSaving;

  return (
    <div className="mb-4">
      {/* Header */}
      <div className={clsx("flex items-center justify-between", "mb-2 px-0.5")}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
          <span className="text-sm font-semibold text-slate-500 tracking-tight">
            当前公告
          </span>
        </div>
        <div className="flex-1 mx-2 h-0.5 bg-slate-200" />
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className={clsx(
              "inline-flex items-center gap-1 px-2 py-1",
              "hover:text-slate-700 bg-slate-50 hover:bg-green-100",
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
        <div className="flex items-center justify-center h-24 text-slate-400">
          <LoadingCircle size={18} />
        </div>
      ) : announcements.length === 0 ? (
        <div
          className={clsx(
            "flex items-center justify-center h-20",
            "text-xs text-slate-300 border border-dashed",
            "border-slate-200 rounded-md",
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
            "border border-slate-200 rounded-md overflow-hidden",
            "divide-y sm:divide-y-0 sm:divide-x divide-slate-100",
          )}
        >
          {announcements.map((ann, i) => (
            <button
              key={ann.id}
              onClick={() => handleOpenDetail(ann)}
              className={clsx(
                i > 0 && "hidden sm:block",
                "group w-full text-left px-3 py-2.5",
                "flex flex-col justify-between",
                "hover:bg-slate-50/60 transition-colors duration-150",
                "focus:outline-none",
              )}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <h3
                    className={clsx(
                      "text-base font-bold text-slate-600",
                      "group-hover:text-slate-800 transition-colors",
                      "line-clamp-2 leading-snug flex-1",
                    )}
                  >
                    {ann.title}
                  </h3>
                  <div
                    className={clsx(
                      "shrink-0 w-6 h-6 rounded",
                      "border border-slate-200 bg-slate-50",
                      "flex items-center justify-center",
                      "text-[10px] font-bold text-slate-500",
                    )}
                  >
                    {ann.user?.avatarThumbnailUrl ? (
                      <img
                        src={ann.user.avatarThumbnailUrl}
                        alt={`${ann.user.name} 的头像`}
                        className="w-full h-full object-cover rounded-[inherit]"
                      />
                    ) : (
                      avatarChar(ann.user?.name)
                    )}
                  </div>
                </div>
                <p
                  className={clsx(
                    "text-sm text-slate-400 leading-snug",
                    "line-clamp-2 group-hover:text-slate-500",
                    "transition-colors",
                  )}
                >
                  {ann.content}
                </p>
              </div>
              <div
                className={clsx(
                  "mt-2 pt-1.5 border-t border-dashed border-slate-100",
                  "flex items-center justify-between",
                )}
              >
                <span className="text-[10px] text-slate-400/60 font-mono">
                  {formatDate(ann.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div
          className={clsx(
            "fixed inset-0 z-50 flex justify-end",
            "bg-black/5 backdrop-blur-[1px]",
          )}
        >
          <div className="fixed inset-0" onClick={handleCloseDetail} />
          <div
            className={clsx(
              "relative w-full max-w-xs bg-stone-50 h-full",
              "border-l border-slate-200 p-5",
              "flex flex-col shadow-sm",
              "animate-in slide-in-from-right duration-200",
            )}
          >
            <div className="flex justify-between items-start mb-5">
              <span
                className={clsx(
                  "text-[10px] font-semibold text-slate-300",
                  "tracking-wide bg-slate-50",
                  "px-0 py-1 rounded italic",
                )}
              >
                ANNOUNCEMENT DETAIL
              </span>
              <button
                onClick={handleCloseDetail}
                className={clsx(
                  "p-1 rounded hover:bg-slate-50",
                  "text-slate-400 hover:text-slate-600",
                  "transition-colors focus:outline-none",
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isEditing ? (
              <textarea
                aria-label="公告标题"
                rows={2}
                className={clsx(
                  "w-full resize-none rounded-md px-2 py-1.5 mb-3",
                  "text-sm font-bold text-slate-700 leading-relaxed",
                  "border border-slate-200 bg-white",
                  "focus:border-slate-300 focus:outline-none",
                )}
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
              />
            ) : (
              <h2
                className={clsx(
                  "text-sm font-bold text-slate-700",
                  "leading-relaxed mb-3",
                )}
              >
                {selected.title}
              </h2>
            )}
            {isEditing ? (
              <textarea
                aria-label="公告内容"
                className={clsx(
                  "w-full flex-1 min-h-24 resize-none rounded-md px-2 py-1.5",
                  "text-xs text-slate-500 leading-relaxed",
                  "border border-slate-200 bg-white",
                  "focus:border-slate-300 focus:outline-none",
                )}
                value={draft.content}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, content: event.target.value }))
                }
              />
            ) : (
              <p
                className={clsx(
                  "text-xs text-slate-500 leading-relaxed",
                  "whitespace-pre-wrap flex-1",
                )}
              >
                {selected.content}
              </p>
            )}
            <div
              className={clsx(
                "pt-3 border-t border-slate-100",
                "flex items-center justify-between",
                "text-[10px] text-slate-400 font-mono",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "w-4 h-4 rounded border border-slate-200",
                    "bg-slate-50 flex items-center justify-center",
                    "text-[9px] font-bold text-slate-500",
                  )}
                >
                  {selected.user?.avatarThumbnailUrl ? (
                    <img
                      src={selected.user.avatarThumbnailUrl}
                      alt={`${selected.user.name} 的头像`}
                      className="w-full h-full object-cover rounded-[inherit]"
                    />
                  ) : (
                    avatarChar(selected.user?.name)
                  )}
                </span>
                {selected.user?.name ?? "未知用户"}
              </span>
              <span>{formatDate(selected.createdAt)}</span>
            </div>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (isEditing) {
                      handleCancelEditing();
                      return;
                    }
                    setIsDeleteConfirmOpen(true);
                  }}
                  className={clsx(
                    "flex-1 py-2 text-xs font-semibold rounded-lg",
                    "transition-all duration-200 active:scale-[0.98]",
                    isEditing
                      ? [
                          "text-slate-400 bg-slate-50 hover:bg-slate-100",
                          "border border-slate-100",
                        ]
                      : [
                          "text-red-500 bg-red-50 hover:bg-red-100",
                          "border border-(--color-border-red-200)",
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
                      ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
                      : [
                          "bg-green-50 text-green-500 hover:bg-green-100",
                          "border border-(--color-border-green-200)",
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
              onCancel={() => setIsDeleteConfirmOpen(false)}
            />
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <AnnouncementCreatorModal
          teamName={teamName}
          onSubmit={handleSubmit}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
