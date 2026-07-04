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

export default function Marker({
  index,
  isBubble,
  isCompleted,
  isSelected,
  isDragging,
  dimmed,
}: Props) {
  return (
    <div
      className={`flex flex-col items-center select-none ${
        isSelected ? "z-30" : "z-10"
      } ${isDragging ? "cursor-grabbing opacity-80" : "cursor-pointer"}`}
      style={{
        width: `${CIRCLE_SIZE}px`,
        transform: isDragging ? "scale(1.1)" : undefined,
        transition: isDragging
          ? "none"
          : "transform 0.15s ease-out, opacity 0.15s ease-out",
      }}
    >
      <div
        className={clsx(
          "relative rounded-full flex items-center justify-center",
          "border-2 shadow-lg",
          isBubble
            ? dimmed
              ? "bg-pink-300/40 border-pink-400/40"
              : "bg-pink-300/80 border-pink-400/70"
            : dimmed
              ? "bg-amber-300/40 border-amber-400/40"
              : "bg-amber-300/80 border-amber-400/70",
          isSelected && "ring-4 ring-blue-500/10",
        )}
        style={{
          width: `${CIRCLE_SIZE}px`,
          height: `${CIRCLE_SIZE}px`,
          borderColor: isSelected
            ? "#3b82f6"
            : isCompleted
              ? "var(--color-green-500)"
              : undefined,
          transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <span className="text-[13px] font-black text-white tabular-nums leading-none">
          {index + 1}
        </span>
      </div>
      <div
        className={clsx(
          "rounded-full -mt-px shadow-sm border-2 border-black/20",
          isBubble
            ? dimmed
              ? "bg-pink-300/40"
              : "bg-pink-300/80"
            : dimmed
              ? "bg-amber-300/40"
              : "bg-amber-300/80",
        )}
        style={{ width: `${DOT_SIZE}px`, height: `${DOT_SIZE}px` }}
      />
    </div>
  );
}
