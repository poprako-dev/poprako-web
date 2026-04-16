import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  header: ReactNode;
  sidebar: ReactNode;
  pageGrid: ReactNode;
  footer: ReactNode;
};

export default function ComicDetailModalLayout({
  header,
  sidebar,
  pageGrid,
  footer,
}: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div
        className={clsx(
          "relative w-full max-w-240 h-[85vh]",
          "bg-white rounded-sm border border-slate-200",
          "shadow-md",
          "flex flex-col overflow-hidden transition-all duration-300",
        )}
      >
        {/* Header – always fixed at top */}
        <div
          className={clsx(
            "flex justify-between items-center px-5 py-2",
            "border-b border-slate-100 shrink-0 bg-slate-50",
          )}
        >
          {header}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            className={clsx(
              "flex-1 min-h-0",
              "flex flex-col overflow-y-auto",
              "sm:flex-row sm:overflow-hidden",
            )}
          >
            <div
              className={clsx(
                "shrink-0 border-slate-100 p-2",
                "flex flex-col bg-white",
                "w-full border-b",
                "sm:w-45 sm:border-b-0 sm:border-r sm:overflow-y-auto",
                "sm:scrollbar-thin sm:scrollbar-thumb-slate-200",
              )}
            >
              {sidebar}
            </div>

            <div
              className={clsx(
                "bg-white p-4",
                "w-full",
                "sm:flex-1 sm:overflow-y-auto",
                "sm:scrollbar-thin sm:scrollbar-thumb-slate-200",
              )}
            >
              {pageGrid}
            </div>
          </div>

          {/* Footer – always fixed at bottom */}
          <div className="shrink-0">{footer}</div>
        </div>
      </div>
    </div>
  );
}
