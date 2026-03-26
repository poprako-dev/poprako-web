import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  header: ReactNode;
  content: ReactNode;
  sidebar: ReactNode;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
};

export default function ComicListLayout({
  header,
  content,
  sidebar,
  isSidebarOpen,
  onCloseSidebar,
}: Props) {
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* 主内容区域 */}
      <div
        className={clsx(
          "flex min-w-0 flex-1 flex-col overflow-hidden",
          "px-4 py-4 md:px-6 md:py-6",
        )}
      >
        <div className="shrink-0">{header}</div>
        <div className="mt-2 min-h-0 flex-1 overflow-hidden">{content}</div>
      </div>

      {/* sm 下遮罩层 */}
      {isSidebarOpen && (
        <div
          className={clsx(
            "fixed inset-0 z-40 bg-slate-900/10",
            "transition-opacity md:hidden",
          )}
          onClick={onCloseSidebar}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={clsx(
          "shrink-0 overflow-hidden transition-all",
          "duration-300 ease-in-out",
          // md 及以上：内联侧边栏
          "max-md:fixed max-md:right-0 max-md:top-0",
          "max-md:z-50 max-md:h-full",
          isSidebarOpen ? "max-md:translate-x-0" : "max-md:translate-x-full",
          isSidebarOpen
            ? "md:w-56 md:border-l md:border-border"
            : "md:w-0 md:border-transparent",
        )}
      >
        {sidebar}
      </aside>
    </div>
  );
}
