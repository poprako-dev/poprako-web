import { describe, expect, test } from "vitest";
import type { Page } from "@/types/page";
import type { UnitInfo } from "@/types/unit";
import type { UnitSearchMatch } from
  "@/features/BaseTranslator/types/unitSearchTransform";
import {
  MAX_SELECTED_UNIT_COUNT,
  defaultSelectedUnitIds,
  groupUnitSearchMatches,
  normalizeSearchPhrase,
  splitLiteralMatches,
  togglePageSelection,
  toggleUnitSelection,
  unitSearchText,
} from "./searchTransform";

function makePage(id: string, index: number): Page {
  return {
    id,
    chapterId: "chapter-1",
    index,
    imageUrl: "",
    isUploaded: true,
    creatorId: "user-1",
    totalUnitCount: 0,
    translatedUnitCount: 0,
    proofreadUnitCount: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeMatch(
  id: string,
  pageId: string,
  translatedText = "needle",
): UnitSearchMatch {
  const unit: UnitInfo = {
    id,
    index: 0,
    xCoord: 0.5,
    yCoord: 0.5,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
    translatedText,
  };
  return { pageId, unit };
}

describe("unit search transform helpers", () => {
  test("normalizes surrounding Unicode whitespace like the backend", () => {
    expect(normalizeSearchPhrase("\u{85} 旧词\u{3000}")).toBe("旧词");
  });

  test("splits repeated literal matches without interpreting regexp syntax", () => {
    expect(splitLiteralMatches("a.*a.*", ".*")).toEqual([
      { text: "a", matched: false },
      { text: ".*", matched: true },
      { text: "a", matched: false },
      { text: ".*", matched: true },
    ]);
    expect(splitLiteralMatches("猫猫猫", "猫").filter((part) => part.matched))
      .toHaveLength(3);
  });

  test("groups matches by page index while preserving unit response order", () => {
    const matches = [
      makeMatch("unit-3", "page-2"),
      makeMatch("unit-1", "page-1"),
      makeMatch("unit-2", "page-1"),
    ];
    const groups = groupUnitSearchMatches(matches, [
      makePage("page-2", 1),
      makePage("page-1", 0),
    ]);

    expect(groups.map((group) => group.page.id)).toEqual(["page-1", "page-2"]);
    const firstGroup = groups[0];
    if (!firstGroup) {throw new Error("搜索分组缺失");}
    expect(firstGroup.matches.map((match) => match.unit.id)).toEqual([
      "unit-1",
      "unit-2",
    ]);
  });

  test("reads only the selected unit text part", () => {
    const match = makeMatch("unit-1", "page-1", "translated");
    match.unit.proofreadText = "proofread";

    expect(unitSearchText(match, "translatedText")).toBe("translated");
    expect(unitSearchText(match, "proofreadText")).toBe("proofread");
  });

  test("defaults to the first 100 unique units and enforces the limit", () => {
    const matches = Array.from({ length: 102 }, (_, index) =>
      makeMatch(`unit-${String(index)}`, "page-1"),
    );
    const selected = defaultSelectedUnitIds(matches);

    expect(selected).toHaveLength(MAX_SELECTED_UNIT_COUNT);
    expect(selected.has("unit-99")).toBe(true);
    expect(selected.has("unit-100")).toBe(false);
    expect(toggleUnitSelection(selected, "unit-100")).toEqual(selected);
  });

  test("page selection fills remaining capacity and clears a fully selected page", () => {
    const matches = [
      makeMatch("unit-1", "page-1"),
      makeMatch("unit-2", "page-1"),
    ];
    const nearlyFull = new Set(
      Array.from({ length: 99 }, (_, index) => `existing-${String(index)}`),
    );
    const filled = togglePageSelection(nearlyFull, matches);

    expect(filled.size).toBe(MAX_SELECTED_UNIT_COUNT);
    expect(filled.has("unit-1")).toBe(true);
    expect(filled.has("unit-2")).toBe(false);
    expect(togglePageSelection(new Set(["unit-1", "unit-2"]), matches))
      .toEqual(new Set());
  });
});
