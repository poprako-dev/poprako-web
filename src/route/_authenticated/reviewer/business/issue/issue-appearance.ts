const palette = [
  { color: "var(--surface-pink-300)", border: "var(--line-pink-400)" },
  { color: "var(--surface-amber-300)", border: "var(--line-amber-400)" },
  { color: "var(--surface-orange-300)", border: "var(--line-orange-400)" },
  { color: "var(--surface-emerald-400)", border: "var(--line-emerald-300)" },
  { color: "var(--surface-slate-300)", border: "var(--line-slate-400)" },
] as const;
/** Stable across pages and filtering, including custom problem types. */
export function issueAppearance(type: string): { color: string; border: string } {
  let hash = 0;
  for (const character of type.normalize("NFC").trim()) {
    hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return palette[hash % palette.length] ?? palette[0];
}
