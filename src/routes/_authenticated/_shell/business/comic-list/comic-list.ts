import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/routes/_authenticated/business/comic/comic";

export type ComicTranslationListItem = {
  comicInfo: ComicInfo;
  chapter?: ChapterInfo | undefined;
};

export type TripleFilter = "pending" | "ongoing" | "completed" | "unset";

export type BinaryFilter = "pending" | "completed" | "unset";
