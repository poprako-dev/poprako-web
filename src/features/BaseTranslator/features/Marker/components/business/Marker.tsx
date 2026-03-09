const CIRCLE_SIZE = 32;
const DOT_SIZE = 8;
const PIN_OFFSET = CIRCLE_SIZE + DOT_SIZE - 2;

type Props = {
  index: number;
  isBubble: boolean;
  isCompleted: boolean;
  isSelected: boolean;
  isDragging: boolean;
  previewText: string | null;
  withPreview: boolean;
};

export default function Marker({
  index,
  isBubble,
  isCompleted,
  isSelected,
  isDragging,
  previewText,
  withPreview,
}: Props) {
  const bgClass = isBubble ? "bg-pink-100" : "bg-amber-100";

  return (
    <div
      className={`flex flex-col items-center select-none ${
        isSelected ? "z-30" : "z-10"
      } ${isDragging ? "cursor-grabbing opacity-80" : "cursor-pointer"}`}
      style={{
        width: `${CIRCLE_SIZE}px`,
        transform: `translate(-50%, -${PIN_OFFSET}px)${
          isDragging ? " scale(1.1)" : ""
        }`,
        transition: isDragging
          ? "none"
          : "transform 0.15s ease-out, opacity 0.15s ease-out",
      }}
    >
      <div
        className={`relative rounded-full flex items-center justify-center border-2 shadow-lg ${
          bgClass
        } ${isSelected ? "ring-4 ring-blue-500/10" : ""}`}
        style={{
          width: `${CIRCLE_SIZE}px`,
          height: `${CIRCLE_SIZE}px`,
          borderColor: isSelected
            ? "#3b82f6"
            : isCompleted
              ? "var(--color-green-500)"
              : "transparent",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        {withPreview && isSelected && previewText && !isDragging && (
          <div className="absolute left-full top-0 ml-3 z-50 pointer-events-none">
            <div className="px-2 py-1 rounded-sm bg-slate-800/90 text-slate-50 text-xs backdrop-blur-md shadow-xl border border-white/10 whitespace-pre">
              {previewText}
            </div>
          </div>
        )}
        <span className="text-[11px] font-bold text-slate-700 tabular-nums leading-none">
          {(index + 1).toString().padStart(2, "0")}
        </span>
      </div>
      <div
        className={`rounded-full -mt-px shadow-sm border-2 border-black/10 ${bgClass}`}
        style={{ width: `${DOT_SIZE}px`, height: `${DOT_SIZE}px` }}
      />
    </div>
  );
}
