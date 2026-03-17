import { Trees } from "lucide-react";
import clsx from "clsx";

export default function TitleHeader() {
  return (
    <div className="relative flex h-16 w-full items-center mb-1">
      <div
        className={clsx(
          "relative z-10 flex w-14 shrink-0",
          "items-center justify-center",
        )}
      >
        <Trees className="h-7 w-7 text-green-500" />
      </div>

      <span
        className={clsx(
          "absolute left-14 whitespace-nowrap",
          "text-lg font-black tracking-tighter",
          "text-gray-800",
          "opacity-0 transition-opacity",
          "duration-100 delay-0",
          "group-hover:opacity-100",
          "group-hover:duration-300",
          "group-hover:delay-150",
        )}
      >
        POPRAKO - W
      </span>
    </div>
  );
}
