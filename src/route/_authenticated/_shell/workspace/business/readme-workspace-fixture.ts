import { createApiClient } from "@/api/client";
import type { AssignmentResponse, ChapterResponse, ComicResponse } from "@/api/content-contract";
import type { ApiUser } from "@/api/identity-contract";
import { readmeAvatarImage, readmeCoverImage } from "@/test-resource/readme-artwork";
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
];
const subtitles = ["最后一班电车", "写给明天的信", "夏日书签", "银河的另一端", "未说出口的话"];
const names = ["小满", "青禾", "林间", "望舒", "木棉"];

function makeUser(index: number): ApiUser {
  return {
    id: index === 0 ? readmeSession.userInfo.id : `readme-member-${String(index)}`,
    nickname: names[index % names.length] ?? "小满",
    qid: String(100001 + index),
    avatarUrl: readmeAvatarImage(index),
    avatarThumbnailUrl: readmeAvatarImage(index),
    isSadmin: false,
    lastActiveAt: now,
    createdAt: now - 86_400_000 * 90,
    updatedAt: now,
  };
}

const users = names.map((_, index) => makeUser(index));

function makeComic(title: string, index: number): ComicResponse {
  return {
    id: `readme-workspace-comic-${String(index)}`,
    worksetId: "readme-current",
    title,
    author: ["青野 遥", "森川 凪", "白石 栞"][index % 3] ?? "青野 遥",
    description: "关于相遇、远行，以及平凡日子里的微小奇迹。",
    index,
    chapterCount: 8 + index * 3,
    creatorId: readmeSession.userInfo.id,
    coverUrl: readmeCoverImage(index),
    coverThumbnailUrl: readmeCoverImage(index),
    isArchived: false,
    lastActiveAt: now - index * 3_600_000,
    createdAt: now - 86_400_000 * 20,
    updatedAt: now,
  };
}

function makeChapter(comic: ComicResponse, index: number): ChapterResponse {
  const total = 124 + index * 19;
  return {
    id: `readme-workspace-chapter-${String(index)}`,
    comicId: comic.id,
    comic,
    creatorId: readmeSession.userInfo.id,
    index: 3 + index,
    subtitle: subtitles[index % subtitles.length] ?? "新的旅程",
    pageSourceCount: 24 + index * 2,
    totalUnitCount: total,
    translatedUnitCount: Math.floor(total * (1 - (index % 4) * 0.21)),
    proofreadUnitCount: Math.floor(total * (0.76 - (index % 4) * 0.19)),
    isPinned: true,
    stages: [26, 10, 6, 154][index % 4] ?? 6,
    createdAt: now - 86_400_000 * 3,
    updatedAt: now,
  };
}

const assignments: AssignmentResponse[] = titles.map((title, index) => {
  const comic = makeComic(title, index);
  const chapter = makeChapter(comic, index);
  return {
    id: `readme-task-${String(index)}`,
    chapterId: chapter.id,
    chapter,
    userId: readmeSession.userInfo.id,
    user: makeUser(0),
    roles: 6,
    createdAt: now,
    updatedAt: now,
  };
});

const messages = [
  "《雨后的第七站》第 4 话翻译完成啦，辛苦青禾接一下校对～",
  "收到！专有名词我会和术语库再核对一遍。",
  "第 18 页的手写字已经补上了，原图放在章节里。",
  "《月光邮局》这一话的氛围太好了，感谢大家一起赶上更新！",
  "周末有时间的小伙伴可以来认领《春日慢行》，还有两话待翻译。",
];

const comments = messages
  .map((content, index) => ({
    id: `readme-comment-${String(index)}`,
    teamId,
    userId: users[index]?.id,
    user: users[index],
    content,
    createdAt: now - (messages.length - index) * 720_000,
  }))
  .reverse();

const announcements = [
  [
    "十月更新计划 · 一起把故事带给更多人",
    "本周优先完成《雨后的第七站》和《月光邮局》的校对与嵌字。",
  ],
  ["译名与标点规范更新", "角色译名和拟声词请参考术语库，遇到疑问欢迎在留言板讨论。"],
  ["周末共译招募", "欢迎认领新的章节，翻译、校对和嵌字都可以参与。"],
].map(([title, content], index) => ({
  id: `readme-announcement-${String(index)}`,
  teamId,
  userId: users[0]?.id,
  user: users[0],
  title,
  content,
  createdAt: now - index * 86_400_000,
}));

function workspaceData(url: URL): unknown {
  const path = url.pathname;
  if (path.endsWith("/assignments")) {
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 12);
    return assignments.slice(offset, offset + limit);
  }
  if (path.endsWith("/comments")) return comments;
  if (path.endsWith("/announcements")) return announcements;
  if (path.endsWith("/online-users")) return users.map((user) => user.id);
  if (path.includes("/users/")) return users.find((user) => path.endsWith(`/${user.id}`));
  return [];
}

export function createReadmeWorkspaceClient(): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "readme-local",
    fetchImpl: (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
        "http://readme.local",
      );
      const data = init?.method === "POST" ? { id: "readme-new-comment" } : workspaceData(url);
      return Promise.resolve(Response.json({ code: 0, data }));
    },
  });
}
