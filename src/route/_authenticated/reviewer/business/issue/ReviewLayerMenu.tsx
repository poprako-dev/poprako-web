import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { Layers } from "lucide-react";
import clsx from "clsx";
import type { ReviewWorkspace } from "./use-review-workspace";
type Props = { review: ReviewWorkspace };
const buttonClass =
  "flex-1 flex items-center justify-center py-2 transition-colors text-ink-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]";
export function ReviewLayerMenu({ review }: Props): JSX.Element {
  const layers = review.page?.layers ?? [];
  const selectedLayerId = review.layerId;
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeOutside(event: PointerEvent): void {
      const menu = menuRef.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target))
        menu.open = false;
    }
    function closeEscape(event: KeyboardEvent): void {
      const menu = menuRef.current;
      if (menu?.open && event.key === "Escape") {
        menu.open = false;
        menu.querySelector("summary")?.focus();
        event.preventDefault();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);
  const layer = layers.find((item) => item.id === selectedLayerId);
  function choose(id: string | null): void {
    review.selectLayer(id);
    if (menuRef.current) menuRef.current.open = false;
  }
  return (
    <details
      data-translator-shortcuts="ignore"
      ref={menuRef}
      className="group relative flex flex-1"
    >
      <summary
        aria-label="选择 PSD 图层"
        title={layer?.name ?? "选择 PSD 图层"}
        className={clsx(
          buttonClass,
          "h-full cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          selectedLayerId !== null
            ? "bg-surface-green-50 hover:bg-surface-green-100"
            : "bg-surface-white hover:bg-surface-stone-100",
        )}
      >
        <Layers size={18} />
      </summary>
      <div
        className="absolute z-30 left-1/2 top-full mt-1 max-h-80 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-md border border-line-stone-200 bg-surface-stone-50 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
        role="group"
        aria-label="PSD 图层"
      >
        <button
          type="button"
          aria-pressed={selectedLayerId === null}
          onClick={() => {
            choose(null);
          }}
          className="block w-full px-3 py-2 text-left text-sm text-ink-stone-700 hover:bg-surface-stone-200/70"
        >
          全部
        </button>
        {layers.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={`图层 ${item.id}：${item.name}`}
            aria-pressed={selectedLayerId === item.id}
            title={item.name}
            onClick={() => {
              choose(item.id);
            }}
            className={clsx(
              "block w-full truncate py-2 pr-3 text-left text-sm text-ink-stone-700 hover:bg-surface-stone-200/70",
              selectedLayerId === item.id && "bg-surface-stone-300/50",
            )}
            style={{ paddingLeft: 12 + (item.id.split(".").length - 2) * 12 }}
          >
            {item.name || item.id}
          </button>
        ))}
      </div>
    </details>
  );
}
