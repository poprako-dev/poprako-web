export type AccessibilityViolation = {
  id: string;
  nodes: {
    target: unknown;
    any: { id: string; data: unknown }[];
    all?: unknown[];
    none?: unknown[];
  }[];
};

export type ContrastEntry = { target: string; checks: string; count: number };

const CONTRAST_DATA_FIELDS = [
  "fgColor",
  "bgColor",
  "contrastRatio",
  "fontSize",
  "fontWeight",
  "expectedContrastRatio",
] as const;

type ContrastCheck = { id: string; data: Record<string, unknown> };

function fingerprintTarget(target: unknown): string | undefined {
  try {
    const serialized = JSON.stringify(target);
    return serialized.replace(/#radix-[^ .>+,"\\]+/gu, "#radix-generated");
  } catch {
    return undefined;
  }
}

function contrastCheck(value: unknown): ContrastCheck | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (record["id"] !== "color-contrast") return undefined;
  const rawData = record["data"];
  if (typeof rawData !== "object" || rawData === null || Array.isArray(rawData)) return undefined;
  const source = rawData as Record<string, unknown>;
  if (!CONTRAST_DATA_FIELDS.every((field) => Object.hasOwn(source, field))) {
    return undefined;
  }
  if (
    typeof source["fgColor"] !== "string" ||
    !/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/iu.test(source["fgColor"]) ||
    typeof source["bgColor"] !== "string" ||
    !/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/iu.test(source["bgColor"]) ||
    typeof source["contrastRatio"] !== "number" ||
    !Number.isFinite(source["contrastRatio"]) ||
    source["contrastRatio"] <= 0 ||
    typeof source["fontSize"] !== "string" ||
    !/^\d+(?:\.\d+)?pt \(\d+(?:\.\d+)?px\)$/u.test(source["fontSize"]) ||
    typeof source["fontWeight"] !== "string" ||
    !/^(?:normal|bold|[1-9]00)$/u.test(source["fontWeight"]) ||
    typeof source["expectedContrastRatio"] !== "string" ||
    !/^\d+(?:\.\d+)?:1$/u.test(source["expectedContrastRatio"])
  ) {
    return undefined;
  }
  const data = Object.fromEntries(CONTRAST_DATA_FIELDS.map((field) => [field, source[field]]));
  try {
    JSON.stringify(data);
  } catch {
    return undefined;
  }
  return { id: record["id"], data };
}

function entryForNode(node: AccessibilityViolation["nodes"][number]): ContrastEntry | undefined {
  const target = fingerprintTarget(node.target);
  if (
    target === undefined ||
    !Array.isArray(node.any) ||
    node.any.length === 0 ||
    (node.all?.length ?? 0) > 0 ||
    (node.none?.length ?? 0) > 0
  )
    return undefined;
  const checks = node.any.map(contrastCheck);
  if (checks.some((check) => check === undefined)) return undefined;
  const serializedChecks = JSON.stringify(checks);
  return { target, checks: serializedChecks, count: 1 };
}

function entryKey(entry: Pick<ContrastEntry, "target" | "checks">): string {
  return JSON.stringify([entry.target, entry.checks]);
}

export function contrastEntries(violations: AccessibilityViolation[]): ContrastEntry[] {
  const entries = new Map<string, ContrastEntry>();
  for (const violation of violations) {
    if (violation.id !== "color-contrast" || !Array.isArray(violation.nodes)) {
      continue;
    }
    for (const node of violation.nodes) {
      const entry = entryForNode(node);
      if (!entry) continue;
      const key = entryKey(entry);
      const existing = entries.get(key);
      if (existing) existing.count += 1;
      else entries.set(key, entry);
    }
  }
  return [...entries.values()];
}

export function compareContrastBaseline(
  storyId: string,
  violations: AccessibilityViolation[],
  baseline: Record<string, ContrastEntry[]>,
): { known: number; unexpected: string[] } {
  const allowance = new Map<string, number>();
  for (const entry of baseline[storyId] ?? []) {
    if (Number.isInteger(entry.count) && entry.count > 0) {
      const key = entryKey(entry);
      allowance.set(key, (allowance.get(key) ?? 0) + entry.count);
    }
  }

  let known = 0;
  const consumed = new Map<string, number>();
  const unexpected: string[] = [];
  for (const violation of violations) {
    if (violation.id !== "color-contrast") {
      unexpected.push(`${storyId}: unexpected accessibility rule ${violation.id}`);
      continue;
    }
    for (const node of violation.nodes) {
      const entry = entryForNode(node);
      if (!entry) {
        unexpected.push(`${storyId}: invalid or unrecorded color-contrast node`);
        continue;
      }
      const key = entryKey(entry);
      const used = consumed.get(key) ?? 0;
      if (used < (allowance.get(key) ?? 0)) {
        consumed.set(key, used + 1);
        known += 1;
      } else {
        unexpected.push(`${storyId}: unexpected color-contrast at ${entry.target}`);
      }
    }
  }
  return { known, unexpected };
}
