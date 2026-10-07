import type { JSX } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import type { RevisionWorkspace } from "./use-revision-workspace";
type Props = { revision: RevisionWorkspace };
export function RevisionPreviewStatus({ revision }: Props): JSX.Element | null {
  const error = revision.error ?? revision.preview.error;
  if (!error && !revision.preview.loading) return null;
  return (
    <div
      className={
        revision.error
          ? "absolute inset-0 flex items-center justify-center bg-surface-stone-600 text-ink-white"
          : "absolute bottom-12 right-2 rounded bg-surface-white/85 p-2 text-ink-stone-700"
      }
    >
      {error ? (
        <button
          type="button"
          title={error}
          aria-label={revision.error ? "重试" : "重试图层预览"}
          onClick={revision.retry}
        >
          <span role="alert" className="sr-only">
            revision_note 加载失败
          </span>
          <RotateCcw size={18} />
        </button>
      ) : (
        <LoaderCircle className="animate-spin" size={18} aria-label="正在加载图层" />
      )}
    </div>
  );
}
