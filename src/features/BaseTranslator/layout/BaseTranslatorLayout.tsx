import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  canvas: ReactNode;
  sidebar: ReactNode;
};

export default function BaseTranslatorLayout({ canvas, sidebar }: Props) {
  return (
    <div className="flex w-full h-full overflow-hidden portrait:flex-col">
      <div
        className={clsx(
          "flex-1 overflow-hidden bg-stone-100",
          "portrait:min-h-0",
          "landscape:min-w-0",
        )}
      >
        {canvas}
      </div>
      <div
        className={clsx(
          "shrink-0 flex flex-col overflow-hidden bg-stone-50",
          "portrait:h-50 portrait:border-t portrait:border-stone-200",
          "landscape:w-95 landscape:border-l landscape:border-stone-200",
        )}
      >
        {sidebar}
      </div>
    </div>
  );
}
