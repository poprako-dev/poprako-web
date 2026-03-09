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
          "flex-1 overflow-hidden",
          "portrait:min-h-0",
          "landscape:min-w-0",
        )}
      >
        {canvas}
      </div>
      <div
        className={clsx(
          "shrink-0 flex flex-col overflow-hidden",
          "portrait:h-50 portrait:border-t portrait:border-border",
          "landscape:w-95 landscape:border-l landscape:border-border",
        )}
      >
        {sidebar}
      </div>
    </div>
  );
}
