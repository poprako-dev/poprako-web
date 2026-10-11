import type { Dispatch, ReactPortal, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import {
  type ConfigurableShortcut,
  type FixedShortcut,
  formatKeys,
  hasConflict,
} from "@/shared/utility/shortcut";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { isKeyboardComposing } from "@/shared/utility/keyboard";

type Props = {
  fixedShortcuts: FixedShortcut[];
  configurableShortcuts: ConfigurableShortcut[];
  onUpdateConfigurableShortcuts: (next: ConfigurableShortcut[]) => void;
  onClose: () => void;
};

function handleShortcutKeyDown(
  event: KeyboardEvent,
  recordedKeysRef: RefObject<Set<string>>,
): void {
  if (isKeyboardComposing(event)) {
    recordedKeysRef.current.clear();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const key = event.code.startsWith("Digit") ? event.code.slice(-1) : event.key;
  recordedKeysRef.current.add(key);
}

function handleShortcutKeyUp(
  event: KeyboardEvent,
  recordedKeysRef: RefObject<Set<string>>,
  configurableShortcuts: ConfigurableShortcut[],
  recordingIndex: number,
  setRecordingIndex: Dispatch<SetStateAction<number | null>>,
  onUpdateConfigurableShortcuts: Props["onUpdateConfigurableShortcuts"],
  showToast: ReturnType<typeof useToastStore.getState>["showToast"],
): void {
  if (isKeyboardComposing(event)) {
    recordedKeysRef.current.clear();
    return;
  }
  const keysArray = [...recordedKeysRef.current];
  if (keysArray.length === 0) return;
  const isConflict = hasConflict(configurableShortcuts, recordingIndex, keysArray);
  if (isConflict) showToast("快捷键冲突，已保留原有设置", "error");
  else {
    const updated = configurableShortcuts.map((shortcut, index) =>
      index === recordingIndex ? { ...shortcut, keys: keysArray } : shortcut,
    );
    onUpdateConfigurableShortcuts(updated);
  }
  setRecordingIndex(null);
  recordedKeysRef.current.clear();
}

function useShortcutRecording(
  recordingIndex: number | null,
  recordedKeysRef: RefObject<Set<string>>,
  configurableShortcuts: ConfigurableShortcut[],
  setRecordingIndex: Dispatch<SetStateAction<number | null>>,
  onUpdateConfigurableShortcuts: Props["onUpdateConfigurableShortcuts"],
): void {
  const showToast = useToastStore((state) => state.showToast);
  useEffect(() => {
    if (recordingIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      handleShortcutKeyDown(event, recordedKeysRef);
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      handleShortcutKeyUp(
        event,
        recordedKeysRef,
        configurableShortcuts,
        recordingIndex,
        setRecordingIndex,
        onUpdateConfigurableShortcuts,
        showToast,
      );
    };
    // Capture before the panel stops keyboard events from bubbling.
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [
    recordingIndex,
    configurableShortcuts,
    onUpdateConfigurableShortcuts,
    setRecordingIndex,
    showToast,
    recordedKeysRef,
  ]);
}

function useShortcutEscapeClose(recordingIndex: number | null, onClose: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        !event.defaultPrevented &&
        !isKeyboardComposing(event) &&
        recordingIndex === null &&
        event.key === "Escape"
      ) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, recordingIndex]);
}

export function ShortcutPanel({
  fixedShortcuts,
  configurableShortcuts,
  onUpdateConfigurableShortcuts,
  onClose,
}: Props): ReactPortal {
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const recordedKeysRef = useRef(new Set<string>());
  useShortcutRecording(
    recordingIndex,
    recordedKeysRef,
    configurableShortcuts,
    setRecordingIndex,
    onUpdateConfigurableShortcuts,
  );
  useShortcutEscapeClose(recordingIndex, onClose);

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-surface-white/60 backdrop-blur-sm",
      )}
    >
      <button
        type="button"
        aria-label="关闭快捷键设置"
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />
      <div
        className={clsx(
          "w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-xl bg-surface-white",
          "border border-(--brand-leaf-border) shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="快捷键设置"
      >
        <div className="h-1 w-full opacity-20" style={{ background: "var(--brand-leaf)" }} />
        <div className={clsx("flex justify-between items-center", "px-5 pb-2 pt-4")}>
          <span className="text-base font-bold text-ink-slate-800">快捷键设置</span>
          <button
            type="button"
            aria-label="关闭快捷键设置"
            className={clsx(
              "flex size-7 items-center justify-center rounded-md text-text-muted-cool",
              "transition-colors hover:bg-surface-slate-50 hover:text-text-muted-cool",
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
              <div key={item.label} className={clsx("grid grid-cols-2", "items-center text-xs")}>
                <span className="text-muted-foreground text-xs">{item.label}</span>
                <span className={clsx("text-foreground font-medium text-xs")}>
                  {formatKeys(item.keys)}
                </span>
              </div>
            ))}
          </div>

          <div className={clsx("grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2")}>
            {configurableShortcuts.map((s, index) => (
              <div key={s.action} className={clsx("grid grid-cols-2 items-center")}>
                <span className={clsx("text-muted-foreground text-xs")}>{s.label}</span>
                <button
                  type="button"
                  aria-label={`录制快捷键：${s.label}`}
                  onClick={() => {
                    setRecordingIndex(index);
                  }}
                  className={clsx(
                    "h-7 px-2",
                    "flex items-center rounded-md border",
                    "text-xs transition-all",
                    "select-none cursor-pointer",
                    recordingIndex === index
                      ? clsx(
                          "border-line-green-200",
                          "bg-surface-green-50",
                          "text-text-green",
                          "ring-1 ring-focus-green-100",
                        )
                      : clsx(
                          "border-line-slate-200",
                          "bg-surface-white",
                          "text-text-muted-cool",
                          "shadow-sm shadow-shadow-slate-100",
                          "hover:border-line-slate-300",
                        ),
                  )}
                >
                  {recordingIndex === index ? "请按下按键..." : formatKeys(s.keys)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
