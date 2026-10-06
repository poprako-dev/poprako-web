import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import { useSpecialChars } from "@/route/_authenticated/translator/business/preference/use-special-chars";
import { isKeyboardComposing } from "@/shared/utility/keyboard";

type Mode = "select" | "delete";

type Props = {
  onClose: () => void;
};

export function SpecialCharPanel({ onClose }: Props): React.ReactElement {
  const { allChars, addChar, deleteChar, toggleFavorite, reorderChars } = useSpecialChars();

  const [mode, setMode] = useState<Mode>("select");
  const [isAdding, setIsAdding] = useState(false);
  const [newCharText, setNewCharText] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didDragRef = useRef(false);
  const lastDragOverIdRef = useRef<string | null>(null);

  useEffect((): void => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  useEffect((): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || isKeyboardComposing(e)) return;
      if (!isAdding && e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, isAdding]);

  const submitNewChar = (): void => {
    addChar(newCharText);
    setIsAdding(false);
    setNewCharText("");
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (isKeyboardComposing(e.nativeEvent)) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitNewChar();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewCharText("");
    }
  };

  const handleCharClick = (id: string): void => {
    if (didDragRef.current) return;

    if (mode === "select") {
      toggleFavorite(id);
    } else {
      deleteChar(id);
    }
  };

  const handleModeChange = (next: Mode): void => {
    setMode(next);
    setIsAdding(false);
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, id: string): void => {
    didDragRef.current = false;
    lastDragOverIdRef.current = null;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragEnter = (id: string): void => {
    if (!draggingId || draggingId === id || lastDragOverIdRef.current === id) {
      return;
    }

    didDragRef.current = true;
    reorderChars(draggingId, id);
    lastDragOverIdRef.current = id;
  };

  const handleDragEnd = (): void => {
    setDraggingId(null);
    lastDragOverIdRef.current = null;
    globalThis.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

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
        aria-label="关闭特殊符号面板"
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="特殊符号面板"
        className={clsx(
          "w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl bg-surface-white",
          "border border-(--brand-leaf-border) shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
      >
        <div className="h-1 w-full opacity-20" style={{ background: "var(--brand-leaf)" }} />
        {/* Header */}
        <div className={clsx("flex justify-between items-center", "px-5 pb-2 pt-4")}>
          <span className="text-base font-bold text-ink-slate-800">特殊符号面板</span>
          <button
            type="button"
            aria-label="关闭特殊符号面板"
            className={clsx(
              "flex size-7 items-center justify-center rounded-md text-text-muted-cool",
              "transition-colors hover:bg-surface-slate-50 hover:text-text-muted-cool",
            )}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-3">
          {/* Mode Tabs */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-slate-50 p-1">
              {(["select", "delete"] as Mode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    handleModeChange(m);
                  }}
                  className={clsx(
                    "rounded-md px-5 py-1.5 text-sm outline-none",
                    "transition-all duration-200",
                    mode === m
                      ? "bg-surface-white font-medium text-ink-slate-700 shadow-sm"
                      : "text-text-muted-cool hover:text-ink-slate-600",
                  )}
                >
                  {m === "select" ? "优选" : "删除"}
                </button>
              ))}
            </div>
          </div>

          {/* Char Grid */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {allChars.map((char) => (
              <button
                type="button"
                key={char.id}
                draggable
                onClick={() => {
                  handleCharClick(char.id);
                }}
                onDragStart={(e) => {
                  handleDragStart(e, char.id);
                }}
                onDragEnter={() => {
                  handleDragEnter(char.id);
                }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                className={clsx(
                  "group relative flex items-center justify-center",
                  "h-12 rounded-lg text-sm transition-all duration-200",
                  "outline-none active:scale-95 overflow-hidden",
                  "cursor-grab active:cursor-grabbing",
                  draggingId === char.id && "opacity-60 ring-2 ring-primary/30",
                  mode === "select"
                    ? char.isFavorite
                      ? [
                          "bg-[var(--brand-leaf-faint)]",
                          "text-[var(--brand-leaf)]",
                          "hover:opacity-80",
                        ]
                      : ["bg-muted text-muted-foreground", "hover:bg-accent hover:text-foreground"]
                    : [
                        "bg-muted text-muted-foreground",
                        "hover:bg-destructive/10 hover:text-destructive",
                      ],
                )}
              >
                <span className="transition-transform duration-200 group-hover:scale-110 font-mono">
                  {char.text}
                </span>
              </button>
            ))}

            {/* Add Button — only in select mode */}
            {mode === "select" && (
              <div className="relative h-12">
                {isAdding ? (
                  <textarea
                    ref={textareaRef}
                    value={newCharText}
                    onChange={(e) => {
                      setNewCharText(e.target.value);
                    }}
                    onKeyDown={handleTextareaKeyDown}
                    onBlur={submitNewChar}
                    placeholder="…"
                    className={clsx(
                      "absolute inset-0 w-full h-full",
                      "text-center text-sm font-mono",
                      "bg-background text-foreground",
                      "rounded-lg border border-border outline-none resize-none",
                      "pt-3 placeholder:text-muted-foreground",
                    )}
                  />
                ) : (
                  <button
                    type="button"
                    aria-label="添加特殊符号"
                    onClick={() => {
                      setIsAdding(true);
                    }}
                    className={clsx(
                      "w-full h-full flex items-center justify-center",
                      "rounded-lg bg-muted/60 text-muted-foreground",
                      "transition-all duration-200 outline-none",
                      "hover:bg-accent hover:text-muted-foreground",
                      "active:scale-95",
                    )}
                  >
                    <Plus size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hint */}
          <p className="mt-4 text-xs text-muted-foreground text-center">
            {mode === "select"
              ? "点击切换是否出现在符号栏中，拖动可排序"
              : "点击符号将其删除，拖动可排序"}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
