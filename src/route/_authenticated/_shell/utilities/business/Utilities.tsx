import { type JSX, useState } from "react";
import { ChevronDown, FileArchive, FolderOpen, Wrench } from "lucide-react";
import clsx from "clsx";
import { ArchiveTool } from "@/route/_authenticated/_shell/utilities/business/ArchiveTool";
import { BoundedCompressionTool } from "@/route/_authenticated/_shell/utilities/business/BoundedCompressionTool";

const archiveTools = [
  { id: "compress", label: "打包并压缩嵌稿" },
  { id: "extract", label: "解压并解包嵌稿" },
  { id: "bounded", label: "定界压缩" },
] as const;

export function Utilities(): JSX.Element {
  const [mode, setMode] = useState<(typeof archiveTools)[number]["id"]>("compress");

  return (
    <div
      className={clsx(
        "mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden",
        "px-4 py-[clamp(0.75rem,3dvh,2rem)] text-foreground sm:px-6 lg:px-10",
      )}
    >
      <header className="mb-4 flex shrink-0 items-center gap-3">
        <Wrench size={22} strokeWidth={1.6} className="text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">实用工具</h1>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-8 lg:gap-10">
        <nav
          aria-label="实用工具"
          className={clsx(
            "shrink-0 border-b border-border/70 pb-3",
            "md:w-60 md:shrink-0 md:border-r md:border-b-0 md:pr-6 md:pb-0",
          )}
        >
          <div className="mb-1 flex items-center gap-2 py-1 text-sm text-muted-foreground">
            <ChevronDown size={13} aria-hidden="true" />
            <FolderOpen size={16} aria-hidden="true" />
            <h2 className="font-medium">文件压缩</h2>
          </div>
          <ul className="ml-1.5 space-y-1 border-l border-border/70 pl-3">
            {archiveTools.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={mode === item.id}
                  onClick={() => {
                    setMode(item.id);
                  }}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                    "transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                    mode === item.id
                      ? "bg-surface-green-50 font-semibold text-text-green"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <FileArchive size={15} className="shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {archiveTools.map((item) => (
          <div key={item.id} hidden={mode !== item.id} className="min-h-0 min-w-0 flex-1">
            {item.id === "bounded" ? <BoundedCompressionTool /> : <ArchiveTool mode={item.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
