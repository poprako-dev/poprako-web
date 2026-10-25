import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";

const timestamp = Date.parse("2026-09-18T08:00:00Z");

export const archiveWorksets: WorksetInfo[] = ["短篇集", "连载作品"].map((name, index) => ({
  id: `archive-workset-${String(index)}`,
  teamId: "team-1",
  index,
  name,
  description: "",
  comicCount: 25,
  createdAt: timestamp,
  updatedAt: timestamp,
}));

export function archiveComic(index: number): ComicInfo {
  const titles = ["雨后的街角", "夏日来信", "长夜尽头的旅行者与那个没有名字的小镇", "星海回声"];
  return {
    id: `archive-comic-${String(index)}`,
    worksetId: `archive-workset-${String(index % 2)}`,
    index,
    chapterCount: index + 2,
    title: titles[index % titles.length] ?? "漫画",
    author: index % 2 === 0 ? "青木" : "山田与他的非常长的笔名",
    description: "",
    coverUrl: "",
    isCoverUploaded: false,
    creatorId: "user-1",
    archivedAt: index === 4 ? null : timestamp - index * 86_400_000,
    lastActiveAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const archivedComics = Array.from({ length: 50 }, (_, index) => archiveComic(index));
