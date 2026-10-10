import type { JSX } from "react";
import clsx from "clsx";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";

type Props = {
  comicInfo: ComicInfo;
  chapter: ChapterInfo | null;
  statusDotClass: string;
  showCover: boolean;
  setShowCover: (show: boolean) => void;
  showTitleDropdown: boolean;
  setShowTitleDropdown: (show: boolean) => void;
};

export function ComicProgressIdentity(props: Props): JSX.Element {
  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <ComicProgressActivity comicInfo={props.comicInfo} statusDotClass={props.statusDotClass} />
      <ComicProgressIndex
        comicInfo={props.comicInfo}
        showCover={props.showCover}
        setShowCover={props.setShowCover}
      />
      <ComicProgressTitle
        comicInfo={props.comicInfo}
        showTitleDropdown={props.showTitleDropdown}
        setShowTitleDropdown={props.setShowTitleDropdown}
      />
      <span className="text-[11px] text-text-muted-cool truncate shrink-0 max-w-[120px]">
        {props.chapter?.index ? `[#${String(props.chapter.index)}]` : "—"}
      </span>
    </div>
  );
}

type ActivityProps = Pick<Props, "comicInfo" | "statusDotClass">;

function ComicProgressActivity({ comicInfo, statusDotClass }: ActivityProps): JSX.Element {
  return (
    <div
      title={
        comicInfo.lastActiveAt ? `上次活跃: ${formatDate(comicInfo.lastActiveAt)}` : "无活跃记录"
      }
      className={clsx("w-1.5 h-2 rounded-xs shrink-0", statusDotClass)}
    />
  );
}

type IndexProps = Pick<Props, "comicInfo" | "showCover" | "setShowCover">;

function ComicProgressIndex({ comicInfo, showCover, setShowCover }: IndexProps): JSX.Element {
  return (
    <span // eslint-disable-line jsx-a11y/no-static-element-interactions
      className={clsx(
        "relative text-xs font-mono text-text-muted-cool",
        "bg-surface-slate-100 px-2 py-0.5 rounded shrink-0",
      )}
      onMouseEnter={() => {
        setShowCover(true);
      }}
      onMouseLeave={() => {
        setShowCover(false);
      }}
    >
      #{comicInfo.index + 1}
      {showCover && comicInfo.coverThumbnailUrl && (
        <div
          className={clsx(
            "absolute top-full left-1/2 -translate-x-1/2 mt-3.5 z-20",
            "w-20 h-28 rounded-sm overflow-hidden shadow-md",
            "border border-line-stone-200 bg-surface-stone-100",
          )}
        >
          <img
            src={comicInfo.coverThumbnailUrl}
            alt={comicInfo.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </span>
  );
}

type TitleProps = Pick<Props, "comicInfo" | "showTitleDropdown" | "setShowTitleDropdown">;

function ComicProgressTitle({
  comicInfo,
  showTitleDropdown,
  setShowTitleDropdown,
}: TitleProps): JSX.Element {
  return (
    <div // eslint-disable-line jsx-a11y/no-static-element-interactions
      className="relative min-w-0"
      onMouseEnter={() => {
        setShowTitleDropdown(true);
      }}
      onMouseLeave={() => {
        setShowTitleDropdown(false);
      }}
    >
      <h3 className={clsx("text-base font-bold text-ink-slate-700", "truncate min-w-0")}>
        {comicInfo.title || "未命名"}
      </h3>
      {showTitleDropdown && comicInfo.title && (
        <div
          className={clsx(
            "absolute top-full left-0 mt-3.5 z-20",
            "bg-surface-white/95 border border-line-stone-200 rounded-sm shadow-sm",
            "py-1.5 px-2.5 w-60",
          )}
        >
          <p className="text-sm font-bold text-text-muted-warm break-words">{comicInfo.title}</p>
        </div>
      )}
    </div>
  );
}

function formatDate(ts: number): string {
  const date = new Date(ts);
  return `${String(date.getFullYear())}/${String(date.getMonth() + 1)}/${String(date.getDate())}`;
}
