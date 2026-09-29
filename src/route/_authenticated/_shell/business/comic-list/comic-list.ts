import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";

export type ComicTranslationListItem = {
  comicInfo: ComicInfo;
  chapter?: ChapterInfo | undefined;
};

export type TripleFilter = "pending" | "ongoing" | "completed" | "unset";

export type BinaryFilter = "pending" | "completed" | "unset";
