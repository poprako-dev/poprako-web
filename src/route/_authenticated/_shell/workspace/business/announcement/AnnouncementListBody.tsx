import type { JSX } from "react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import type { AnnouncementInfo } from "./announcement";
import { AnnouncementRow } from "./AnnouncementRow";

type Props = {
  announcements: AnnouncementInfo[];
  loading: boolean;
  onOpen: (announcement: AnnouncementInfo) => void;
};

export function AnnouncementListBody({ announcements, loading, onOpen }: Props): JSX.Element {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24 text-text-muted-cool">
        <LoadingCircle size={18} />
      </div>
    );
  }
  if (announcements.length === 0) return <EmptyAnnouncements />;
  return (
    <div className={announcementGridClass(announcements.length)}>
      {announcements.map((announcement, index) => (
        <AnnouncementRow
          key={announcement.id}
          announcement={announcement}
          hiddenOnMobile={index > 0}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function EmptyAnnouncements(): JSX.Element {
  return (
    <div
      className={clsx(
        "flex items-center justify-center h-20",
        "text-xs text-text-muted-cool border border-dashed",
        "border-line-slate-200 rounded-md",
      )}
    >
      暂无公告
    </div>
  );
}

function announcementGridClass(count: number): string {
  const columns =
    count === 1
      ? "grid grid-cols-1"
      : count === 2
        ? "grid grid-cols-1 sm:grid-cols-2"
        : "grid grid-cols-1 sm:grid-cols-3";
  return clsx(
    columns,
    "border border-line-slate-200 rounded-md overflow-hidden",
    "divide-y sm:divide-y-0 sm:divide-x divide-separator-slate-100",
  );
}
