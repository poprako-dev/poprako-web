import { type JSX, useRef, type ChangeEvent } from "react";
import clsx from "clsx";
import { Trash2, Upload } from "lucide-react";
import type { PageInfo } from "@/routes/_authenticated/business/page/page";
import type { PageUploadTaskStatus } from "@/routes/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import { MultiProgressBar } from "@/shared/component/MultiProgressBar";
import { LazyImage } from "@/routes/_authenticated/_shell/business/comic-detail/LazyImage";

type Props = {
  page: PageInfo;
  onClick?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  enableDelete?: boolean | undefined;
  enableClick?: boolean | undefined;
  onReupload?: ((file: File) => void) | undefined;
  canReupload?: boolean | undefined;
  isReuploading?: boolean | undefined;
  reuploadAccept?: string | undefined;
  uploadProgress?: number | undefined;
  uploadStatus?: PageUploadTaskStatus | undefined;
  uploadError?: string | undefined;
};

export function PageCard({
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
  uploadStatus,
  uploadError,
}: Props): JSX.Element {
  const isPending = !page.imageUrl;
  const isInteractive = enableClick && Boolean(onClick) && !isPending;
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
  let statusClass = isEmpty ? "border-[3px] border-green-500 bg-transparent" : "bg-gray-400";
  if (isTranslated) {
    statusClass = "bg-orange-400";
  }
  if (isCompleted) {
    statusClass = "bg-green-500";
  }

  const handleReuploadFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onReupload) {
      return;
    }
    onReupload(file);
  };

  return (
    <div // eslint-disable-line jsx-a11y/no-static-element-interactions -- interactive only with a callback
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex -- gated by isInteractive
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") {
                return;
              }
              event.preventDefault();
              onClick?.();
            }
          : undefined
      }
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 150px" }}
      className={clsx(
        "relative aspect-3/4 border rounded-sm flex flex-col",
        "hover:border-border hover:shadow-sm",
        "transition-all group",
        isInteractive ? "cursor-pointer" : "cursor-default",
        "bg-surface-panel border-border overflow-hidden",
        isPending && "opacity-60",
      )}
    >
      {/* Index badge — top left */}
      <div
        className={clsx(
          "absolute top-2 left-2 z-10",
          "bg-foreground px-1.5 py-1 rounded",
          "flex items-center justify-center",
        )}
      >
        <span className="text-[10px] font-bold text-background leading-none">
          P{page.index + 1}
        </span>
      </div>

      {/* Status indicator — top right */}
      {!isPending && (
        <div
          className={clsx(
            "absolute top-2 right-2 z-10",
            "bg-foreground px-1.5 py-1 rounded",
            "flex items-center justify-center",
          )}
        >
          <div className={clsx("w-2.5 h-2.5 rounded-full shadow-sm", statusClass)} />
        </div>
      )}

      {/* Image */}
      {page.imageThumbnailUrl ? (
        <LazyImage
          src={page.imageThumbnailUrl}
          alt={`Page ${String(page.index)}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className={clsx(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5",
            "bg-muted animate-pulse",
          )}
        >
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-tighter">
            P{page.index + 1}
          </span>
        </div>
      )}

      {/* Hover dim overlay */}
      <div
        className={clsx(
          "absolute inset-0 z-[3] bg-foreground/0 pointer-events-none",
          "group-hover:bg-foreground/[0.07] transition-colors duration-200",
        )}
      />

      {clampedUploadProgress !== null &&
        (clampedUploadProgress < 100 || uploadStatus === "confirming") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-overlay">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--image-label-foreground)"
                strokeWidth="3"
                opacity="0.3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="var(--image-label-foreground)"
                strokeWidth="3"
                opacity="0.9"
                strokeDasharray={100.531}
                strokeDashoffset={100.531 * (1 - clampedUploadProgress / 100)}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-image-label-foreground">
              {uploadStatus === "confirming" ? "确认中" : `${String(clampedUploadProgress)}%`}
            </span>
          </div>
        )}

      {uploadStatus === "failed" && uploadError && (
        <div
          className={clsx(
            "absolute inset-x-1.5 bottom-1.5 z-20 rounded-sm px-1.5 py-1",
            "bg-destructive-foreground text-center text-[9px] font-bold text-foreground",
            "border border-destructive",
          )}
          title={uploadError}
        >
          上传失败，可重传
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
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={clsx(
            "absolute bottom-3 right-1.5 z-10 p-1.5 rounded-sm",
            "bg-surface-panel/90 backdrop-blur-sm border border-border shadow-sm",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all active:scale-95",
          )}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {canReupload && onReupload && (
        <>
          <input
            ref={reuploadInputRef}
            type="file"
            accept={reuploadAccept ?? "image/*"}
            className="hidden"
            onClick={(event) => {
              event.stopPropagation();
            }}
            onChange={handleReuploadFileChange}
          />
          <div
            className={clsx(
              "absolute inset-0 z-10 flex items-center justify-center",
              "pointer-events-none",
            )}
          >
            <button
              type="button"
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
