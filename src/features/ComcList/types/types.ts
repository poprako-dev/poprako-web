import type { ChapterInfo, ComicInfo } from "@/types";

export type ComicTranslationListItem = {
  comicInfo: ComicInfo;
  chapter?: ChapterInfo;
};

export type TripleFilter = "pending" | "ongoing" | "completed" | "unset";

export type BinaryFilter = "pending" | "completed" | "unset";
