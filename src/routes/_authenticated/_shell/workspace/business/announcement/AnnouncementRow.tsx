import type { JSX } from "react";
import clsx from "clsx";
import type { AnnouncementInfo } from "@/routes/_authenticated/_shell/workspace/business/announcement/announcement";
import { formatAnnouncementDate } from "@/routes/_authenticated/_shell/workspace/business/announcement/announcement-date";

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
        "group flex w-full flex-col justify-between px-3 py-2.5 text-left",
        "hover:bg-muted transition-colors duration-150 focus:outline-none",
      )}
    >
      <div>
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3
            className={clsx(
              "flex-1 line-clamp-2 text-base font-bold leading-snug text-text-secondary",
              "group-hover:text-foreground transition-colors",
            )}
          >
            {announcement.title}
          </h3>
          <div
            className={clsx(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded",
              "border border-border bg-muted text-[10px] font-bold text-muted-foreground",
            )}
          >
            {announcement.user?.avatarThumbnailUrl ? (
              <img
                src={announcement.user.avatarThumbnailUrl}
                alt={`${announcement.user.name} 的头像`}
                className="h-full w-full rounded-[inherit] object-cover"
              />
            ) : (
              avatarChar(announcement.user?.name)
            )}
          </div>
        </div>
        <p
          className={clsx(
            "line-clamp-2 text-sm leading-snug text-muted-foreground",
            "group-hover:text-muted-foreground transition-colors",
          )}
        >
          {announcement.content}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-dashed border-border pt-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          {formatAnnouncementDate(announcement.createdAt)}
        </span>
      </div>
    </button>
  );
}
