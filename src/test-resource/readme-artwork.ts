/** Original, self-contained artwork for README screenshot stories. */
function svgUrl(content: string, width: number, height: number): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}">${content}</svg>`)}`;
}

function comicPanel(y: number, height: number, alternate: boolean): string {
  const personX = alternate ? 170 : 425;
  return `<g transform="translate(0 ${String(y)})">
    <rect x="24" y="0" width="552" height="${String(height)}" fill="#eeeae0" stroke="#303b3c" stroke-width="3"/>
    <path d="M25 145 Q160 70 300 140 T575 100 V${String(height)} H25Z" fill="#a5b6ae"/>
    <path d="M25 185 Q180 115 350 175 T575 150 V${String(height)} H25Z" fill="#647f78"/>
    <path d="M275 85 L385 28 L495 85 V200 H275Z" fill="#ddd4c3" stroke="#303b3c" stroke-width="3"/>
    <rect x="355" y="110" width="40" height="90" fill="#53635d"/>
    <path d="M245 85 H520 L385 12Z" fill="#4c6361" stroke="#303b3c" stroke-width="3"/>
    <path d="M50 ${String(height)} L345 180 H395 L210 ${String(height)}" fill="#d4c9b4"/>
    <g transform="translate(${String(personX)} 130)">
      <path d="M-40 105 Q-35 45 0 40 Q40 45 45 105Z" fill="#48565b" stroke="#303b3c" stroke-width="3"/>
      <ellipse cy="12" rx="24" ry="30" fill="#f2e8d6" stroke="#303b3c" stroke-width="2"/>
      <path d="M-26 16 Q-40 -40 5 -26 Q35 -28 27 20 L12 -2 L-5 4 L-17 -3Z" fill="#353b3e"/>
      <path d="M-10 17 H-4 M10 17 H16 M1 30 Q7 34 12 28" fill="none" stroke="#303b3c" stroke-width="2"/>
      <path d="M-27 61 L28 88 L17 121 L-40 91Z" fill="#d7bc8d" stroke="#303b3c" stroke-width="2"/>
    </g>
  </g>`;
}

function speech(x: number, y: number, lines: string[]): string {
  return `<g transform="translate(${String(x)} ${String(y)})"><ellipse rx="72" ry="61" fill="#fffdf6" stroke="#303b3c" stroke-width="2"/><path d="M-20 54 L-28 78 L-5 59" fill="#fffdf6" stroke="#303b3c" stroke-width="2"/><text text-anchor="middle" font-family="serif" font-size="16" fill="#303b3c">${lines.map((line, i) => `<tspan x="0" y="${String(-14 + i * 24)}">${line}</tspan>`).join("")}</text></g>`;
}

export const readmePageImage = svgUrl(
  `<rect width="600" height="840" fill="#faf7ed"/>
   ${comicPanel(24, 265, false)}${comicPanel(305, 235, true)}${comicPanel(556, 260, false)}
   ${speech(125, 102, ["風を待つ", "手紙がある。"])}
   ${speech(480, 382, ["この町の", "郵便屋さん？"])}
   ${speech(120, 658, ["届けよう。", "春が来る前に。"])}
   <text x="560" y="832" text-anchor="end" font-family="serif" font-size="12" fill="#64756d">風待郵便局 · 03</text>`,
  600,
  840,
);

const palettes: [string, string][] = [
  ["#dfe8d8", "#46675b"],
  ["#e9dccb", "#8a6652"],
  ["#dbe5ec", "#4c6980"],
  ["#e8dfe9", "#7a617c"],
  ["#eee7ce", "#8b7b49"],
  ["#d8e7e2", "#476c69"],
];
const titles = ["風待郵便局", "海辺の喫茶室", "月と鉄道", "雨の日の栞", "夏の余白", "遠い灯台"];

export function readmeCoverImage(index: number): string {
  const [paper, ink] = palettes[index % palettes.length] ?? ["#dfe8d8", "#46675b"];
  return svgUrl(
    `<rect width="360" height="500" fill="${paper}"/>
    <circle cx="265" cy="110" r="60" fill="#fffdf1"/>
    <path d="M0 320 Q100 200 200 300 T360 240 V500 H0Z" fill="${ink}" opacity=".45"/>
    <path d="M0 390 Q150 260 360 350 V500 H0Z" fill="${ink}"/>
    <path d="M135 360 V230 L185 195 L235 230 V360Z" fill="${paper}" stroke="${ink}" stroke-width="4"/>
    <rect x="175" y="280" width="25" height="80" fill="${ink}"/>
    <text x="32" y="64" font-family="serif" font-size="30" fill="${ink}">${titles[index % titles.length] ?? "風待郵便局"}</text>
    <text x="32" y="105" font-family="serif" font-size="14" fill="${ink}">COLLECTION ${String(index + 1).padStart(2, "0")}</text>`,
    360,
    500,
  );
}

export function readmeAvatarImage(index: number): string {
  const [paper, ink] = palettes[index % palettes.length] ?? ["#dfe8d8", "#46675b"];
  return svgUrl(
    `<rect width="80" height="80" rx="40" fill="${paper}"/>
    <path d="M12 80 Q12 48 40 48 Q68 48 68 80" fill="${ink}"/>
    <circle cx="40" cy="32" r="19" fill="#fff7e7"/>
    <path d="M21 31 Q16 6 40 9 Q64 5 60 34 L47 22 L28 28Z" fill="${ink}"/>
    <path d="M32 33 H35 M45 33 H48 M36 43 Q40 46 45 42" stroke="${ink}" stroke-width="2" fill="none"/>`,
    80,
    80,
  );
}
