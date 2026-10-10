import { useEffect, useRef } from "react";
import type { JSX } from "react";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { IssueItem } from "./IssueItem";
type Props = {
  issues: IssueInfo[];
  focusedId: string | null;
  onSelect: (id: string) => void;
};
export function IssueList({ issues, focusedId, onSelect }: Props): JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest" });
  }, [focusedId]);
  return (
    <div
      ref={listRef}
      role="region"
      aria-label="issue 列表"
      className="h-full w-full overflow-y-auto bg-surface-stone-50"
    >
      {issues.map((issue) => (
        <IssueItem
          key={issue.id}
          issue={issue}
          isFocused={focusedId === issue.id}
          onSelect={onSelect}
        />
      ))}
      {issues.length === 0 && (
        <span role="status" className="block p-4 text-center text-sm text-text-muted-warm">
          本页没有 issue
        </span>
      )}
    </div>
  );
}
