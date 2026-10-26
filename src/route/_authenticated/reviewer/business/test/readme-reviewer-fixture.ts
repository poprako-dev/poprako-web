import { fn } from "storybook/test";
import type { IssueInfo } from "@/route/_authenticated/business/issue/issue";
import { readmePageImage } from "@/test-resource/readme-artwork";
import type { ReviewerProps } from "../reviewer-props";
import { openCompositePage } from "../issue/open-composite-page";
import { ReviewMemorySource } from "./review-memory-source";

const annotations: Omit<IssueInfo, "id" | "pageArtworkId">[] = [
  {
    index: 0,
    variant: "居中",
    note: "“等待风的来信”向左微调，与气泡的视觉中心对齐，左右留白保持一致。",
    rect: { xCoord: 0.125, yCoord: 0.085, width: 0.17, height: 0.075 },
  },
  {
    index: 1,
    variant: "断行",
    note: "建议断为“这座小镇的／邮递员？”，保留问句的停顿，问号不要单独成行。",
    rect: { xCoord: 0.71, yCoord: 0.42, width: 0.18, height: 0.075 },
  },
  {
    index: 2,
    variant: "字号",
    note: "“在春天到来之前”与首格统一字号。第二行略长，可收紧字距，保留气泡留白。",
    rect: { xCoord: 0.095, yCoord: 0.747, width: 0.21, height: 0.075 },
  },
  {
    index: 3,
    variant: "修图",
    note: "信封边缘请保留原稿线条。清理附近文字时，避免一并擦掉纸张折痕。",
    rect: { xCoord: 0.625, yCoord: 0.254, width: 0.14, height: 0.075 },
  },
  {
    index: 4,
    variant: "整页说明",
    note: "本页人物称呼已与术语表核对。修订后请统一检查全角标点和气泡留白。",
    rect: null,
  },
];

function loadIssues(pageId: string, signal: AbortSignal): Promise<IssueInfo[]> {
  signal.throwIfAborted();
  return Promise.resolve(
    annotations.map((issue) => ({
      ...issue,
      id: `${pageId}-issue-${String(issue.index + 1)}`,
      pageArtworkId: pageId,
    })),
  );
}

export function createReadmeReviewerFixture(): ReviewerProps {
  return {
    project: {
      chapterId: "readme-chapter",
      pages: Array.from({ length: 12 }, (_, index) => ({
        id: `readme-page-${String(index + 1)}`,
        index,
        imageUrl: readmePageImage,
        imageOptimizedUrl: readmePageImage,
      })),
    },
    startPageId: "readme-page-4",
    loadIssues,
    loadReviewPage: (_pageId, signal) => openCompositePage(readmePageImage, signal),
    editing: new ReviewMemorySource(loadIssues),
    onExit: fn(),
  };
}
