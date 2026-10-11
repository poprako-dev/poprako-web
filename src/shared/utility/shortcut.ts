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

function normalizeShortcutKeys(keys: string[]): string {
  return [...keys]
    .map((key) => key.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join("+");
}

export function formatKeys(keys: string[]): string {
  return keys
    .map((k) => {
      if (k === "Alt" && navigator.userAgent.includes("Mac")) return "Opt";
      return DISPLAY_KEY_MAP[k] ?? k;
    })
    .map((s) => s.toUpperCase())
    .join(" + ");
}

export function isShortcutMatch(e: KeyboardEvent, keys: string[]): boolean {
  const nonModifiers = keys.filter((k) => !MODIFIER_KEYS.has(k));
  if (nonModifiers.length !== 1) return false;
  const modifiers = new Set(keys.filter((k) => MODIFIER_KEYS.has(k)));

  const isWantCtrl = modifiers.has("Control");

  if (e.ctrlKey !== isWantCtrl) return false;
  const isWantShift = modifiers.has("Shift");
  if (e.shiftKey !== isWantShift) return false;
  const isWantAlt = modifiers.has("Alt");
  if (e.altKey !== isWantAlt) return false;
  const isWantMeta = modifiers.has("Meta");
  if (e.metaKey !== isWantMeta) return false;

  const expectedKey = nonModifiers[0];
  if (!expectedKey) return false;
  if (/^\d$/.test(expectedKey)) return e.code === `Digit${expectedKey}`;

  return e.key.toLowerCase() === expectedKey.toLowerCase();
}

export function hasConflict(
  shortcuts: ConfigurableShortcut[],
  index: number,
  newKeys: string[],
): boolean {
  const newNorm = normalizeShortcutKeys(newKeys);
  return shortcuts.some(
    (shortcut, shortcutIndex) =>
      shortcutIndex !== index && normalizeShortcutKeys(shortcut.keys) === newNorm,
  );
}
