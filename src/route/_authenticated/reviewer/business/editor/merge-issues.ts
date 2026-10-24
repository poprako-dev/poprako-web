import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { normalizeIssues } from "./review-editing";

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeFields(base: IssueInfo, local: IssueInfo, remote: IssueInfo): IssueInfo {
  return {
    ...remote,
    variant: local.variant === base.variant ? remote.variant : local.variant,
    note: local.note === base.note ? remote.note : local.note,
    rect: sameValue(local.rect, base.rect) ? remote.rect : local.rect,
  };
}

/** Match Unit's local-priority merge, treating a rectangle as one value. */
export function mergeIssues(
  baseline: IssueInfo[],
  local: IssueInfo[],
  remote: IssueInfo[],
): IssueInfo[] {
  const bases = new Map(baseline.map((issue) => [issue.id, issue]));
  const locals = new Map(local.map((issue) => [issue.id, issue]));
  const merged = remote.flatMap((issue) => {
    const base = bases.get(issue.id);
    const own = locals.get(issue.id);
    if (base && !own) return [];
    return [base && own ? mergeFields(base, own, issue) : (own ?? issue)];
  });
  for (const issue of local) {
    const base = bases.get(issue.id);
    const changed = base && !sameValue(mergeFields(base, issue, base), base);
    if (!merged.some((item) => item.id === issue.id) && (!base || changed)) merged.push(issue);
  }
  return mergeOrder(baseline, local, merged);
}

function mergeOrder(base: IssueInfo[], local: IssueInfo[], merged: IssueInfo[]): IssueInfo[] {
  const localIds = new Set(local.map((issue) => issue.id));
  const baseIds = new Set(base.map((issue) => issue.id));
  const oldOrder = base.filter((issue) => localIds.has(issue.id));
  const newOrder = local.filter((issue) => baseIds.has(issue.id));
  const moved = oldOrder.some((issue, index) => issue.id !== newOrder[index]?.id);
  if (moved || local.some((issue) => !baseIds.has(issue.id))) {
    let anchor: string | undefined;
    for (const issue of [...local].reverse()) {
      const index = merged.findIndex((item) => item.id === issue.id);
      if (index < 0) continue;
      const item = merged.splice(index, 1)[0];
      if (!item) continue;
      const next = merged.findIndex((entry) => entry.id === anchor);
      merged.splice(next < 0 ? merged.length : next, 0, item);
      anchor = issue.id;
    }
  }
  return normalizeIssues(merged);
}
