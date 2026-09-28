import clsx from "clsx";
import type { ReactElement } from "react";

export type BarArgs = {
  progressPercent: number;
  /** CSS color or a theme variable, so the color survives production class extraction. */
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
      className={clsx("relative flex overflow-hidden rounded-sm border border-border bg-muted")}
      style={{ width: fullWidth ? "100%" : `${String(width)}rem`, height: `${String(height)}rem` }}
    >
      {bars.map((bar, index) => (
        <div
          key={JSON.stringify(bar)}
          style={{
            width: `${String(Math.max(0, Math.min(100, bar.progressPercent)))}%`,
            zIndex: index + 1,
            backgroundColor: bar.barColor,
          }}
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-in-out"
        />
      ))}
    </div>
  );
}
