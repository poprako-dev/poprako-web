import type { ReactNode } from "react";

type Props = {
  canvas: ReactNode;
  sidebar: ReactNode;
};

export default function BaseTranslatorLayout({ canvas, sidebar }: Props) {
  return (
    <div className="flex w-full h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-hidden">{canvas}</div>
      <div className="w-95 shrink-0 flex flex-col border-l border-border overflow-hidden">
        {sidebar}
      </div>
    </div>
  );
}
