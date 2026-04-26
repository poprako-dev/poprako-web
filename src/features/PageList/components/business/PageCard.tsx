import clsx from "clsx";
import { Trash2 } from "lucide-react";
import type { PageInfo } from "@/types";
import MultiProgressBar from "@/components/ui/MultiProgressBar";
import LazyImage from "@/features/ComicPlayground/features/ComicDetailModal/components/business/LazyImage";

type Props = {
  page: PageInfo;
  onClick?: () => void;
  onDelete?: () => void;
  enableDelete?: boolean;
  enableClick?: boolean;
};

export default function PageCard({
  page,
  onClick,
  onDelete,
  enableDelete,
  enableClick = true,
}: Props) {
  const total = page.totalUnitCount;
  const translated = page.translatedUnitCount;
  const proofread = page.proofreadUnitCount;
  const transPct = total > 0 ? Math.round((translated / total) * 100) : 0;
  const proofPct = total > 0 ? Math.round((proofread / total) * 100) : 0;

  return (
    <div
      onClick={enableClick ? onClick : undefined}
      className={clsx(
        "relative aspect-3/4 border rounded-sm flex flex-col",
        "hover:border-slate-300 hover:shadow-sm",
        "transition-all group",
        enableClick ? "cursor-pointer" : "cursor-default",
        "bg-white border-slate-100 overflow-hidden",
      )}
    >
      {/* Index badge — top left */}
      <div
        className={clsx(
          "absolute top-2 left-2 z-10",
          "bg-slate-900/40 backdrop-blur-sm px-1.5 py-1 rounded flex items-center justify-center",
        )}
      >
        <span className="text-[10px] font-bold text-white/90 leading-none">
          P{page.index}
        </span>
      </div>

      {/* Unit count — top right */}
      <div
        className={clsx(
          "absolute top-2 right-2 z-10",
          "bg-slate-900/40 backdrop-blur-sm px-1.5 py-1 rounded flex items-center justify-center",
        )}
      >
        <span className="text-[10px] font-bold text-white/90 leading-none tabular-nums">
          {translated} / {total}
        </span>
      </div>

      {/* Image */}
      {page.imageUrl ? (
        <LazyImage
          src={page.imageUrl}
          alt={`Page ${page.index}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center bg-slate-50",
            "text-slate-300 font-bold tracking-tighter",
            "group-hover:text-slate-400 transition-colors",
          )}
        >
          P{page.index}
        </div>
      )}

      {/* Multi progress bar — bottom */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 rounded-full overflow-hidden shadow-sm">
        <MultiProgressBar
          fullWidth
          height={0.35}
          bars={[
            { progressPercent: transPct, barColorClass: "bg-orange-300" },
            { progressPercent: proofPct, barColorClass: "bg-pink-300" },
          ]}
        />
      </div>

      {/* Delete button */}
      {enableDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={clsx(
            "absolute bottom-3 right-1.5 z-10 p-1.5 rounded-sm",
            "bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm",
            "text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-95",
          )}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
