import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  header: ReactNode;
  sidebar: ReactNode;
  pageGrid: ReactNode;
  footer: ReactNode;
  assignmentGroup?: ReactNode;
};

export default function ComicDetailModalLayout({
  header,
  sidebar,
  pageGrid,
  footer,
  assignmentGroup,
}: Props) {
  return (
    <div className={clsx(
      "fixed inset-0 z-80 flex items-center justify-center p-4 backdrop-blur-sm",
      "bg-stone-950/25",
    )}>
      <div
        className={clsx(
          "relative w-full max-w-240 h-[85vh]",
          "bg-stone-50 rounded-sm border border-stone-200",
          "shadow-xl",
          "flex flex-col overflow-hidden transition-all duration-300",
        )}
      >
        {/* Header – warm anchor tier */}
        <div
          className={clsx(
            "flex justify-between items-center px-5 py-2.5",
            "border-b border-stone-300 shrink-0 bg-stone-200",
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
            {/* Sidebar – warm white */}
            <div
              className={clsx(
                "shrink-0 border-stone-200 p-2",
                "flex flex-col bg-stone-50",
                "w-full border-b",
                "sm:w-45 sm:border-b-0 sm:border-r sm:overflow-y-auto",
                "sm:scrollbar-thin sm:scrollbar-thumb-stone-200",
              )}
            >
              {sidebar}
            </div>

            {/* Content – persistent progress workspace above the page canvas */}
            <div
              className={clsx(
                "w-full",
                "sm:flex sm:min-w-0 sm:flex-1 sm:flex-col sm:overflow-hidden",
              )}
            >
              <div className="hidden shrink-0 md:block">{assignmentGroup}</div>
              <div
                className={clsx(
                  "bg-stone-100 p-4",
                  "shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]",
                  "sm:min-h-0 sm:flex-1 sm:overflow-y-auto",
                  "scrollbar-thin scrollbar-thumb-stone-300",
                )}
              >
                {pageGrid}
              </div>
            </div>
          </div>

          {/* Footer – assignment footer for sm screens only */}
          <div className="absolute bottom-0 left-0 right-0 z-10 md:hidden">{footer}</div>
        </div>
      </div>
    </div>
  );
}
