import { useState, useEffect, useCallback } from "react";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import type { AnnouncementInfo } from "@/types/announcement";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import LoadingCircle from "@/components/ui/LoadingCircle";
import { listAnnouncements, createAnnouncement } from "@/api/announcement";
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

  return (
    <div className="mb-4">
      {/* Header */}
      <div className={clsx("flex items-center justify-between", "mb-2 px-0.5")}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-sm font-semibold text-slate-500 tracking-tight">
            当前公告
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className={clsx(
              "inline-flex items-center gap-1 px-2 py-1",
              "hover:text-slate-700 bg-slate-50 hover:bg-green-100",
              "transition-colors duration-150 focus:outline-none",
              "rounded-md",
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
          {announcements.map((ann) => (
            <button
              key={ann.id}
              onClick={() => setSelected(ann)}
              className={clsx(
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
                    {avatarChar(ann.user?.name)}
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
          <div className="fixed inset-0" onClick={() => setSelected(null)} />
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
                  "text-[10px] font-semibold text-slate-400",
                  "tracking-wide bg-slate-50 border border-slate-200",
                  "px-2 py-0.5 rounded",
                )}
              >
                公告详情
              </span>
              <button
                onClick={() => setSelected(null)}
                className={clsx(
                  "p-1 rounded hover:bg-slate-50",
                  "text-slate-400 hover:text-slate-600",
                  "transition-colors focus:outline-none",
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h2
              className={clsx(
                "text-sm font-bold text-slate-700",
                "leading-relaxed mb-3",
              )}
            >
              {selected.title}
            </h2>
            <p
              className={clsx(
                "text-xs text-slate-500 leading-relaxed",
                "whitespace-pre-wrap flex-1",
              )}
            >
              {selected.content}
            </p>
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
                  {avatarChar(selected.user?.name)}
                </span>
                {selected.user?.name ?? "未知用户"}
              </span>
              <span>{formatDate(selected.createdAt)}</span>
            </div>
          </div>
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
