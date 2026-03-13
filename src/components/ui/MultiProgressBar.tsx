import clsx from "clsx";
import type React from "react";

export type BarArgs = {
  progressPercent: number;
  barColorClass?: string;
};

export type Props = {
  bars: BarArgs[];
  /** 以 rem 为单位，整个进度条容器的宽度，默认  75 rem */
  width?: number;
  /** 以 rem 为单位，整个进度条容器的高度，默认 2 rem */
  height?: number;
  /** 为 true 时宽度 100% 自适应父容器，忽略 width */
  fullWidth?: boolean;
};

export default function MultiProgressBar({
  bars = [],
  width = 300,
  height = 8,
  fullWidth = false,
}: Props) {
  const sizeStyle: React.CSSProperties = {
    width: fullWidth ? "100%" : `${width}rem`,
    height: `${height}rem`,
  };

  return (
    // Container background.
    <div
      className={clsx(
        "relative flex",
        "overflow-hidden rounded-sm bg-gray-200",
        "shadow-sm shadow-slate-200",
        "border border-slate-200",
      )}
      style={sizeStyle}
    >
      {bars.map((bar, index) => {
        const width = Math.max(0, Math.min(100, bar.progressPercent));

        const colorStyle = bar.barColorClass || "bg-blue-500";

        return (
          <div
            key={index}
            style={{
              width: `${width}%`,
              zIndex: index + 1,
            }}
            className={clsx(
              "absolute top-0 left-0 h-full",
              "transition-all duration-500 ease-in-out",
              colorStyle,
            )}
          />
        );
      })}
    </div>
  );
}
