import type { JSX } from "react";
import clsx from "clsx";
import type { AnnouncementInfo } from "@/route/_authenticated/_shell/workspace/business/announcement/announcement";
import { formatAnnouncementDate } from "@/route/_authenticated/_shell/workspace/business/announcement/announcement-date";

type Props = {
  announcement: AnnouncementInfo;
  hiddenOnMobile: boolean;
  onOpen: (announcement: AnnouncementInfo) => void;
};

function avatarChar(name: string | undefined): string {
  return name ? name.charAt(0) : "?";
}

export function AnnouncementRow({ announcement, hiddenOnMobile, onOpen }: Props): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => {
        onOpen(announcement);
      }}
      className={clsx(
        hiddenOnMobile && "hidden sm:block",
        "group w-full text-left px-3 py-2.5",
        "flex flex-col justify-between",
        "hover:bg-surface-slate-50/60 transition-colors duration-150",
        "focus:outline-none",
      )}
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3
            className={clsx(
              "text-base font-bold text-ink-slate-600",
              "group-hover:text-ink-slate-800 transition-colors",
              "line-clamp-2 leading-snug flex-1",
            )}
          >
            {announcement.title}
          </h3>
          <div
            className={clsx(
              "shrink-0 w-6 h-6 rounded",
              "border border-line-slate-200 bg-surface-slate-50",
              "flex items-center justify-center",
              "text-[10px] font-bold text-ink-slate-500",
            )}
          >
            {announcement.user?.avatarThumbnailUrl ? (
              <img
                src={announcement.user.avatarThumbnailUrl}
                alt={`${announcement.user.name} 的头像`}
                className="w-full h-full object-cover rounded-[inherit]"
              />
            ) : (
              avatarChar(announcement.user?.name)
            )}
          </div>
        </div>
        <p
          className={clsx(
            "text-sm text-text-muted-cool leading-snug",
            "line-clamp-2 group-hover:text-text-muted-cool",
            "transition-colors",
          )}
        >
          {announcement.content}
        </p>
      </div>
      <div
        className={clsx(
          "mt-2 pt-1.5 border-t border-dashed border-line-slate-100",
          "flex items-center justify-between",
        )}
      >
        <span className="text-[10px] text-text-muted-cool font-mono">
          {formatAnnouncementDate(announcement.createdAt)}
        </span>
      </div>
    </button>
  );
}
