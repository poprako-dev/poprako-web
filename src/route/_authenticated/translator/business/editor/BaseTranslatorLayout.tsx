import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  canvas: ReactNode;
  sidebar: ReactNode;
};

export function BaseTranslatorLayout({ canvas, sidebar }: Props): TranslatorImportedType0.Element {
  return (
    <div className="flex w-full h-full overflow-hidden portrait:flex-col">
      <div
        className={clsx(
          "flex-1 overflow-hidden bg-surface-stone-100",
          "portrait:min-h-0",
          "landscape:min-w-0",
        )}
      >
        {canvas}
      </div>
      <div
        className={clsx(
          "shrink-0 flex flex-col overflow-hidden bg-surface-stone-50",
          "portrait:h-2/5 portrait:border-t portrait:border-line-stone-200",
          "sm:portrait:h-50",
          "landscape:w-1/3 landscape:min-w-95",
          "landscape:border-l landscape:border-line-stone-200",
        )}
      >
        {sidebar}
      </div>
    </div>
  );
}
