import { useState, type ReactElement } from "react";
import { Download, FolderDown, LoaderCircle } from "lucide-react";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import { ArchiveMonthPicker } from "./ArchiveMonthPicker";
import { downloadArchive, type ExportArchives } from "./archive-export";
import { useArchiveExport } from "./use-archive-export";

type Props = {
  onExport: ExportArchives;
  onClose: () => void;
  now?: Date;
};

function previousMonth(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    .toISOString()
    .slice(0, 7);
}

export function ArchiveExportDialog({ onExport, onClose, now: initialNow }: Props): ReactElement {
  const [now] = useState(() => initialNow ?? new Date());
  const [trigger] = useState(() => document.activeElement);
  const [months, setMonths] = useState<string[]>(() => [previousMonth(now)]);
  const [year, setYear] = useState(() => Number(previousMonth(now).slice(0, 4)));
  const [all, setAll] = useState(false);
  const { state, start, cancel, reset } = useArchiveExport(onExport);
  const busy = state.phase === "busy";
  function toggleMonth(month: string): void {
    reset();
    setMonths((current) =>
      current.includes(month)
        ? current.filter((item) => item !== month)
        : [...current, month].sort(),
    );
  }
  function close(): void {
    cancel();
    onClose();
  }
  return (
    <AppDialog
      title="导出归档"
      onClose={close}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
      }}
      closeOnBackdrop={!busy}
      footer={
        <div className="flex gap-2">
          {busy ? (
            <AppDialogAction onClick={cancel}>取消导出</AppDialogAction>
          ) : state.phase === "ready" ? (
            <AppDialogAction
              tone="brand"
              onClick={() => {
                downloadArchive(state.archive);
              }}
            >
              <Download size={14} aria-hidden="true" />
              再次下载
            </AppDialogAction>
          ) : (
            <AppDialogAction
              tone="brand"
              disabled={!all && months.length === 0}
              onClick={() => void start(all ? undefined : months)}
            >
              <FolderDown size={14} aria-hidden="true" />
              {state.phase === "error" ? "重试" : all ? "导出全部归档" : "导出"}
            </AppDialogAction>
          )}
        </div>
      }
    >
      <div className="space-y-4" aria-busy={busy}>
        <fieldset disabled={busy} className="min-w-0 space-y-3 disabled:opacity-60">
          <legend className="sr-only">导出范围</legend>
          <div role="group" aria-label="导出范围" className="flex gap-2">
            {[false, true].map((value) => (
              <AppDialogAction
                key={String(value)}
                tone={all === value ? "brand" : "neutral"}
                aria-pressed={all === value}
                onClick={() => {
                  setAll(value);
                  reset();
                }}
              >
                {value ? "全部归档" : "指定月份"}
              </AppDialogAction>
            ))}
          </div>
          {!all && (
            <ArchiveMonthPicker
              year={year}
              latestMonth={now.toISOString().slice(0, 7)}
              months={months}
              onYearChange={setYear}
              onToggle={toggleMonth}
            />
          )}
        </fieldset>
        {busy && (
          <p
            role="status"
            className="flex items-center justify-center gap-2 text-xs text-text-muted-cool"
          >
            <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
            正在导出归档
          </p>
        )}
        {state.phase === "empty" && (
          <p role="status" className="text-center text-xs text-text-muted-cool">
            {all ? "暂无归档" : "所选月份暂无归档"}
          </p>
        )}
        {state.phase === "error" && (
          <p role="alert" className="text-center text-xs text-text-danger">
            {state.message}
          </p>
        )}
        {state.phase === "ready" && (
          <p role="status" className="text-center text-xs text-text-green">
            已导出 {state.archive.count} 部漫画
          </p>
        )}
      </div>
    </AppDialog>
  );
}
