import { type JSX, useCallback, useEffect, useRef, useState } from "react";
import { Check, Mail, RotateCw } from "lucide-react";
import clsx from "clsx";
import { useApiClient } from "@/route/business/api-context";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { SysMailInfo } from "@/api/system-mail";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useMailStore } from "@/route/_authenticated/_shell/business/mail/mail-store";

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

export function SystemMailViewer(): JSX.Element {
  const client = useApiClient();
  const mails = useMailStore((state) => state.mails);
  const hasMore = useMailStore((state) => state.hasMore);
  const loadState = useMailStore((state) => state.loadState);
  const loadError = useMailStore((state) => state.loadError);
  const isLoadingMore = useMailStore((state) => state.isLoadingMore);
  const loadMoreError = useMailStore((state) => state.loadMoreError);
  const loadInitial = useMailStore((state) => state.loadInitial);
  const loadMore = useMailStore((state) => state.loadMore);
  const markRead = useMailStore((state) => state.markRead);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [cutoff] = useState(() => Date.now() - THREE_DAYS_MS);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (loadState === "idle") {
      void loadInitial(client, PAGE_SIZE);
    }
  }, [client, loadInitial, loadState]);

  const fetchMore = useCallback(async () => {
    const result = await loadMore(client, PAGE_SIZE);
    if (!result.success) showLocalApiFailure(result, showToast);
  }, [client, loadMore, showToast]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (hasMore && loadMoreError === null && entries[0]?.isIntersecting) void fetchMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMoreError, fetchMore]);

  const handleMarkRead = async (sysMailId: string): Promise<void> => {
    const result = await markRead(client, sysMailId);
    if (!result.success) {
      showLocalApiFailure(result, showToast);
      console.error("[SystemMailViewer] markSysMailRead:", result.error);
      return;
    }
    showToast("已标记为已读", "success");
  };

  const recentItems = mails.filter((m) => m.createdAt >= cutoff);
  const olderItems = mails.filter((m) => m.createdAt < cutoff);

  return (
    <div className="w-full h-full flex flex-col pt-2">
      {loadState === "error" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Mail size={28} className="text-muted-foreground" />
          <p className="text-sm text-destructive">{loadError ?? "系统消息加载失败"}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
            onClick={() => {
              void loadInitial(client, PAGE_SIZE);
            }}
          >
            <RotateCw size={14} aria-hidden="true" />
            重试
          </button>
        </div>
      ) : loadState === "idle" || loadState === "loading" ? (
        <div className="flex justify-center py-12">
          <LoadingCircle size={32} />
        </div>
      ) : mails.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Mail size={28} className="text-icon-muted-cool" />
          <p className="text-sm text-text-muted-cool">暂无系统消息</p>
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
                    onMarkRead={(id) => {
                      void handleMarkRead(id);
                    }}
                    isLast={i === recentItems.length - 1 && olderItems.length === 0}
                  />
                ))}
              </>
            )}
            {olderItems.length > 0 && (
              <>
                <SectionLabel label="更久以前" hasTopMargin={recentItems.length > 0} />
                {olderItems.map((mail, i) => (
                  <MailItem
                    key={mail.id}
                    mail={mail}
                    onMarkRead={(id) => {
                      void handleMarkRead(id);
                    }}
                    isLast={i === olderItems.length - 1}
                  />
                ))}
              </>
            )}
          </div>

          {/* infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <LoadingCircle size={20} />
            </div>
          )}
          {loadMoreError !== null && (
            <div className="flex flex-col items-center gap-2 py-3">
              <p className="text-xs text-destructive">更早的消息加载失败</p>
              <button
                type="button"
                className="text-sm text-primary-text underline-offset-2 hover:underline"
                onClick={() => {
                  void fetchMore();
                }}
              >
                重试
              </button>
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

function SectionLabel({ label, hasTopMargin }: SectionLabelProps): JSX.Element {
  return (
    <div className={clsx("relative", hasTopMargin && "mt-3")}>
      {/* dot — vertically centered with section text */}
      <div
        className={clsx(
          "absolute -left-4.75 top-1/2 -translate-y-1/2 w-2.75 h-2.75 rounded-full",
          "border-2 border-line-stone-300 bg-page-paper z-10",
        )}
      />
      {/* line from below-dot to bottom, connecting to next items */}
      <div className="absolute -left-3.5 top-[calc(50%+6px)] bottom-0 w-px bg-surface-stone-200" />
      <span className="block py-2 text-md font-semibold text-ink-stone-500">{label}</span>
    </div>
  );
}

type MailItemProps = {
  mail: SysMailInfo;
  onMarkRead: (id: string) => void;
  isLast: boolean;
};

function MailItem({ mail, onMarkRead, isLast }: MailItemProps): JSX.Element {
  return (
    <div className={clsx("relative pb-5 group", "transition-colors duration-200")}>
      {/* per-item timeline spine: gap → dot → gap → line */}
      <div className="absolute -left-4.75 top-0 bottom-0 w-2.5 flex flex-col items-center">
        {/* gap above dot — creates visual break from previous line */}
        <div className="h-2 shrink-0" />
        {/* dot */}
        <div
          className={clsx(
            "w-2.5 h-2.5 rounded-full shrink-0 z-10",
            "transition-colors duration-300",
            mail.isRead ? "border-2 border-line-stone-300 bg-page-paper" : "bg-surface-green-500",
          )}
        />
        {/* gap below dot — clean break before line */}
        <div className="h-2 shrink-0" />
        {/* line segment extending down through content */}
        {!isLast && <div className="w-px flex-1 bg-surface-stone-200" />}
      </div>

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3
              className={clsx(
                "leading-snug",
                mail.isRead
                  ? "text-sm font-medium text-ink-stone-500"
                  : "text-base font-semibold text-ink-stone-800",
              )}
            >
              {mail.title}
            </h3>
            <span className="text-xs text-text-muted-warm shrink-0">
              {formatMailDate(mail.createdAt)}
            </span>
          </div>
          <p
            className={clsx(
              "text-sm leading-relaxed mt-0.5",
              mail.isRead ? "text-text-muted-warm" : "text-ink-stone-600",
            )}
          >
            {mail.content}
          </p>
        </div>

        {/* mark-read button */}
        <button
          type="button"
          onClick={() => {
            onMarkRead(mail.id);
          }}
          title={mail.isRead ? "已读" : "标记为已读"}
          className={clsx(
            "shrink-0 p-1.5 rounded-md mt-0.5",
            "transition-all duration-200",
            mail.isRead
              ? "text-text-muted-warm cursor-default"
              : [
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
                  "text-text-muted-warm hover:text-text-leaf",
                  "hover:bg-surface-green-50",
                ],
          )}
        >
          <Check size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
