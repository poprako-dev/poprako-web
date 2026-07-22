import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Mail } from "lucide-react";
import clsx from "clsx";
import { listSysMails, markSysMailRead } from "@/api/sysMail";
import type { SysMailInfo } from "@/types/sysMail";
import LoadingCircle from "@/components/ui/LoadingCircle";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useAppStore } from "@/store/app";

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
  const setSysMailCache = useAppStore((s) => s.setSysMailCache);
  const markSysMailCacheRead = useAppStore((s) => s.markSysMailCacheRead);

  const [items, setItems] = useState<SysMailInfo[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [cutoff, setCutoff] = useState(() => Date.now() - THREE_DAYS_MS);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const showToast = useToastStore((s) => s.showToast);

  // always refresh from offset 0 on mount — never rely on stale cache
  const refreshAll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);
    setLoadedOnce(false);

    const result = await listSysMails(0, PAGE_SIZE + 1);
    isFetchingRef.current = false;
    setIsFetching(false);

    if (!result.success) {
      showToast(result.error, "error");
      console.error("[SystemMailViewer] refreshAll:", result.error);
      setLoadedOnce(true);
      return;
    }

    const batch = result.data.slice(0, PAGE_SIZE);
    const nextHasMore = result.data.length > PAGE_SIZE;

    setItems(batch);
    offsetRef.current = batch.length;
    setHasMore(nextHasMore);
    setLoadedOnce(true);
    setCutoff(Date.now() - THREE_DAYS_MS);
    setSysMailCache({ mails: batch, hasMore: nextHasMore });
  }, [showToast, setSysMailCache]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);

    const result = await listSysMails(offsetRef.current, PAGE_SIZE + 1);
    isFetchingRef.current = false;
    setIsFetching(false);

    if (!result.success) {
      showToast(result.error, "error");
      console.error("[SystemMailViewer] fetchMore:", result.error);
      return;
    }

    const batch = result.data.slice(0, PAGE_SIZE);
    const nextHasMore = result.data.length > PAGE_SIZE;

    setItems((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev, ...batch.filter((m) => !seen.has(m.id))];
      setSysMailCache({ mails: merged, hasMore: nextHasMore });
      return merged;
    });
    offsetRef.current += batch.length;
    setHasMore(nextHasMore);
  }, [showToast, setSysMailCache]);

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
    markSysMailCacheRead(sysMailId);
  };

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
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div className="relative pl-7">
            {recentItems.length > 0 && (
              <>
                <SectionLabel label="近三天" hasTopMargin={false} />
                {recentItems.map((mail, i) => (
                  <MailItem
                    key={mail.id}
                    mail={mail}
                    onMarkRead={handleMarkRead}
                    isLast={
                      i === recentItems.length - 1 &&
                      olderItems.length === 0
                    }
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
                {olderItems.map((mail, i) => (
                  <MailItem
                    key={mail.id}
                    mail={mail}
                    onMarkRead={handleMarkRead}
                    isLast={i === olderItems.length - 1}
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
        "relative",
        hasTopMargin && "mt-3",
      )}
    >
      {/* dot — vertically centered with section text */}
      <div className="absolute -left-4.75 top-1/2 -translate-y-1/2 w-2.75 h-2.75 rounded-full border-2 border-stone-300 bg-[#FEFDF9] z-10" />
      {/* line from below-dot to bottom, connecting to next items */}
      <div className="absolute -left-3.5 top-[calc(50%+6px)] bottom-0 w-px bg-stone-200" />
      <span className="block py-2 text-md font-semibold text-stone-500">
        {label}
      </span>
    </div>
  );
}

type MailItemProps = {
  mail: SysMailInfo;
  onMarkRead: (id: string) => void;
  isLast: boolean;
};

function MailItem({ mail, onMarkRead, isLast }: MailItemProps) {
  return (
    <div
      className={clsx(
        "relative pb-5 group",
        "transition-colors duration-200",
      )}
    >
      {/* per-item timeline spine: gap → dot → gap → line */}
      <div className="absolute -left-4.75 top-0 bottom-0 w-2.5 flex flex-col items-center">
        {/* gap above dot — creates visual break from previous line */}
        <div className="h-2 shrink-0" />
        {/* dot */}
        <div
          className={clsx(
            "w-2.5 h-2.5 rounded-full shrink-0 z-10",
            "transition-colors duration-300",
            !mail.read
              ? "bg-green-500"
              : "border-2 border-stone-300 bg-[#FEFDF9]",
          )}
        />
        {/* gap below dot — clean break before line */}
        <div className="h-2 shrink-0" />
        {/* line segment extending down through content */}
        {!isLast && <div className="w-px flex-1 bg-stone-200" />}
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3
              className={clsx(
                "leading-snug",
                !mail.read
                  ? "text-base font-semibold text-stone-800"
                  : "text-sm font-medium text-stone-500",
              )}
            >
              {mail.title}
            </h3>
            <span className="text-xs text-stone-400 shrink-0">
              {formatMailDate(mail.createdAt)}
            </span>
          </div>
          <p
            className={clsx(
              "text-sm leading-relaxed mt-0.5",
              !mail.read ? "text-stone-600" : "text-stone-400",
            )}
          >
            {mail.content}
          </p>
        </div>

        {/* mark-read button */}
        <button
          onClick={() => onMarkRead(mail.id)}
          title={mail.read ? "已读" : "标记为已读"}
          className={clsx(
            "shrink-0 p-1.5 rounded-md mt-0.5",
            "transition-all duration-200",
            !mail.read
              ? [
                  "opacity-0 group-hover:opacity-100 max-sm:opacity-100",
                  "text-stone-400 hover:text-green-500",
                  "hover:bg-green-50",
                ]
              : "text-stone-300 cursor-default",
          )}
        >
          <Check size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
