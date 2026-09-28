import { Trees } from "lucide-react";
import clsx from "clsx";

export function TitleHeader(): ReactElement {
  return (
    <div className="relative flex h-16 w-full items-center mb-1">
      <div className={clsx("relative z-10 flex w-14 shrink-0", "items-center justify-center")}>
        <Trees className="h-7 w-7 text-green-700" />
      </div>

      <span
        className={clsx(
          "absolute left-14 whitespace-nowrap",
          "text-lg font-black tracking-tighter",
          "[text-shadow:0_0_0.45px_currentColor]",
          "text-[#3D3028]",
          "opacity-0 transition-opacity",
          "duration-100 delay-0",
          "group-hover:opacity-100",
          "group-hover:duration-300",
          "group-hover:delay-150",
        )}
      >
        白杨子 W
      </span>
    </div>
  );
}
import type { ReactElement } from "react";
