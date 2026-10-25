import type { ReactElement } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AppDialogAction } from "@/shared/component/AppDialog";

type Props = {
  year: number;
  latestMonth: string;
  months: readonly string[];
  onYearChange: (year: number) => void;
  onToggle: (month: string) => void;
};

export function ArchiveMonthPicker({
  year,
  latestMonth,
  months,
  onYearChange,
  onToggle,
}: Props): ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="上一年"
          disabled={year <= 1}
          onClick={() => {
            onYearChange(year - 1);
          }}
          className="rounded-md p-1 text-text-muted-cool hover:bg-surface-slate-100 disabled:opacity-50"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-ink-slate-700" aria-live="polite">
          {year} 年
        </span>
        <button
          type="button"
          aria-label="下一年"
          disabled={year >= Number(latestMonth.slice(0, 4))}
          onClick={() => {
            onYearChange(year + 1);
          }}
          className="rounded-md p-1 text-text-muted-cool hover:bg-surface-slate-100 disabled:opacity-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div role="group" aria-label="归档月份（UTC）" className="grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }, (_, index) => {
          const month = `${String(year).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`;
          const selected = months.includes(month);
          return (
            <AppDialogAction
              key={month}
              aria-label={`${String(year)} 年 ${String(index + 1)} 月`}
              aria-pressed={selected}
              tone={selected ? "brand" : "neutral"}
              disabled={month > latestMonth}
              onClick={() => {
                onToggle(month);
              }}
            >
              {index + 1} 月
            </AppDialogAction>
          );
        })}
      </div>
      {months.length > 0 && (
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto" aria-label="已选月份">
          {months.map((month) => (
            <button
              key={month}
              type="button"
              aria-label={`移除 ${month}`}
              onClick={() => {
                onToggle(month);
              }}
              className="flex items-center gap-1 rounded-md bg-surface-green-50 px-2 py-1 text-xs text-text-green hover:bg-surface-green-100"
            >
              {month}
              <X size={12} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
