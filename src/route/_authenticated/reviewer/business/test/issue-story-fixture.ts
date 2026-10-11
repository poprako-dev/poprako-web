import { openCompositePage } from "../issue/open-composite-page";
import { fn } from "storybook/test";
import type { ReviewerProps } from "../reviewer-props";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";

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

function issuesForPage(pageId: string): IssueInfo[] {
  if (pageId.endsWith("2")) return [];
  const issues: IssueInfo[] = [
    {
      id: `${pageId}-1`,
      pageArtworkId: pageId,
      index: 0,
      variant: "文字位置",
      note: "这组文字稍微偏右。请向左移动，保持两侧留白一致。",
      rect: { xCoord: 0.707, yCoord: 0.087, width: 0.175, height: 0.072 },
      layerName: "对白",
    },
    {
      id: `${pageId}-2`,
      pageArtworkId: pageId,
      index: 1,
      variant: "断行",
      note: "建议保持两行：\n等一下，\n听我说。\n第二行的逗号不用保留。",
      rect: { xCoord: 0.092, yCoord: 0.382, width: 0.151, height: 0.08 },
      layerName: "对白",
    },
    {
      id: `${pageId}-3`,
      pageArtworkId: pageId,
      index: 2,
      variant: "自定义：叠字节奏",
      note: "这里的字号比上一格略小，连着阅读时节奏会断。请结合上下两格统一检查。",
      rect: { xCoord: 0.702, yCoord: 0.383, width: 0.2, height: 0.082 },
      layerName: "对白",
    },
    {
      id: `${pageId}-4`,
      pageArtworkId: pageId,
      index: 3,
      variant: "整页说明",
      note: "本页标点统一采用全角。调整时保留原有文字图层，便于之后核对。",
      rect: null,
      layerName: null,
    },
  ];
  appendOverlappingIssues(issues, pageId);
  return issues;
}

function appendOverlappingIssues(issues: IssueInfo[], pageId: string): void {
  if (!pageId.endsWith("3")) return;
  issues.push({
    id: `${pageId}-5`,
    pageArtworkId: pageId,
    index: 4,
    variant: "区域重叠",
    note: "同一区域的另一条 issue，可分别选中。",
    rect: { xCoord: 0.72, yCoord: 0.12, width: 0.18, height: 0.09 },
    layerName: "对白",
  });
  issues.push({
    id: `${pageId}-6`,
    pageArtworkId: pageId,
    index: 5,
    variant: "长文本",
    note: "这是一条需要完整保留换行与说明的 issue。\n".repeat(16),
    rect: null,
    layerName: null,
  });
}

const occlusionIssueTemplates: Omit<IssueInfo, "id" | "pageArtworkId">[] = [
  {
    index: 0,
    variant: "文字位置",
    note: "与 2 的左上角接近，两个标号互相遮叠。",
    rect: { xCoord: 0.66, yCoord: 0.12, width: 0.18, height: 0.09 },
    layerName: "对白",
  },
  {
    index: 1,
    variant: "断行",
    note: "与 1 的标号重叠；从列表选择可观察选中后的遮挡。",
    rect: { xCoord: 0.67, yCoord: 0.125, width: 0.18, height: 0.09 },
    layerName: "对白",
  },
  {
    index: 2,
    variant: "文字位置",
    note: "上边框被 4 的标号压住。",
    rect: { xCoord: 0.09, yCoord: 0.42, width: 0.2, height: 0.12 },
    layerName: "对白",
  },
  {
    index: 3,
    variant: "断行",
    note: "标号跨过 3 的上边框，两个矩形也有重叠。",
    rect: { xCoord: 0.18, yCoord: 0.442, width: 0.2, height: 0.12 },
    layerName: "对白",
  },
  {
    index: 4,
    variant: "文字位置",
    note: "与 6 的矩形相交，框线互相遮叠。",
    rect: { xCoord: 0.1, yCoord: 0.73, width: 0.5, height: 0.13 },
    layerName: null,
  },
  {
    index: 5,
    variant: "断行",
    note: "与 5 的区域重叠；切换选中项可对比框线的层级。",
    rect: { xCoord: 0.43, yCoord: 0.77, width: 0.3, height: 0.12 },
    layerName: null,
  },
];

export function loadOcclusionIssues(pageId: string, signal: AbortSignal): Promise<IssueInfo[]> {
  signal.throwIfAborted();
  return Promise.resolve(
    occlusionIssueTemplates.map((issue) => ({
      ...issue,
      id: `${pageId}-${String(issue.index + 1)}`,
      pageArtworkId: pageId,
    })),
  );
}

export function createIssueStoryArgs(
  options: { fail?: boolean; delay?: number; available?: boolean } = {},
): ReviewerProps {
  async function loadIssues(pageId: string, signal: AbortSignal): Promise<IssueInfo[]> {
    await new Promise<void>((resolve) => setTimeout(resolve, options.delay ?? 100));
    signal.throwIfAborted();
    if (options.fail) throw new Error("示例：issue 数据读取失败");
    return issuesForPage(pageId);
  }
  return {
    project: {
      chapterId: "chapter-1",
      pages: [1, 2, 3].map((index) => ({ id: "page-" + String(index), index: index - 1 })),
    },
    startPageId: "page-1",
    onExit: fn(),
    loadIssues: options.available === false ? fn(() => Promise.resolve([])) : fn(loadIssues),
    loadReviewPage: fn((pageId: string, signal: AbortSignal) =>
      openCompositePage(pageImage(Number(pageId.split("-").at(-1)), true), signal),
    ),
  };
}
