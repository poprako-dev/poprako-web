import { useRef, type ChangeEvent } from "react";
import clsx from "clsx";
import { Trash2, Upload } from "lucide-react";
import type { PageInfo } from "@/types";
import MultiProgressBar from "@/components/ui/MultiProgressBar";
import LazyImage from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/LazyImage";

type Props = {
  page: PageInfo;
  onClick?: () => void;
  onDelete?: () => void;
  enableDelete?: boolean;
  enableClick?: boolean;
  onReupload?: (file: File) => void;
  canReupload?: boolean;
  isReuploading?: boolean;
  reuploadAccept?: string;
};

export default function PageCard({
  page,
  onClick,
  onDelete,
  enableDelete,
  enableClick = true,
  onReupload,
  canReupload = false,
  isReuploading = false,
  reuploadAccept,
}: Props) {
  const isPending = !page.imageUrl;
  const total = page.totalUnitCount;
  const translated = page.translatedUnitCount;
  const proofread = page.proofreadUnitCount;
  const transPct = total > 0 ? Math.round((translated / total) * 100) : 0;
  const proofPct = total > 0 ? Math.round((proofread / total) * 100) : 0;
  const reuploadInputRef = useRef<HTMLInputElement>(null);

  const handleReuploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onReupload) return;
    onReupload(file);
  };

  return (
    <div
      onClick={enableClick ? onClick : undefined}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 150px" }}
      className={clsx(
        "relative aspect-3/4 border rounded-sm flex flex-col",
        "hover:border-slate-300 hover:shadow-sm",
        "transition-all group",
        enableClick && !isPending ? "cursor-pointer" : "cursor-default",
        "bg-white border-slate-100 overflow-hidden",
        isPending && "opacity-60",
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
          P{page.index+1}
        </span>
      </div>

      {/* Unit count — top right */}
      {!isPending && (
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
      )}

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
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5",
            "bg-slate-100 animate-pulse",
          )}
        >
          <Upload className="w-4 h-4 text-slate-300" />
          <span className="text-[10px] font-bold text-slate-300 tracking-tighter">
            P{page.index + 1}
          </span>
        </div>
      )}

      {/* Multi progress bar — bottom */}
      {!isPending && (
        <div
          className={clsx(
            "absolute bottom-1.5 left-1.5 right-1.5 z-10",
            "rounded-full overflow-hidden shadow-sm",
          )}
        >
          <MultiProgressBar
            fullWidth
            height={0.35}
            bars={[
              { progressPercent: transPct, barColorClass: "bg-orange-300" },
              { progressPercent: proofPct, barColorClass: "bg-pink-300" },
            ]}
          />
        </div>
      )}

      {/* Delete button */}
      {enableDelete && onDelete && !isPending && (
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

      {canReupload && onReupload && !isPending && (
        <>
          <input
            ref={reuploadInputRef}
            type="file"
            accept={reuploadAccept ?? "image/*"}
            className="hidden"
            onClick={(event) => event.stopPropagation()}
            onChange={handleReuploadFileChange}
          />
          <div
            className={clsx(
              "absolute inset-0 z-10 flex items-center justify-center",
              "pointer-events-none",
            )}
          >
            <button
              onClick={(event) => {
                event.stopPropagation();
                reuploadInputRef.current?.click();
              }}
              disabled={isReuploading}
              className={clsx(
                "pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-sm",
                "bg-slate-50/20 backdrop-blur-[1px] border border-slate-300/20",
                "text-slate-400 hover:text-slate-600",
                "hover:bg-slate-50/35 hover:border-slate-300/45",
                "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                "transition-all active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              title="重上传"
            >
              <Upload className="h-3 w-3" strokeWidth={2.25} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
