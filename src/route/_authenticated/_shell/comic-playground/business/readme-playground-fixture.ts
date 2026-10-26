import { createApiClient } from "@/api/client";
import type { ComicResponse, ChapterResponse, AssignmentResponse } from "@/api/content-contract";
import type { WorksetResponse } from "@/api/workset/workset-api";
import { readmeCoverImage, readmeAvatarImage } from "@/test-resource/readme-artwork";
import { readmeSession } from "@/test-resource/readme-session";

const now = new Date("2026-10-26T09:30:00+08:00").getTime();
const teamId = readmeSession.memberInfos[0]?.teamId ?? "readme-team";
const titles = [
  "雨后的第七站",
  "月光邮局",
  "海风与旧书店",
  "星屑列车",
  "山茶花开时",
  "玻璃海的来信",
  "周末的魔法师",
  "春日慢行",
  "云端料理室",
  "昨日的风铃",
  "沿着光的方向",
  "夏夜观测记",
  "白昼小行星",
  "花与旅人",
  "猫咪咖啡馆",
];

const worksets: WorksetResponse[] = [
  ["本季连载", "每周更新，与故事一起向前。", 15],
  ["短篇拾光", "收集生活里的温柔片刻。", 8],
  ["完结书架", "那些已经抵达终点的旅程。", 23],
  ["新作筹备", "等待启程的故事。", 6],
].map(([name, description, count], index) => ({
  id: `readme-workset-${String(index)}`,
  teamId,
  name: String(name),
  description: String(description),
  comicCount: Number(count),
  index,
  createdAt: now - 86_400_000 * 90,
  updatedAt: now,
}));

function makeComic(title: string, index: number, workset: WorksetResponse): ComicResponse {
  return {
    id: `readme-comic-${String(index)}`,
    worksetId: workset.id,
    workset,
    title,
    author: ["青野 遥", "森川 凪", "白石 栞", "月岛 灯"][index % 4] ?? "青野 遥",
    description: "那些被日常藏起来的闪光时刻，终于在这一刻相遇。",
    index,
    chapterCount: 8 + index * 2,
    creatorId: readmeSession.userInfo.id,
    coverUrl: readmeCoverImage(index),
    coverThumbnailUrl: readmeCoverImage(index),
    isArchived: false,
    lastActiveAt: now - index * 3_600_000,
    createdAt: now - 86_400_000 * 60,
    updatedAt: now,
  };
}

function makeChapter(comic: ComicResponse, index: number): ChapterResponse {
  const total = 136 + index * 13;
  return {
    id: `readme-chapter-${String(index)}`,
    comicId: comic.id,
    creatorId: readmeSession.userInfo.id,
    index: index + 3,
    subtitle: ["奔向下一个晴天", "远方的来信", "未完成的约定"][index % 3] ?? "新的旅程",
    pageSourceCount: 24 + (index % 5) * 4,
    totalUnitCount: total,
    translatedUnitCount: Math.floor(total * (1 - (index % 5) * 0.17)),
    proofreadUnitCount: Math.floor(total * (0.88 - (index % 5) * 0.2)),
    isPinned: true,
    stages: [170, 154, 26, 10, 6][index % 5] ?? 6,
    createdAt: now - 86_400_000 * 3,
    updatedAt: now,
  };
}

function makeAssignments(chapter: ChapterResponse): AssignmentResponse[] {
  return ["青禾", "小满", "望舒"].map((nickname, index) => ({
    id: `${chapter.id}-assignment-${String(index)}`,
    chapterId: chapter.id,
    userId: `readme-member-${String(index)}`,
    user: {
      id: `readme-member-${String(index)}`,
      nickname,
      qid: String(100001 + index),
      avatarUrl: readmeAvatarImage(index),
      avatarThumbnailUrl: readmeAvatarImage(index),
      isSadmin: false,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    },
    roles: [2, 4, 8][index] ?? 2,
    createdAt: now,
    updatedAt: now,
  }));
}

function playgroundData(url: URL): unknown {
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? 12);
  if (url.pathname.endsWith("/worksets")) return worksets.slice(offset, offset + limit);
  if (url.pathname.endsWith("/comics")) {
    const workset = worksets.find((item) => url.pathname.includes(`/${item.id}/`));
    if (!workset) return { comics: [], pinnedChapters: [], pinnedChapterAssignments: [] };
    const title = url.searchParams.get("fuzzy_title") ?? "";
    const comics = titles
      .filter((item) => item.includes(title))
      .slice(offset, offset + limit)
      .map((item, index) => makeComic(item, offset + index, workset));
    const pinnedChapters = comics.map(makeChapter);
    return {
      comics,
      pinnedChapters,
      pinnedChapterAssignments: pinnedChapters.map(makeAssignments),
    };
  }
  return [];
}

export function createReadmePlaygroundClient(): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "readme-local",
    fetchImpl: (input) => {
      const data = playgroundData(
        new URL(
          typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
          "http://readme.local",
        ),
      );
      return Promise.resolve(Response.json({ code: 0, data }));
    },
  });
}
