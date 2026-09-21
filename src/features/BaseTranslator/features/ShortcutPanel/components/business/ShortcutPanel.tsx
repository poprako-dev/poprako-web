import { useState, useEffect, useRef } from "react";
/* eslint-disable @eslint-react/web-api-no-leaked-event-listener -- cleanup is paired below. */
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
import { isKeyboardComposing } from "@/lib/keyboard";

interface Props {
  fixedShortcuts: FixedShortcut[];
  configurableShortcuts: ConfigurableShortcut[];
  onUpdateConfigurableShortcuts: (next: ConfigurableShortcut[]) => void;
  onClose: () => void;
}

export default function ShortcutPanel({
  fixedShortcuts,
  configurableShortcuts,
  onUpdateConfigurableShortcuts,
  onClose,
}: Props) {
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const recordedKeysRef = useRef(new Set<string>());
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    if (recordingIndex === null) {return;}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isKeyboardComposing(e)) {
        recordedKeysRef.current.clear();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const key = e.code.startsWith("Digit") ? e.code.slice(-1) : e.key;
      recordedKeysRef.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isKeyboardComposing(e)) {
        recordedKeysRef.current.clear();
        return;
      }
      const keysArray = [...recordedKeysRef.current];
      if (keysArray.length > 0) {
        const isConflict = hasConflict(
          configurableShortcuts,
          recordingIndex,
          keysArray,
        );
        if (isConflict) {
          showToast("快捷键冲突，已保留原有设置", "error");
        } else {
          const updated = configurableShortcuts.map((s, i) =>
            i === recordingIndex ? { ...s, keys: keysArray } : s,
          );
          onUpdateConfigurableShortcuts(updated);
        }
        setRecordingIndex(null);
        recordedKeysRef.current.clear();
      }
    };

    // Capture before the panel stops keyboard events from bubbling.
    addEventListener("keydown", handleKeyDown, true);
    addEventListener("keyup", handleKeyUp, true);
    return () => {
      removeEventListener("keydown", handleKeyDown, true);
      removeEventListener("keyup", handleKeyUp, true);
    };
  }, [
    recordingIndex,
    configurableShortcuts,
    onUpdateConfigurableShortcuts,
    showToast,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isKeyboardComposing(e)) {return;}
      if (recordingIndex === null && e.key === "Escape") {
        onClose();
      }
    };
    addEventListener("keydown", handleKeyDown);
    return () => {
      removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, recordingIndex]);

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-white/60 backdrop-blur-sm",
      )}
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isKeyboardComposing(event.nativeEvent)) {return;}
        if (event.key === "Enter") {onClose();}
      }}
    >
      <div
        className={clsx(
          "w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-xl bg-white",
          "border border-(--color-border-green-200) shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
        onClick={(e) => { e.stopPropagation(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { event.stopPropagation(); }}
      >
        <div
          className="h-1 w-full opacity-20"
          style={{ background: "var(--color-green-500)" }}
        />
        <div
          className={clsx(
            "flex justify-between items-center",
            "px-5 pb-2 pt-4",
          )}
        >
          <span className="text-base font-bold text-slate-800">快捷键设置</span>
          <button type="button"
            className={clsx(
              "flex size-7 items-center justify-center rounded-md text-slate-300",
              "transition-colors hover:bg-slate-50 hover:text-slate-500",
            )}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-3">
          <div
            className={clsx(
              "grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2",
              "mb-6 pb-3",
              "border-b border-dashed border-border",
            )}
          >
            {fixedShortcuts.map((item) => (
              <div
                key={item.label}
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

          <div
            className={clsx(
              "grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2",
            )}
          >
            {configurableShortcuts.map((s, index) => (
              <div
                key={s.action}
                className={clsx("grid grid-cols-2 items-center")}
              >
                <span className={clsx("text-muted-foreground text-xs")}>
                  {s.label}
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => { setRecordingIndex(index); }}
                  onKeyDown={(event) => {
                    if (isKeyboardComposing(event.nativeEvent)) {return;}
                    if (event.key === "Enter" || event.key === " ") {
                      setRecordingIndex(index);
                    }
                  }}
                  className={clsx(
                    "h-7 px-2",
                    "flex items-center rounded-md border",
                    "text-xs transition-all",
                    "select-none cursor-pointer",
                    recordingIndex === index
                      ? clsx(
                          "border-green-200",
                          "bg-green-50",
                          "text-green-600",
                          "ring-1 ring-green-100",
                        )
                      : clsx(
                          "border-slate-200",
                          "bg-white",
                          "text-slate-500",
                          "shadow-sm shadow-slate-100",
                          "hover:border-slate-300",
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
