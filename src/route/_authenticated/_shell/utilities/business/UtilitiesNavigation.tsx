import { useRef, useState, type ReactElement, type RefObject } from "react";
import {
  BookOpenText,
  ChevronDown,
  FileArchive,
  FolderOpen,
  LoaderCircle,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import type { TeamTerminologyHandle } from "./TeamTerminologyTool";

import { archiveTools, type UtilityMode } from "./utility-mode";
const rowClass =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring";
const inactiveClass = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
const activeClass = "bg-surface-green-50 font-semibold text-text-green";

type Props = {
  mode: UtilityMode;
  onSelect: (mode: UtilityMode) => void;
  teamId: string | undefined;
  canEdit: boolean;
  toolRef: RefObject<TeamTerminologyHandle | null>;
};

function ImportTeamTermbase({ toolRef }: Pick<Props, "toolRef">): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [pending, setPending] = useState(false);
  async function importFile(file: File): Promise<void> {
    const tool = toolRef.current;
    if (!tool || busyRef.current) return;
    busyRef.current = true;
    setPending(true);
    try {
      await tool.importFile(file);
    } finally {
      busyRef.current = false;
      setPending(false);
    }
  }
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="选择团队术语库 JSON 文件"
        disabled={pending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void importFile(file);
        }}
      />
      <button
        type="button"
        disabled={pending}
        aria-label="导入术语库"
        aria-busy={pending}
        onClick={() => inputRef.current?.click()}
        className={clsx(rowClass, inactiveClass, "disabled:opacity-50")}
      >
        {pending ? (
          <LoaderCircle size={15} className="animate-spin" aria-label="正在导入术语库" />
        ) : (
          <Upload size={15} aria-hidden="true" />
        )}
        导入术语库
      </button>
    </>
  );
}

export function UtilitiesNavigation({
  mode,
  onSelect,
  teamId,
  canEdit,
  toolRef,
}: Props): ReactElement {
  return (
    <nav
      aria-label="实用工具"
      className="shrink-0 border-b border-border/70 pb-3 md:w-60 md:border-r md:border-b-0 md:pr-6 md:pb-0"
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
                onSelect(item.id);
              }}
              className={clsx(rowClass, mode === item.id ? activeClass : inactiveClass)}
            >
              <FileArchive size={15} className="shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="mb-1 mt-4 flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <ChevronDown size={13} aria-hidden="true" />
        <FolderOpen size={16} aria-hidden="true" />
        <h2 className="font-medium">术语库</h2>
      </div>
      <ul className="ml-1.5 space-y-1 border-l border-border/70 pl-3">
        <li>
          <button
            type="button"
            aria-pressed={mode === "termbases"}
            onClick={() => {
              onSelect("termbases");
            }}
            className={clsx(rowClass, mode === "termbases" ? activeClass : inactiveClass)}
          >
            <BookOpenText size={15} aria-hidden="true" />
            查看术语库
          </button>
        </li>
        {canEdit && (
          <li>
            <ImportTeamTermbase key={teamId} toolRef={toolRef} />
          </li>
        )}
      </ul>
    </nav>
  );
}
