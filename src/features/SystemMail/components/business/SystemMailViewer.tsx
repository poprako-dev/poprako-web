import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Check, Mail } from "lucide-react";
import clsx from "clsx";
import { listSysMails, markSysMailRead } from "@/api/sysMail";
import type { SysMailInfo } from "@/types/sysMail";
import LoadingCircle from "@/components/ui/LoadingCircle";
import { useToastStore } from "@/components/ui/NotificationToast";

const PAGE_SIZE = 15;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function formatMailDate(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SystemMailViewer() {
  const [items, setItems] = useState<SysMailInfo[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const showToast = useToastStore((s) => s.showToast);

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);

    const result = await listSysMails(offsetRef.current, PAGE_SIZE + 1);
    isFetchingRef.current = false;
    setIsFetching(false);

    if (!result.success) {
      showToast(result.error, "error");
      console.error("[SystemMailViewer] listSysMails:", result.error);
      setLoadedOnce(true);
      return;
    }

    const batch = result.data.slice(0, PAGE_SIZE);
    const nextHasMore = result.data.length > PAGE_SIZE;

    setItems((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...batch.filter((m) => !seen.has(m.id))];
    });
    offsetRef.current += batch.length;
    setHasMore(nextHasMore);
    setLoadedOnce(true);
  }, [showToast]);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) fetchMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchMore]);

  const handleMarkRead = async (sysMailId: string) => {
    const result = await markSysMailRead(sysMailId);
    if (!result.success) {
      showToast(result.error, "error");
      console.error("[SystemMailViewer] markSysMailRead:", result.error);
      return;
    }
    showToast("已标记为已读", "success");
    setItems((prev) =>
      prev.map((m) => (m.id === sysMailId ? { ...m, read: true } : m)),
    );
  };

  // eslint-disable-next-line react-hooks/purity
  const cutoff = useMemo(() => Date.now() - THREE_DAYS_MS, []);
  const recentItems = items.filter((m) => m.createdAt >= cutoff);
  const olderItems = items.filter((m) => m.createdAt < cutoff);

  return (
    <div className="w-full h-full flex flex-col pt-2">
      {!loadedOnce ? (
        <div className="flex justify-center py-12">
          <LoadingCircle size={32} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Mail size={28} className="text-slate-300" />
          <p className="text-sm text-slate-400">暂无系统消息</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col pt-32">
            {recentItems.length > 0 && (
              <>
                <SectionLabel label="近三天" hasTopMargin={false} />
                {recentItems.map((mail) => (
                  <MailItem
                    key={mail.id}
                    mail={mail}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </>
            )}
            {olderItems.length > 0 && (
              <>
                <SectionLabel
                  label="更久以前"
                  hasTopMargin={recentItems.length > 0}
                />
                {olderItems.map((mail) => (
                  <MailItem
                    key={mail.id}
                    mail={mail}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </>
            )}
          </div>

          {/* infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetching && loadedOnce && (
            <div className="flex justify-center py-3">
              <LoadingCircle size={20} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type SectionLabelProps = {
  label: string;
  hasTopMargin: boolean;
};

function SectionLabel({ label, hasTopMargin }: SectionLabelProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 py-2 mb-1",
        hasTopMargin && "mt-4",
      )}
    >
      <span className="text-xs font-semibold text-slate-400 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

type MailItemProps = {
  mail: SysMailInfo;
  onMarkRead: (id: string) => void;
};

function MailItem({ mail, onMarkRead }: MailItemProps) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-sm px-3 py-3.5 border-l-2",
        "transition-colors duration-200",
        !mail.read
          ? [
              "bg-[var(--color-green-50)]",
              "border-l-[var(--color-green-500)]",
            ]
          : "bg-transparent hover:bg-slate-50 border-l-transparent",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!mail.read && (
            <div
              className={clsx(
                "h-1.5 w-1.5 rounded-full shrink-0",
                "bg-[var(--color-green-500)]",
              )}
            />
          )}
          <h3
            className={clsx(
              "text-sm truncate",
              !mail.read
                ? "font-semibold text-slate-800"
                : "font-medium text-slate-500",
            )}
          >
            {mail.title}
          </h3>
          <span className="text-[10px] text-slate-400 ml-auto shrink-0">
            {formatMailDate(mail.createdAt)}
          </span>
        </div>
        <p
          className={clsx(
            "text-[13px] leading-relaxed line-clamp-2",
            !mail.read ? "text-slate-600" : "text-slate-400",
          )}
        >
          {mail.content}
        </p>
      </div>
      {!mail.read && (
        <button
          onClick={() => onMarkRead(mail.id)}
          title="标记为已读"
          className={clsx(
            "flex-shrink-0 p-2 rounded-lg",
            "transition-all duration-200",
            "text-slate-400 hover:text-[var(--color-green-500)]",
            "hover:bg-green-50/80",
          )}
        >
          <Check size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

