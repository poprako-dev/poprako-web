// Original values describe the reviewed 46dd776 theme; they are evidence, not a freeze gate.
const light = ["#ffffff", "#fefdf9", "#f1f5f9", "#f5f5f4", "#f4f4f4", "#f0f4e8", "#edf7f2"];

export const roles = [
  { token: "--text-muted-cool", original: "oklch(0.704 0.04 256.788)", backgrounds: light },
  { token: "--text-muted-warm", original: "oklch(0.709 0.01 56.259)", backgrounds: light },
  { token: "--text-muted-neutral", original: "oklch(0.707 0.022 261.325)", backgrounds: light },
  { token: "--text-leaf", original: "#88b04b", backgrounds: light },
  { token: "--text-green", original: "oklch(0.627 0.194 149.214)", backgrounds: light },
  {
    token: "--text-emerald",
    original: "oklch(0.765 0.177 163.223)",
    backgrounds: [...light, "#d1fae5"],
  },
  { token: "--text-danger", original: "#c46868", backgrounds: [...light, "#fbe5e5"] },
  {
    token: "--text-rose",
    original: "oklch(0.81 0.117 11.638)",
    backgrounds: [...light, "#fff1f2"],
  },
  {
    token: "--text-warning",
    original: "oklch(0.837 0.128 66.29)",
    backgrounds: [...light, "#fff7ed"],
  },
  {
    token: "--text-amber",
    original: "oklch(0.769 0.188 70.08)",
    backgrounds: [...light, "#fef3c7"],
  },
  {
    token: "--text-pink",
    original: "oklch(0.718 0.202 349.761)",
    backgrounds: [...light, "#fdf2f8"],
  },
  {
    token: "--text-violet",
    original: "oklch(0.702 0.183 293.541)",
    backgrounds: [...light, "#f5f3ff"],
  },
  {
    token: "--text-indigo",
    original: "oklch(0.673 0.182 276.935)",
    backgrounds: [...light, "#eef2ff"],
  },
  {
    token: "--text-sky",
    original: "oklch(0.685 0.169 237.323)",
    backgrounds: [...light, "#f0f9ff"],
  },
  {
    token: "--text-blue",
    original: "oklch(0.623 0.214 259.815)",
    backgrounds: [...light, "#eff6ff"],
  },
  { token: "--muted-foreground", original: "oklch(0.551 0 0)", backgrounds: light },
  { token: "--navigation-muted", original: "#7a6d63", backgrounds: ["#e8dcc4"] },
  { token: "--diff-delete-text", original: "#9f6262", backgrounds: ["#f0d2d2"] },
  { token: "--diff-replaced-text", original: "#6f6a64", backgrounds: ["#dfdcd8"] },
  { token: "--primary", original: "#059669", backgrounds: ["#fff"] },
  { token: "--primary-text", original: "#047857", backgrounds: light },
  { token: "--action-leaf", original: "#88b04b", backgrounds: ["#fff"] },
  { token: "--action-danger", original: "#c46868", backgrounds: ["#fff"] },
  {
    token: "--control-border",
    original: "oklch(0.929 0.013 255.508)",
    backgrounds: light,
    minimum: 3,
  },
  { token: "--focus-indicator", original: "rgb(16 185 129 / 50%)", backgrounds: light, minimum: 3 },
  {
    token: "--marker-bubble-border",
    original: "#a3687f",
    backgrounds: ["#e4bdc9", "#fdf2f8"],
    minimum: 3,
  },
  {
    token: "--marker-note-border",
    original: "#967534",
    backgrounds: ["#ead39b", "#fffbeb"],
    minimum: 3,
  },
  {
    token: "--marker-selected",
    original: "#3b82f6",
    backgrounds: ["#e4bdc9", "#ead39b", "#fdf2f8", "#fffbeb"],
    minimum: 3,
  },
  { token: "--status-flag", original: "#e8b428", backgrounds: [...light, "#e7e5e4"], minimum: 3 },
];

export const imageLabels = {
  overlay: "--image-label-overlay",
  foreground: "--image-label-foreground",
  originalOverlay: "rgb(15 23 43 / 40%)",
  originalForeground: "rgb(255 255 255 / 90%)",
};

/** @param {Record<string, string>} tokens @param {string} name */
export function resolveToken(tokens, name) {
  const value = tokens[name];
  if (!value) throw new Error(`Missing rendered theme token ${name}`);
  return value;
}
