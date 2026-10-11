import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import { useSpecialChars } from "@/route/_authenticated/translator/business/preference/use-special-chars";
import { isKeyboardComposing } from "@/shared/utility/keyboard";
import type { CharItem } from "@/route/_authenticated/translator/business/preference/use-special-chars";

type Mode = "select" | "delete";

type Props = {
  onClose: () => void;
};

type SpecialCharGridProps = {
  allChars: CharItem[];
  mode: Mode;
  isAdding: boolean;
  newCharText: string;
  draggingId: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setNewCharText: (value: string) => void;
  setIsAdding: (value: boolean) => void;
  submitNewChar: () => void;
  handleTextareaKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleCharClick: (id: string) => void;
  handleDragStart: (event: React.DragEvent<HTMLButtonElement>, id: string) => void;
  handleDragEnter: (id: string) => void;
  handleDragEnd: () => void;
};

function SpecialCharGrid(props: SpecialCharGridProps): React.ReactElement {
  const {
    allChars,
    mode,
    isAdding,
    newCharText,
    draggingId,
    textareaRef,
    setNewCharText,
    setIsAdding,
    submitNewChar,
    handleTextareaKeyDown,
    handleCharClick,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
  } = props;

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {allChars.map((char) => (
        <button
          type="button"
          key={char.id}
          draggable
          onClick={() => {
            handleCharClick(char.id);
          }}
          onDragStart={(event) => {
            handleDragStart(event, char.id);
          }}
          onDragEnter={() => {
            handleDragEnter(char.id);
          }}
          onDragEnd={handleDragEnd}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          className={clsx(
            "group relative flex items-center justify-center",
            "h-12 rounded-lg text-sm transition-all duration-200",
            "outline-none active:scale-95 overflow-hidden",
            "cursor-grab active:cursor-grabbing",
            draggingId === char.id && "opacity-60 ring-2 ring-primary/30",
            mode === "select"
              ? char.isFavorite
                ? ["bg-[var(--brand-leaf-faint)]", "text-[var(--brand-leaf)]", "hover:opacity-80"]
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
      {mode === "select" && (
        <div className="relative h-12">
          {isAdding ? (
            <textarea
              ref={textareaRef}
              value={newCharText}
              onChange={(event) => {
                setNewCharText(event.target.value);
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
  );
}

function useSpecialCharInput(options: {
  onClose: () => void;
  isAdding: boolean;
  newCharText: string;
  setIsAdding: (value: boolean) => void;
  setNewCharText: (value: string) => void;
  addChar: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}): {
  submitNewChar: () => void;
  handleTextareaKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
} {
  const { onClose, isAdding, newCharText, setIsAdding, setNewCharText, addChar, textareaRef } =
    options;

  useEffect(() => {
    if (isAdding && textareaRef.current) textareaRef.current.focus();
  }, [isAdding, textareaRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isKeyboardComposing(event)) return;
      if (!isAdding && event.key === "Escape") onClose();
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

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (isKeyboardComposing(event.nativeEvent)) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitNewChar();
    }
    if (event.key === "Escape") {
      setIsAdding(false);
      setNewCharText("");
    }
  };

  return { submitNewChar, handleTextareaKeyDown };
}

function useSpecialCharDrag(options: {
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  reorderChars: (activeId: string, overId: string) => void;
}): {
  didDragRef: React.RefObject<boolean>;
  handleDragStart: (event: React.DragEvent<HTMLButtonElement>, id: string) => void;
  handleDragEnter: (id: string) => void;
  handleDragEnd: () => void;
} {
  const { draggingId, setDraggingId, reorderChars } = options;
  const didDragRef = useRef(false);
  const lastDragOverIdRef = useRef<string | null>(null);

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, id: string): void => {
    didDragRef.current = false;
    lastDragOverIdRef.current = null;
    setDraggingId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleDragEnter = (id: string): void => {
    if (!draggingId || draggingId === id || lastDragOverIdRef.current === id) return;
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

  return { didDragRef, handleDragStart, handleDragEnter, handleDragEnd };
}

function handleSpecialCharClick(
  id: string,
  didDrag: boolean,
  mode: Mode,
  toggleFavorite: (id: string) => void,
  deleteChar: (id: string) => void,
): void {
  if (didDrag) return;
  if (mode === "select") toggleFavorite(id);
  else deleteChar(id);
}

export function SpecialCharPanel({ onClose }: Props): React.ReactElement {
  const { allChars, addChar, deleteChar, toggleFavorite, reorderChars } = useSpecialChars();

  const [mode, setMode] = useState<Mode>("select");
  const [isAdding, setIsAdding] = useState(false);
  const [newCharText, setNewCharText] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submitNewChar, handleTextareaKeyDown } = useSpecialCharInput({
    onClose,
    isAdding,
    newCharText,
    setIsAdding,
    setNewCharText,
    addChar,
    textareaRef,
  });
  const { didDragRef, handleDragStart, handleDragEnter, handleDragEnd } = useSpecialCharDrag({
    draggingId,
    setDraggingId,
    reorderChars,
  });

  const handleCharClick = (id: string): void => {
    handleSpecialCharClick(id, didDragRef.current, mode, toggleFavorite, deleteChar);
  };

  const handleModeChange = (next: Mode): void => {
    setMode(next);
    setIsAdding(false);
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
          <SpecialCharGrid
            allChars={allChars}
            mode={mode}
            isAdding={isAdding}
            newCharText={newCharText}
            draggingId={draggingId}
            textareaRef={textareaRef}
            setNewCharText={setNewCharText}
            setIsAdding={setIsAdding}
            submitNewChar={submitNewChar}
            handleTextareaKeyDown={handleTextareaKeyDown}
            handleCharClick={handleCharClick}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragEnd={handleDragEnd}
          />

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
