import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/route/business/identity/member";
import type { UserInfo } from "@/route/business/identity/user";

export const now = Date.UTC(2026, 4, 28, 12);

export function required<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("示例数据缺失");
  }
  return value;
}

// Mock builders

export function makeUser(id: string, name: string): UserInfo {
  return {
    id,
    name,
    qq: "",
    avatarUrl: "",
    isSuperAdmin: false,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function makeMember(
  userId: string,
  name: string,
  roles: Partial<MemberInfo> = {},
): MemberInfo {
  return {
    id: `member-${userId}`,
    userId,
    user: makeUser(userId, name),
    teamId: "team-1",
    roles: 0,
    createdAt: now,
    updatedAt: now,
    ...roles,
  };
}

export const mockComic: ComicInfo = {
  id: "comic-1",
  worksetId: "ws-1",
  title: "咒术回战",
  author: "芥见下下",
  description: "全球风靡的奇幻热血漫画",
  index: 0,
  chapterCount: 200,
  creatorId: "user-0",
  coverUrl: "",
  isCoverUploaded: false,
  lastActiveAt: now - 1000 * 60 * 60 * 2,
  createdAt: now,
  updatedAt: now,
};

const SUBTITLE_POOL = [
  "宿命对决",
  "深渊回响",
  "逆命之刃",
  "血色晨曦",
  "虚空裂变",
  "幽冥之门",
  "末日序曲",
  "命运交汇",
];

export function makeChapter(idx: number, extraFlags?: Partial<ChapterInfo>): ChapterInfo {
  const hasSubtitle = idx % 3 === 0;
  return {
    id: `chapter-${String(idx)}`,
    comicId: "comic-1",
    index: idx,
    subtitle: hasSubtitle ? required(SUBTITLE_POOL[idx % SUBTITLE_POOL.length]) : "",
    isPinned: false,
    pageCount: 18 + (idx % 8),
    totalUnitCount: 140 + idx * 8,
    translatedUnitCount: Math.floor((140 + idx * 8) * (0.3 + (idx % 5) * 0.1)),
    proofreadUnitCount: Math.floor((140 + idx * 8) * (idx % 4) * 0.05),
    stages: 6,

    creatorId: "user-0",
    createdAt: now,
    updatedAt: now,
    ...extraFlags,
  };
}

// 200 chapters for infinite-scroll testing
export const ALL_CHAPTERS: ChapterInfo[] = Array.from({ length: 200 }, (_, i) =>
  makeChapter(i + 1),
);

export const pinnedChapter = makeChapter(42, {
  isPinned: true,
  subtitle: "深渊回响",
});

export function makePages(chapterId: string, count: number): PageInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${chapterId}-${String(i + 1)}`,
    chapterId,
    index: i + 1,
    imageUrl: "",
    isUploaded: i < count - 3,
    totalUnitCount: 10 + (i % 4),
    translatedUnitCount: i % 3 === 0 ? 10 + (i % 4) : i % 2,
    proofreadUnitCount: i % 5 === 0 ? 10 + (i % 4) : 0,
    createdAt: now,
    updatedAt: now,
  }));
}

export function makeAssignments(chapterId: string): AssignmentInfo[] {
  return [
    makeAssignment(chapterId, "a-admin", "u-admin", "Mori", 128),
    makeAssignment(chapterId, "a1", "u-kira", "Kira", 1),
    makeAssignment(chapterId, "a2", "u-mio", "Mio", 1),
    makeAssignment(chapterId, "a3", "u-aki", "Aki", 2),
    makeAssignment(chapterId, "a4", "u-sora", "Sora", 2),
    makeAssignment(chapterId, "a5", "u-lin", "Lin", 4),
    makeAssignment(chapterId, "a6", "u-baka", "Baka", 8),
    makeAssignment(chapterId, "a7", "u-yuki", "Yuki", 8),
    makeAssignment(chapterId, "a8", "u-kira2", "Kira", 32),
    makeAssignment(chapterId, "a9", "u-sys", "System", 64),
  ];
}

function makeAssignment(
  chapterId: string,
  id: string,
  userId: string,
  name: string,
  roles: number,
): AssignmentInfo {
  return {
    id,
    chapterId,
    userId,
    user: makeUser(userId, name),
    roles,
    createdAt: now,
    updatedAt: now,
  };
}
