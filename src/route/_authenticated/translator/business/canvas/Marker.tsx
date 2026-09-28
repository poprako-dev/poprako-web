import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import clsx from "clsx";

export const CIRCLE_SIZE = 32;
export const DOT_SIZE = 8;
export const PIN_OFFSET = CIRCLE_SIZE + DOT_SIZE - 2;

type Props = {
  index: number;
  isBubble: boolean;
  isCompleted: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dimmed: boolean;
};

export function Marker({
  index,
  isBubble,
  isCompleted,
  isSelected,
  isDragging,
  dimmed,
}: Props): TranslatorImportedType0.Element {
  return (
    <div
      className={`flex flex-col items-center select-none ${
        isSelected ? "z-30" : "z-10"
      } ${isDragging ? "cursor-grabbing opacity-80" : "cursor-pointer"}`}
      style={{
        width: `${String(CIRCLE_SIZE)}px`,
        transform: isDragging ? "scale(1.1)" : undefined,
        transition: isDragging ? "none" : "transform 0.15s ease-out, opacity 0.15s ease-out",
      }}
    >
      <div
        className={clsx(
          "relative rounded-full flex items-center justify-center",
          "border-2 shadow-lg",
          isBubble
            ? dimmed
              ? "bg-marker-bubble/40 border-marker-bubble-border/40"
              : "bg-marker-bubble/80 border-marker-bubble-border/70"
            : dimmed
              ? "bg-marker-note/40 border-marker-note-border/40"
              : "bg-marker-note/80 border-marker-note-border/70",
          isSelected && "ring-4 ring-status-info/10",
        )}
        style={{
          width: `${String(CIRCLE_SIZE)}px`,
          height: `${String(CIRCLE_SIZE)}px`,
          borderColor: isSelected
            ? "var(--primary)"
            : isCompleted
              ? "var(--status-success)"
              : undefined,
          transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <span className="text-[13px] font-black text-foreground tabular-nums leading-none">
          {index + 1}
        </span>
      </div>
      <div
        className={clsx(
          "rounded-full -mt-px shadow-sm border-2 border-foreground/20",
          isBubble
            ? dimmed
              ? "bg-marker-bubble/40"
              : "bg-marker-bubble/80"
            : dimmed
              ? "bg-marker-note/40"
              : "bg-marker-note/80",
        )}
        style={{
          width: `${String(DOT_SIZE)}px`,
          height: `${String(DOT_SIZE)}px`,
        }}
      />
    </div>
  );
}
