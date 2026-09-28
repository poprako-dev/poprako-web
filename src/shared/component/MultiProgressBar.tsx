import clsx from "clsx";
import type { ReactElement } from "react";

export type BarArgs = {
  progressPercent: number;
  /** Stable CSS color token unique within one bar list. */
  barColor: string;
};

type Props = {
  bars: readonly BarArgs[];
  /** Fixed width in rem; ignored when fullWidth is true. */
  width?: number;
  height?: number;
  fullWidth?: boolean;
};

export function MultiProgressBar({
  bars,
  width = 300,
  height = 8,
  fullWidth = false,
}: Props): ReactElement {
  return (
    <div
      className={clsx(
        "relative flex",
        "overflow-hidden rounded-sm bg-surface-gray-200",
        "shadow-sm shadow-shadow-slate-200",
        "border border-line-slate-200",
      )}
      style={{ width: fullWidth ? "100%" : String(width) + "rem", height: String(height) + "rem" }}
    >
      {bars.map((bar, index) => (
        <div
          key={bar.barColor}
          style={{
            width: `${String(Math.max(0, Math.min(100, bar.progressPercent)))}%`,
            zIndex: index + 1,
            backgroundColor: bar.barColor,
          }}
          className={clsx(
            "absolute top-0 left-0 h-full",
            "transition-all duration-500 ease-in-out",
          )}
        />
      ))}
    </div>
  );
}
