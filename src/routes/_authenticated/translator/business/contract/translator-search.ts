import type { TranslatorMode } from "@/routes/_authenticated/translator/business/unit/translator-mode";

export type TranslatorReturnRoute = "/workspace" | "/comic-playground";

type TranslatorSearch = {
  returnTo?: TranslatorReturnRoute;
  comicId?: string;
  chapterId?: string;
  readOnly?: string;
};

export type TranslatorReturnDestination =
  | {
      to: "/workspace";
      search: { comicId: string; chapterId: string };
    }
  | {
      to: "/comic-playground";
      search: { comicId: string; chapterId: string };
    };

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export function parseTranslatorSearch(search: Record<string, unknown>): TranslatorSearch {
  const returnTo = search["returnTo"];
  const comicId = nonEmptyString(search["comicId"]);
  const chapterId = nonEmptyString(search["chapterId"]);
  const readOnly = search["readOnly"];

  return {
    ...(returnTo === "/workspace" || returnTo === "/comic-playground" ? { returnTo } : {}),
    ...(comicId === undefined ? {} : { comicId }),
    ...(chapterId === undefined ? {} : { chapterId }),
    ...(typeof readOnly === "string" ? { readOnly } : {}),
  };
}

export function translatorStartMode(search: TranslatorSearch): TranslatorMode | "auto" {
  return search.readOnly === "true" ? "readOnly" : "auto";
}

export function translatorReturnDestination(
  search: TranslatorSearch,
): TranslatorReturnDestination | undefined {
  const { returnTo, comicId, chapterId } = search;
  if (!returnTo || !comicId || !chapterId) return undefined;
  if (comicId.trim() === "" || chapterId.trim() === "") return undefined;
  return {
    to: returnTo,
    search: { comicId, chapterId },
  };
}
