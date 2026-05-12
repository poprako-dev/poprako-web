import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";
import clsx from "clsx";
import { useSpecialChars } from "@/hook/useSpecialChars";

type Mode = "select" | "delete";

type Props = {
  onClose: () => void;
};

export default function SpecialCharPanel({ onClose }: Props) {
  const { allChars, addChar, deleteChar, toggleFavorite } = useSpecialChars();

  const [mode, setMode] = useState<Mode>("select");
  const [isAdding, setIsAdding] = useState(false);
  const [newCharText, setNewCharText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isAdding) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isAdding]);

  const submitNewChar = () => {
    addChar(newCharText);
    setIsAdding(false);
    setNewCharText("");
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
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

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50",
        "flex items-center justify-center",
        "bg-black/20 backdrop-blur-[1px]",
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          "bg-background w-full max-w-md",
          "rounded-xl shadow-lg overflow-hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={clsx(
            "flex justify-between items-center",
            "px-4 py-2 border-b border-border",
          )}
        >
          <span className="text-sm font-medium text-foreground">
            特殊符号面板
          </span>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Mode Tabs */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center p-1 bg-muted rounded-xl gap-0.5">
              {(["select", "delete"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={clsx(
                    "px-5 py-1.5 text-sm rounded-[9px] transition-all duration-200 outline-none",
                    mode === m
                      ? "bg-background text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground",
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
                key={char.id}
                onClick={() => handleCharClick(char.id)}
                className={clsx(
                  "group relative flex items-center justify-center",
                  "h-12 rounded-lg text-sm transition-all duration-200",
                  "outline-none active:scale-95 overflow-hidden",
                  mode === "select"
                    ? char.isFavorite
                      ? [
                          "bg-[var(--color-green-50)]",
                          "text-[var(--color-green-500)]",
                          "hover:opacity-80",
                        ]
                      : [
                          "bg-muted text-muted-foreground",
                          "hover:bg-accent hover:text-foreground",
                        ]
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
                    onChange={(e) => setNewCharText(e.target.value)}
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
                  <button
                    onClick={() => setIsAdding(true)}
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
              ? "点击切换是否出现在符号栏中"
              : "点击符号将其删除"}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
