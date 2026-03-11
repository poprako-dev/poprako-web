import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import {
  type FixedShortcut,
  type ConfigurableShortcut,
  formatKeys,
  hasConflict,
} from "../../types/types";
import { useToastStore } from "@/components/ui/NotificationToast";

type Props = {
  fixedShortcuts: FixedShortcut[];
  configurableShortcuts: ConfigurableShortcut[];
  onUpdateConfigurableShortcuts: (next: ConfigurableShortcut[]) => void;
  onClose: () => void;
};

export default function ShortcutPanel({
  fixedShortcuts,
  configurableShortcuts,
  onUpdateConfigurableShortcuts,
  onClose,
}: Props) {
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const recordedKeys = useRef(new Set<string>());
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (recordingIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      recordedKeys.current.add(e.key);
    };

    const handleKeyUp = () => {
      const keysArray = Array.from(recordedKeys.current);
      if (keysArray.length > 0) {
        const conflict = hasConflict(
          configurableShortcuts,
          recordingIndex!,
          keysArray,
        );
        if (conflict) {
          showToast("快捷键冲突，已保留原有设置", "error");
        } else {
          const updated = configurableShortcuts.map((s, i) =>
            i === recordingIndex ? { ...s, keys: keysArray } : s,
          );
          onUpdateConfigurableShortcuts(updated);
        }
        setRecordingIndex(null);
        recordedKeys.current.clear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    recordingIndex,
    configurableShortcuts,
    onUpdateConfigurableShortcuts,
    showToast,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && recordingIndex === null) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, recordingIndex]);

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/30",
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          "bg-background w-full max-w-3xl",
          "rounded-lg shadow-lg overflow-hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            "flex justify-between items-center",
            "px-4 py-2 border-b border-border",
          )}
        >
          <span className="font-bold text-foreground text-sm">快捷键设置</span>
          <button
            className={clsx(
              "text-muted-foreground",
              "hover:text-foreground transition-colors",
            )}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <div
            className={clsx(
              "grid grid-cols-2 gap-x-12 gap-y-3",
              "mb-6 pb-3",
              "border-b border-dashed border-border",
            )}
          >
            {fixedShortcuts.map((item, index) => (
              <div
                key={index}
                className={clsx("grid grid-cols-2", "items-center text-xs")}
              >
                <span className="text-muted-foreground text-xs">
                  {item.label}
                </span>
                <span className={clsx("text-foreground font-medium text-xs")}>
                  {formatKeys(item.keys)}
                </span>
              </div>
            ))}
          </div>

          <div className={clsx("grid grid-cols-2", "gap-x-12 gap-y-4")}>
            {configurableShortcuts.map((s, index) => (
              <div
                key={index}
                className={clsx("grid grid-cols-2 items-center")}
              >
                <span className={clsx("text-muted-foreground text-xs")}>
                  {s.label}
                </span>
                <div
                  onClick={() => setRecordingIndex(index)}
                  className={clsx(
                    "h-7 px-2",
                    "flex items-center rounded border",
                    "text-xs transition-all",
                    "select-none cursor-pointer",
                    recordingIndex === index
                      ? clsx(
                          "border-primary",
                          "bg-primary/10",
                          "text-primary",
                          "ring-1 ring-primary/20",
                        )
                      : clsx(
                          "border-border",
                          "bg-muted/50",
                          "text-muted-foreground",
                          "hover:border-border/80",
                        ),
                  )}
                >
                  {recordingIndex === index
                    ? "请按下按键..."
                    : formatKeys(s.keys)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
