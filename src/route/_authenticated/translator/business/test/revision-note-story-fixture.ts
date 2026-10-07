import { openPsdPage } from "../revision-note/open-psd-page";
import { revisionPsdFixture } from "./revision-psd-fixture";
import { fn } from "storybook/test";
import type { EditorProps } from "../editor/editor-props";
import type { RevisionNote } from "../revision-note/revision-note";
import { createStoryArgs } from "./base-translator-story-fixture";
import { READ_ONLY_VIEW_STORAGE_KEY } from "../preference/use-read-only-view";

function pageImage(page: number, typeset: boolean): string {
  const ink = typeset ? "#262626" : "#929292";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1280" viewBox="0 0 900 1280">
<rect width="900" height="1280" fill="#fff"/>
<g fill="none" stroke="#303030" stroke-width="5">
<path d="M42 55H858V405H42ZM42 429H408V875H42ZM432 429H858V875H432ZM42 899H858V1217H42Z"/>
<path d="M42 283L310 183 500 285 670 165 858 252M42 312L310 212 500 314 670 194 858 281" stroke-width="2"/>
<path d="M75 378L360 290M100 390L385 302M125 403L410 314M432 810L650 560 858 810" stroke="#b7b7b7"/>
<path d="M42 1140Q160 1050 300 1130T600 1110 858 1150M42 1164Q160 1074 300 1154T600 1134 858 1174" stroke-width="2"/>
</g>
<g fill="#e7e7e7" stroke="#303030" stroke-width="3">
<path d="M270 840Q275 670 345 656Q405 705 398 866H225Z"/>
<ellipse cx="335" cy="605" rx="51" ry="67" fill="#fff"/>
<path d="M283 613Q259 503 336 524Q405 515 387 631L361 567 315 564Z" fill="#303030"/>
<path d="M558 1207Q565 1050 650 1040Q741 1051 752 1207"/>
<ellipse cx="650" cy="1006" rx="52" ry="65" fill="#fff"/>
</g>
<g fill="#fff" stroke="#555" stroke-width="2">
<ellipse cx="715" cy="161" rx="104" ry="73"/>
<ellipse cx="149" cy="546" rx="80" ry="88"/>
<ellipse cx="719" cy="548" rx="88" ry="84"/>
<ellipse cx="268" cy="1020" rx="139" ry="73"/>
</g>
<g fill="${ink}" font-family="sans-serif" font-size="25" text-anchor="middle">
<text x="715" y="151">终于找到</text><text x="715" y="188">你了。</text>
<text x="149" y="537">等一下，</text><text x="149" y="574">听我说。</text>
<text x="719" y="543">这里发生了</text><text x="719" y="580">什么？</text>
<text x="268" y="1011">风停下来以后，</text><text x="268" y="1048">我们就出发。</text>
</g>
<text x="450" y="1251" text-anchor="middle" font-family="monospace" font-size="16" fill="#737373">${String(page).padStart(2, "0")}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function notesForPage(pageId: string): RevisionNote[] {
  if (pageId.endsWith("2")) return [];
  const notes: RevisionNote[] = [
    {
      id: `${pageId}-1`,
      number: 1,
      type: "文字位置",
      content: "这组文字稍微偏右。请向左移动，保持两侧留白一致。",
      rect: { xCoord: 0.707, yCoord: 0.087, width: 0.175, height: 0.072 },
      layerId: "0.1.0",
    },
    {
      id: `${pageId}-2`,
      number: 2,
      type: "断行",
      content: "建议保持两行：\n等一下，\n听我说。\n第二行的逗号不用保留。",
      rect: { xCoord: 0.092, yCoord: 0.382, width: 0.151, height: 0.08 },
      layerId: "0.1.1",
    },
    {
      id: `${pageId}-3`,
      number: 3,
      type: "自定义：叠字节奏",
      content: "这里的字号比上一格略小，连着阅读时节奏会断。请结合上下两格统一检查。",
      rect: { xCoord: 0.702, yCoord: 0.383, width: 0.2, height: 0.082 },
      layerId: "0.1.2",
    },
    {
      id: `${pageId}-4`,
      number: 4,
      type: "整页说明",
      content: "本页标点统一采用全角。调整时保留原有文字图层，便于之后核对。",
      rect: null,
      layerId: null,
    },
  ];
  if (pageId.endsWith("3")) {
    notes.push({
      id: `${pageId}-5`,
      number: 5,
      type: "区域重叠",
      content: "同一区域的另一条 revision_note，可分别选中。",
      rect: { xCoord: 0.72, yCoord: 0.12, width: 0.18, height: 0.09 },
      layerId: "0.1.0",
    });
    notes.push({
      id: `${pageId}-6`,
      number: 6,
      type: "长文本",
      content: "这是一条需要完整保留换行与说明的 revision_note。\n".repeat(16),
      rect: null,
      layerId: null,
    });
  }
  return notes;
}

export function createRevisionStoryArgs(
  options: { fail?: boolean; delay?: number; available?: boolean } = {},
): EditorProps {
  const base = createStoryArgs({ canTranslate: false, canProofread: false });
  async function loadNotes(pageId: string): Promise<RevisionNote[]> {
    await new Promise<void>((resolve) => setTimeout(resolve, options.delay ?? 100));
    if (options.fail) throw new Error("示例：revision_note 数据读取失败");
    return notesForPage(pageId);
  }
  return {
    ...base,
    onLoadUnits: fn(base.onLoadUnits),
    onSaveUnits: fn(base.onSaveUnits),
    project: { ...base.project, pages: base.project.pages.slice(0, 3), pageCount: 3 },
    startMode: "readOnly",
    onLoadPageImage: (pageId) =>
      Promise.resolve(pageImage(Number(pageId.split("-").at(-1)), false)),
    loadRevisionNotes: options.available === false ? null : fn(loadNotes),
    loadRevisionPage: fn(async (pageId: string, signal: AbortSignal) => {
      const file = await revisionPsdFixture(pageImage(Number(pageId.split("-").at(-1)), true));
      return openPsdPage(file, signal);
    }),
  };
}

export function revisionPreferenceFixture(
  view: "unit" | "revision_note" = "revision_note",
): () => void {
  const previous = localStorage.getItem(READ_ONLY_VIEW_STORAGE_KEY);
  localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, view);
  return () => {
    if (previous === null) localStorage.removeItem(READ_ONLY_VIEW_STORAGE_KEY);
    else localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, previous);
  };
}
