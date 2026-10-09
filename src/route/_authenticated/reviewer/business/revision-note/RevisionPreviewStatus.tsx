import type { JSX } from "react";
import { RotateCcw } from "lucide-react";
import type { RevisionWorkspace } from "./use-revision-workspace";
type Props = { revision: RevisionWorkspace };
export function RevisionPreviewStatus({ revision }: Props): JSX.Element | null {
  if (!revision.error) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-stone-600 text-ink-white">
      <button type="button" title={revision.error} aria-label="重试" onClick={revision.retry}>
        <span role="alert" className="sr-only">
          PSD 预览加载失败
        </span>
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
