import { Share } from "lucide-react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

type Props = {
  isExporting: boolean;
  onExport: () => void;
};

export function TermbaseShareButton({ isExporting, onExport }: Props): React.ReactElement {
  return (
    <button
      type="button"
      aria-label="导出术语库"
      title="导出术语库"
      disabled={isExporting}
      aria-busy={isExporting}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onExport();
      }}
      className={clsx(
        "flex size-6 shrink-0 items-center justify-center rounded-md border",
        "border-line-stone-200 bg-surface-stone-100 text-ink-stone-600 transition-colors",
        "enabled:hover:border-line-stone-300 enabled:hover:bg-surface-stone-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {isExporting ? (
        <LoadingCircle size={12} aria-label="正在导出术语库" />
      ) : (
        <Share size={12} aria-hidden="true" />
      )}
    </button>
  );
}
