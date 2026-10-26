import type { UserInfo } from "@/route/business/identity/user";
import type { Result } from "@/shared/utility/result";
import { readmePageImage } from "@/test-resource/readme-artwork";
import type { Project } from "../unit/project";
import type { UnitInfo } from "../unit/unit";
import type { UnitNotes } from "../unit/unit-notes";
import { createUnitAnnotationFixture } from "./unit-annotation-fixture";

const timestamp = 1_792_992_000_000;
const dialogue = [
  ["如果风停了，信就送不到了吧。", "风停下来的话，信就送不到了吧。"],
  ["没关系。还有我们在。", "没关系，还有我们呢。"],
  ["这是寄给明天的信。", "这是一封，寄往明天的信。"],
  ["到灯塔去吧，趁着天还没黑。", "趁天还没黑，我们去灯塔吧。"],
  ["我一直都在等着这一天。", "我一直在等这一天。"],
  ["你听，海的声音。", "你听，是大海的声音。"],
  ["咔哒", "咔嗒"],
  ["风待邮便局，今日仍然营业。", "风待邮便局，今天也照常营业。"],
];
const coordinates = [
  [0.77, 0.14],
  [0.3, 0.18],
  [0.76, 0.42],
  [0.28, 0.47],
  [0.78, 0.72],
  [0.3, 0.77],
  [0.5, 0.56],
  [0.5, 0.93],
];

export function readmeUnits(pageId: string): UnitInfo[] {
  return dialogue.map(([translatedText, proofreadText], index) => ({
    id: `${pageId}-unit-${String(index + 1)}`,
    index,
    xCoord: coordinates[index]?.[0] ?? 0.5,
    yCoord: coordinates[index]?.[1] ?? 0.5,
    isBubble: index < 6,
    isFlagged: index === 2,
    isProofread: index !== 2 && index !== 5,
    translatedText,
    proofreadText,
    translatorId: index < 4 ? "readme-translator" : "readme-letterer",
    proofreaderId: "readme-proofreader",
  }));
}

export const readmeProject: Project = {
  id: "readme-wind-post",
  title: "风待邮便局 · 第三话 寄往明天的信",
  author: "青叶凪",
  pageCount: 18,
  totalUnitCount: 144,
  translatedUnitCount: 144,
  proofreadUnitCount: 108,
  pages: Array.from({ length: 18 }, (_, index) => ({
    id: `readme-page-${String(index + 1)}`,
    chapterId: "readme-wind-post-chapter-3",
    index,
    imageUrl: readmePageImage,
    imageOptimizedUrl: readmePageImage,
    isUploaded: true,
    totalUnitCount: 8,
    translatedUnitCount: 8,
    proofreadUnitCount: 6,
    createdAt: timestamp,
    updatedAt: timestamp,
  })),
};

export function createReadmeAnnotations(): ReturnType<typeof createUnitAnnotationFixture> {
  return createUnitAnnotationFixture(
    Object.fromEntries(
      readmeProject.pages.flatMap((page): [string, UnitNotes][] => [
        [
          `${page.id}-unit-1`,
          {
            typographyNote: "沿气泡中轴排两行，“信”字不要落单。",
            translationNote: "保留试探语气，与下一格的回答呼应。",
          },
        ],
        [
          `${page.id}-unit-3`,
          {
            typographyNote: "“明天”加重；逗号处保留停顿。",
            translationNote: "“明日”兼指未来，统一译为“明天”，呼应本话标题。",
          },
        ],
        [
          `${page.id}-unit-7`,
          {
            typographyNote: "手写拟声字，沿邮筒盖的倾斜方向放置。",
            translationNote: null,
          },
        ],
      ]),
    ),
  );
}

function readmeUser(id: string, name: string, color: string): UserInfo {
  const avatar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="${color}"/><circle cx="24" cy="19" r="9" fill="#fff8ed"/><path d="M8 48c0-21 32-21 32 0" fill="#fff8ed"/></svg>`;
  return {
    id,
    name,
    qq: "",
    avatarUrl: `data:image/svg+xml,${encodeURIComponent(avatar)}`,
    isSuperAdmin: false,
    lastActiveAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const users = [
  readmeUser("readme-translator", "森川秋", "#758d70"),
  readmeUser("readme-proofreader", "林澄", "#bc8f73"),
  readmeUser("readme-letterer", "小满", "#8c96ad"),
];

export function resolveReadmeUser(userId: string): Promise<Result<UserInfo>> {
  const user = users.find((item) => item.id === userId);
  return Promise.resolve(
    user ? { success: true, data: user } : { success: false, error: "未找到成员" },
  );
}
