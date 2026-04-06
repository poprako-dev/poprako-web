import clsx from "clsx";
import type { PageInfo } from "@/types";
import LazyImage from "./LazyImage";

type Props = {
  page: PageInfo;
};

export default function PageCard({ page }: Props) {
  const isComplete =
    page.totalUnitCount > 0 && page.translatedUnitCount >= page.totalUnitCount;

  return (
    <div
      className={clsx(
        "relative aspect-3/4 border rounded-sm",
        "hover:border-slate-300 hover:shadow-sm",
        "transition-all cursor-pointer group",
        "bg-white border-slate-100 overflow-hidden",
      )}
    >
      {page.imageUrl ? (
        <LazyImage
          src={page.imageUrl}
          alt={`Page ${page.index}`}
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            "text-[10px] text-slate-200 font-black tracking-tighter",
            "group-hover:text-slate-400 transition-colors",
          )}
        >
          P{page.index}
        </div>
      )}

      {/* Progress badge */}
      <div className="absolute bottom-1.5 right-1.5">
        <div
          className={clsx(
            "bg-white/90 backdrop-blur-sm border border-slate-100",
            "px-1 py-0.5 rounded-sm flex items-center gap-1",
          )}
        >
          <div
            className={clsx(
              "w-1 h-1 rounded-full",
              isComplete ? "bg-emerald-400" : "bg-slate-300",
            )}
          />
          <span className="text-[8px] font-black text-slate-500 italic tracking-tighter">
            {page.translatedUnitCount}/{page.totalUnitCount}
          </span>
        </div>
      </div>
    </div>
  );
}
