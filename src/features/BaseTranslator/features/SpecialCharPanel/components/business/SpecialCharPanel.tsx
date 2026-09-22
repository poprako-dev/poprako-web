/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events -- modal. */
/* eslint-disable unicorn/no-unnecessary-global-this -- browser globals are explicit here. */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";
import clsx from "clsx";
import { useSpecialChars } from "@/hook/useSpecialChars";
import { isKeyboardComposing } from "@/lib/keyboard";

type Mode = "select" | "delete";

interface Props {
  onClose: () => void;
}

export default function SpecialCharPanel({ onClose }: Props) {
  const { allChars, addChar, deleteChar, toggleFavorite, reorderChars } =
    useSpecialChars();

  const [mode, setMode] = useState<Mode>("select");
  const [isAdding, setIsAdding] = useState(false);
  const [newCharText, setNewCharText] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didDragRef = useRef(false);
  const lastDragOverIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isKeyboardComposing(e)) {return;}
      if (!isAdding && e.key === "Escape") {onClose();}
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => { globalThis.removeEventListener("keydown", handleKeyDown); };
  }, [onClose, isAdding]);

  const submitNewChar = () => {
    addChar(newCharText);
    setIsAdding(false);
    setNewCharText("");
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (isKeyboardComposing(e.nativeEvent)) {return;}
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitNewChar();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewCharText("");
    }
  };

  const handleCharClick = (id: string) => {
    if (didDragRef.current) {return;}

    if (mode === "select") {
      toggleFavorite(id);
    } else {
      deleteChar(id);
    }
  };

  const handleModeChange = (next: Mode) => {
    setMode(next);
    setIsAdding(false);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    id: string,
  ) => {
    didDragRef.current = false;
    lastDragOverIdRef.current = null;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragEnter = (id: string) => {
    if (!draggingId || draggingId === id || lastDragOverIdRef.current === id) {
      return;
    }

    didDragRef.current = true;
    reorderChars(draggingId, id);
    lastDragOverIdRef.current = id;
  };

  const handleDragEnd = () => {
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
        "bg-white/60 backdrop-blur-sm",
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          "w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl bg-white",
          "border border-(--color-border-green-200) shadow-(--shadow-sm)",
          "animate-in zoom-in-95 duration-200",
        )}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <div
          className="h-1 w-full opacity-20"
          style={{ background: "var(--color-green-500)" }}
        />
        {/* Header */}
        <div
          className={clsx(
            "flex justify-between items-center",
            "px-5 pb-2 pt-4",
          )}
        >
          <span className="text-base font-bold text-slate-800">
            特殊符号面板
          </span>
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

        {/* Body */}
        <div className="px-5 pb-5 pt-3">
          {/* Mode Tabs */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-0.5 rounded-lg bg-slate-50 p-1">
              {(["select", "delete"] as Mode[]).map((m) => (
                <button type="button"
                  key={m}
                  onClick={() => { handleModeChange(m); }}
                  className={clsx(
                    "rounded-md px-5 py-1.5 text-sm outline-none",
                    "transition-all duration-200",
                    mode === m
                      ? "bg-white font-medium text-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600",
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
              <button type="button"
                key={char.id}
                draggable
                onClick={() => { handleCharClick(char.id); }}
                onDragStart={(e) => { handleDragStart(e, char.id); }}
                onDragEnter={() => { handleDragEnter(char.id); }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => { e.preventDefault(); }}
                className={clsx(
                  "group relative flex items-center justify-center",
                  "h-12 rounded-lg text-sm transition-all duration-200",
                  "outline-none active:scale-95 overflow-hidden",
                  "cursor-grab active:cursor-grabbing",
                  draggingId === char.id && "opacity-60 ring-2 ring-primary/30",
                  mode === "select"
                    ? (char.isFavorite
                      ? [
                          "bg-[var(--color-green-50)]",
                          "text-[var(--color-green-500)]",
                          "hover:opacity-80",
                        ]
                      : [
                          "bg-muted text-muted-foreground",
                          "hover:bg-accent hover:text-foreground",
                        ])
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
                    onChange={(e) => { setNewCharText(e.target.value); }}
                    onKeyDown={handleTextareaKeyDown}
                    onBlur={submitNewChar}
                    placeholder="…"
                    className={clsx(
                      "absolute inset-0 w-full h-full",
                      "text-center text-sm font-mono",
                      "bg-background text-foreground",
                      "rounded-lg border border-border outline-none resize-none",
                      "pt-3 placeholder:text-muted-foreground/50",
                    )}
                  />
                ) : (
                  <button type="button"
                    aria-label="添加特殊符号"
                    onClick={() => { setIsAdding(true); }}
                    className={clsx(
                      "w-full h-full flex items-center justify-center",
                      "rounded-lg bg-muted/60 text-muted-foreground/60",
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
          <p className="mt-4 text-xs text-muted-foreground/70 text-center">
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
