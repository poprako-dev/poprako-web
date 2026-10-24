import { Copy } from "lucide-react";
import clsx from "clsx";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

type Props = {
  target: string | undefined;
};

export function TermCopyButton({ target }: Props): React.ReactElement {
  const showToast = useToastStore((state) => state.showToast);

  async function copyTarget(): Promise<void> {
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
      showToast("已复制首选译名", "success");
    } catch (error: unknown) {
      console.error("[TerminologyLookup] 复制首选译名失败", error);
      showToast("复制失败，请重试", "error");
    }
  }

  return (
    <button
      type="button"
      aria-label="复制首选译名"
      title="复制首选译名"
      disabled={!target}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        void copyTarget();
      }}
      className={clsx(
        "flex size-6 shrink-0 items-center justify-center rounded-md border",
        "border-line-stone-200 bg-surface-stone-100 text-ink-stone-600 transition-colors",
        "enabled:hover:border-line-stone-300 enabled:hover:bg-surface-stone-200",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      <Copy size={12} aria-hidden="true" />
    </button>
  );
}
