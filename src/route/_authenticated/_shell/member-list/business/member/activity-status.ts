const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getMemberActivityColor(lastActiveAt: number | undefined, now = Date.now()): string {
  if (!lastActiveAt) return "bg-surface-stone-300";

  const daysSinceLastActive = (now - lastActiveAt) / DAY_IN_MS;
  if (daysSinceLastActive <= 7) return "bg-activity-recent";
  if (daysSinceLastActive <= 30) return "bg-surface-amber-200";
  return "bg-surface-stone-300";
}
