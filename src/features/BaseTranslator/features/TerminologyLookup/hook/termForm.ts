export function validateTermTargets(targets: string[]) {
  const normalized = targets.map((target) => target.trim());
  if (normalized.length === 0 || normalized.some((target) => target.length === 0)) {
    return "译名不能为空";
  }

  const unique = new Set(normalized.map((target) => target.toLocaleLowerCase()));
  return unique.size === normalized.length ? undefined : "译名不能重复";
}

export function moveTermTarget(items: string[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}
