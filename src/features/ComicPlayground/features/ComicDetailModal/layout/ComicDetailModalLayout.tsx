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
        {/*
         * Desktop (sm+): sidebar | pageGrid side-by-side, each independently scrollable.
         * Mobile (<sm):  sidebar stacked above pageGrid; the whole area scrolls as one.
         */}
        <div
          className={clsx(
            "flex-1 min-h-0",
            /* mobile: single column, scrollable */
            "flex flex-col overflow-y-auto",
            /* desktop: two-column row, each child handles its own scroll */
            "sm:flex-row sm:overflow-hidden",
          )}
        >
          {/* Left sidebar */}
          <div
            className={clsx(
              "shrink-0 border-slate-100 p-2",
              "flex flex-col bg-white",
              /* mobile: full-width, no border, no inner scroll needed */
              "w-full border-b",
              /* desktop: fixed width, right border, independently scrollable */
              "sm:w-45 sm:border-b-0 sm:border-r sm:overflow-y-auto",
              "sm:scrollbar-thin sm:scrollbar-thumb-slate-200",
            )}
          >
            {sidebar}
          </div>

          {/* Page grid */}
          <div
            className={clsx(
              "bg-white p-4",
              /* mobile: natural height, no inner scroll (outer scrolls) */
              "w-full",
              /* desktop: fill remaining space, independently scrollable */
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
  );
}
