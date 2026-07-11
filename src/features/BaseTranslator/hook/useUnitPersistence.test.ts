import { describe, expect, test, vi } from "vitest";

import { buildUnitDiff, persistDirtyUnits } from "./useUnitPersistence";
import type { UnitInfo } from "@/types/unit";
import { normalizeUnitIndexes } from "@/types/unit";

const localUnit: UnitInfo = {
  id: "local_1",
  xCoord: 0.1,
  yCoord: 0.2,
  index: 0,
  isBubble: true,
  isProofread: false,
};

describe("unit save persistence", () => {
  test("reloads authoritative units after save and ignores save mappers", async () => {
    const remoteUnits: UnitInfo[] = [
      {
        id: "unit_from_other_submit",
        xCoord: 0.7,
        yCoord: 0.8,
        index: 0,
        isBubble: false,
        isProofread: true,
      },
      {
        id: "unit_99",
        xCoord: 0.1,
        yCoord: 0.2,
        index: 1,
        isBubble: true,
        isProofread: false,
      },
    ];
    const calls: string[] = [];
    const onSaveUnits = vi.fn(async (_pageId: string, _diff: unknown) => {
      calls.push("save");
    });
    const onReloadUnits = vi.fn(async () => {
      calls.push("reload");
      return remoteUnits;
    });

    const result = await persistDirtyUnits({
      pageId: "page_1",
      currentUnits: [localUnit],
      baselineUnits: [],
      onSaveUnits,
      onReloadUnits,
    });

    expect(result).toEqual({ status: "saved", units: remoteUnits });
    expect(calls).toEqual(["save", "reload"]);
    expect(onSaveUnits.mock.calls[0]?.[1]).toEqual({
      ops: [{
        oper: "create",
        localId: "local_1",
        beforeId: undefined,
        xCoord: 0.1,
        yCoord: 0.2,
        isBubble: true,
        isProofread: false,
        translatedText: null,
        lastTranslatorId: null,
        proofreadText: null,
        lastProofreaderId: null,
      }],
    });
  });

  test("does not save or reload when units are unchanged", async () => {
    const onSaveUnits = vi.fn();
    const onReloadUnits = vi.fn();

    const result = await persistDirtyUnits({
      pageId: "page_1",
      currentUnits: [localUnit],
      baselineUnits: [localUnit],
      onSaveUnits,
      onReloadUnits,
    });

    expect(result).toEqual({ status: "clean" });
    expect(onSaveUnits).not.toHaveBeenCalled();
    expect(onReloadUnits).not.toHaveBeenCalled();
  });

  test("normalizes indexes and expresses order through beforeId opers", () => {
    const baseline = normalizeUnitIndexes([
      { ...localUnit, id: "unit_a", index: 10 },
      { ...localUnit, id: "unit_b", index: 10 },
      { ...localUnit, id: "unit_c", index: 80 },
    ]);
    const current = normalizeUnitIndexes([
      { ...baseline[1], xCoord: 0.5, index: 99 },
      { ...localUnit, id: "local_new", index: 99 },
      { ...baseline[0], index: 5 },
    ]);

    expect(current.map((unit) => unit.index)).toEqual([0, 1, 2]);
    expect(buildUnitDiff(current, baseline)).toEqual({
      ops: [
        { oper: "delete", id: "unit_c" },
        {
          oper: "save",
          id: "unit_a",
          beforeId: undefined,
          xCoord: 0.1,
          yCoord: 0.2,
          isBubble: true,
          isProofread: false,
          translatedText: null,
          lastTranslatorId: null,
          proofreadText: null,
          lastProofreaderId: null,
        },
        {
          oper: "save",
          id: "unit_b",
          beforeId: "unit_a",
          xCoord: 0.5,
          yCoord: 0.2,
          isBubble: true,
          isProofread: false,
          translatedText: null,
          lastTranslatorId: null,
          proofreadText: null,
          lastProofreaderId: null,
        },
        {
          oper: "create",
          localId: "local_new",
          beforeId: "unit_a",
          xCoord: 0.1,
          yCoord: 0.2,
          isBubble: true,
          isProofread: false,
          translatedText: null,
          lastTranslatorId: null,
          proofreadText: null,
          lastProofreaderId: null,
        },
      ],
    });
  });
});
