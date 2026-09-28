import type { Page } from "@/routes/_authenticated/business/page/page";
import {
  unitId,
  unitProofreadText,
  unitTranslatedText,
} from "@/routes/_authenticated/translator/business/unit/unit";
import type {
  UnitSearchMatch,
  UnitTextPart,
} from "@/routes/_authenticated/translator/business/contract/unit-search-transform";

export const MAX_SELECTED_UNIT_COUNT = 100;

export type MatchSegment = {
  text: string;
  matched: boolean;
};

export type UnitSearchPageGroup = {
  page: Page;
  matches: UnitSearchMatch[];
};

export function normalizeSearchPhrase(phrase: string): string {
  return phrase.replaceAll(/^\p{White_Space}+|\p{White_Space}+$/gu, "");
}

export function unitSearchText(match: UnitSearchMatch, part: UnitTextPart): string {
  if (part === "translatedText") {
    return unitTranslatedText(match.unit) ?? "";
  }

  return unitProofreadText(match.unit) ?? "";
}

export function splitLiteralMatches(text: string, phrase: string): MatchSegment[] {
  if (phrase === "") return [{ text, matched: false }];

  const segments: MatchSegment[] = [];
  let cursor = 0;
  let matchIndex = text.indexOf(phrase, cursor);

  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), matched: false });
    }
    segments.push({ text: phrase, matched: true });
    cursor = matchIndex + phrase.length;
    matchIndex = text.indexOf(phrase, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false });
  }

  return segments;
}

export function groupUnitSearchMatches(
  matches: UnitSearchMatch[],
  pages: Page[],
): UnitSearchPageGroup[] {
  const matchesByPage = new Map<string, UnitSearchMatch[]>();

  for (const match of matches) {
    const pageMatches = matchesByPage.get(match.pageId) ?? [];
    pageMatches.push(match);
    matchesByPage.set(match.pageId, pageMatches);
  }

  return (
    [...pages]
      // The spread above creates a local copy before sorting.
      .sort((left, right) => left.index - right.index)
      .flatMap((page) => {
        const pageMatches = matchesByPage.get(page.id);
        return pageMatches ? [{ page, matches: pageMatches }] : [];
      })
  );
}

export function defaultSelectedUnitIds(matches: UnitSearchMatch[]): Set<string> {
  return new Set(matches.slice(0, MAX_SELECTED_UNIT_COUNT).map((match) => unitId(match.unit)));
}

export function toggleUnitSelection(selectedIds: Set<string>, unitIdValue: string): Set<string> {
  const nextIds = new Set(selectedIds);
  if (nextIds.has(unitIdValue)) {
    nextIds.delete(unitIdValue);
  } else if (nextIds.size < MAX_SELECTED_UNIT_COUNT) {
    nextIds.add(unitIdValue);
  }
  return nextIds;
}

export function togglePageSelection(
  selectedIds: Set<string>,
  matches: UnitSearchMatch[],
): Set<string> {
  const pageUnitIds = matches.map((match) => unitId(match.unit));
  const isAllSelected = pageUnitIds.every((id) => selectedIds.has(id));
  const nextIds = new Set(selectedIds);

  if (isAllSelected) {
    for (const id of pageUnitIds) nextIds.delete(id);
    return nextIds;
  }

  for (const id of pageUnitIds) {
    if (nextIds.size >= MAX_SELECTED_UNIT_COUNT) break;
    nextIds.add(id);
  }
  return nextIds;
}
