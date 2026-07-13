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
  uploadProgress?: number;
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
  uploadProgress,
}: Props) {
  const isPending = !page.imageUrl;
  const total = page.totalUnitCount;
  const translated = page.translatedUnitCount;
  const proofread = page.proofreadUnitCount;
  const transPct = total > 0 ? Math.round((translated / total) * 100) : 0;
  const proofPct = total > 0 ? Math.round((proofread / total) * 100) : 0;
  const isEmpty = total === 0;
  const isCompleted = total > 0 && proofread >= total;
  const isTranslated = total > 0 && translated >= total;
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const clampedUploadProgress =
    typeof uploadProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(uploadProgress)))
      : null;

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

      {/* Status indicator — top right */}
      {!isPending && (
        <div
          className={clsx(
            "absolute top-2 right-2 z-10",
            "bg-slate-900/40 backdrop-blur-sm px-1.5 py-1 rounded flex items-center justify-center",
          )}
        >
          <div
            className={clsx(
              "w-2.5 h-2.5 rounded-full shadow-sm",
              isCompleted
                ? "bg-green-500"
                : isTranslated
                  ? "bg-orange-400"
                  : isEmpty
                    ? "border-[3px] border-green-500 bg-transparent"
                    : "bg-gray-400",
            )}
          />
        </div>
      )}

      {/* Image */}
      {page.imageThumbnailUrl ? (
        <LazyImage
          src={page.imageThumbnailUrl}
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

      {/* Hover dim overlay */}
      <div className="absolute inset-0 z-[3] bg-black/0 group-hover:bg-black/[0.07] transition-colors duration-200 pointer-events-none" />

      {clampedUploadProgress !== null && clampedUploadProgress < 100 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
            />
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="3"
              strokeDasharray={100.531}
              strokeDashoffset={100.531 * (1 - clampedUploadProgress / 100)}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-white/90">
            {clampedUploadProgress}%
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
              { progressPercent: transPct, barColor: "#fdba74" },
              { progressPercent: proofPct, barColor: "#f9a8d4" },
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
