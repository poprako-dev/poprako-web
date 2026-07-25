export type FixedShortcut = {
  label: string;
  keys: string[];
};

export type ShortcutAction =
  | "toggleMode"
  | "toggleRelocation"
  | "toggleProofreadPreview"
  | "nextMarker"
  | "prevMarker"
  | "pageUp"
  | "pageDown"
  | "quickSpecialChar"
  | "quickSpecialChar1"
  | "quickSpecialChar2"
  | "quickSpecialChar3"
  | "save";

export type ConfigurableShortcut = {
  action: ShortcutAction;
  label: string;
  keys: string[];
};

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

const DISPLAY_KEY_MAP: Record<string, string> = {
  Control: "Ctrl",
  Meta: "Cmd",
};

export function formatKeys(keys: string[]): string {
  return keys
    .map((k) => {
      if (k === "Alt" && navigator.platform.includes("Mac")) return "Opt";
      return DISPLAY_KEY_MAP[k] ?? k;
    })
    .map((s) => s.toUpperCase())
    .join(" + ");
}

export function matchesShortcut(e: KeyboardEvent, keys: string[]): boolean {
  const modifiers = keys.filter((k) => MODIFIER_KEYS.has(k));
  const nonModifiers = keys.filter((k) => !MODIFIER_KEYS.has(k));
  if (nonModifiers.length !== 1) return false;

  const wantCtrl = modifiers.includes("Control");
  const wantShift = modifiers.includes("Shift");
  const wantAlt = modifiers.includes("Alt");
  const wantMeta = modifiers.includes("Meta");

  if (e.ctrlKey !== wantCtrl) return false;
  if (e.shiftKey !== wantShift) return false;
  if (e.altKey !== wantAlt) return false;
  if (e.metaKey !== wantMeta) return false;

  const expectedKey = nonModifiers[0];
  if (/^\d$/.test(expectedKey)) return e.code === `Digit${expectedKey}`;

  return e.key.toLowerCase() === expectedKey.toLowerCase();
}

export function hasConflict(
  shortcuts: ConfigurableShortcut[],
  index: number,
  newKeys: string[],
): boolean {
  const normalize = (keys: string[]) =>
    keys
      .map((k) => k.toLowerCase())
      .sort()
      .join("+");
  const newNorm = normalize(newKeys);
  return shortcuts.some((s, i) => i !== index && normalize(s.keys) === newNorm);
}
