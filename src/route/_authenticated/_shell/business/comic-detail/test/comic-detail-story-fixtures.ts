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
    {
      id: "a-admin",
      chapterId,
      userId: "u-admin",
      user: makeUser("u-admin", "Mori"),
      roles: 128,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a1",
      chapterId,
      userId: "u-kira",
      user: makeUser("u-kira", "Kira"),
      roles: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a2",
      chapterId,
      userId: "u-mio",
      user: makeUser("u-mio", "Mio"),
      roles: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a3",
      chapterId,
      userId: "u-aki",
      user: makeUser("u-aki", "Aki"),
      roles: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a4",
      chapterId,
      userId: "u-sora",
      user: makeUser("u-sora", "Sora"),
      roles: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a5",
      chapterId,
      userId: "u-lin",
      user: makeUser("u-lin", "Lin"),
      roles: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a6",
      chapterId,
      userId: "u-baka",
      user: makeUser("u-baka", "Baka"),
      roles: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a7",
      chapterId,
      userId: "u-yuki",
      user: makeUser("u-yuki", "Yuki"),
      roles: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a8",
      chapterId,
      userId: "u-kira2",
      user: makeUser("u-kira2", "Kira"),
      roles: 32,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a9",
      chapterId,
      userId: "u-sys",
      user: makeUser("u-sys", "System"),
      roles: 64,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
