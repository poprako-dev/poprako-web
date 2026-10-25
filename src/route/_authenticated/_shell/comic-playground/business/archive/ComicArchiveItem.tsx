import type { ReactElement } from "react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";

type Props = { comic: ComicInfo };

export function ComicArchiveItem({ comic }: Props): ReactElement {
  const date =
    comic.archivedAt === null || comic.archivedAt === undefined ? null : new Date(comic.archivedAt);
  return (
    <li className="flex w-full items-start gap-3 rounded-sm border border-line-stone-200 bg-surface-stone-50/10 px-3 py-2 shadow-xs sm:items-center">
      <span className="shrink-0 rounded bg-surface-slate-100 px-2 py-0.5 font-mono text-xs text-text-muted-cool">
        #{comic.index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <h3
          title={comic.title}
          className="min-w-0 flex-1 truncate text-base font-bold text-ink-slate-700"
        >
          {comic.title || "未命名"}
        </h3>
        <div className="flex min-w-0 items-center gap-3 text-xs text-text-muted-cool sm:gap-4">
          <span title={comic.author} className="min-w-0 max-w-20 truncate">
            {comic.author || "—"}
          </span>
          <span className="shrink-0 text-right">{comic.chapterCount} 章</span>
          <time
            dateTime={date?.toISOString()}
            title="归档日期"
            className="shrink-0 text-right tabular-nums"
          >
            {date?.toLocaleDateString("zh-CN") ?? "—"}
          </time>
        </div>
      </div>
    </li>
  );
}
